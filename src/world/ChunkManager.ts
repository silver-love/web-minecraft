import type { World } from './World'
import type { ChunkMesher } from './ChunkMesher'
import type { WorldGenerator } from './WorldGenerator'
import type { LightingEngine } from './Lighting'
import { CHUNK_WIDTH, CHUNK_DEPTH } from './Chunk'
import { ChunkMesh } from '../renderer/ChunkMesh'
import type { Renderer } from '../renderer/Renderer'

export class ChunkManager {
  renderDistance = 8
  chunkMeshes: Map<string, ChunkMesh> = new Map()
  loadedChunks: Set<string> = new Set()
  pendingChunks: Set<string> = new Set()
  generateQueue: string[] = []

  private world: World
  private mesher: ChunkMesher
  private gl: WebGL2RenderingContext
  private renderer: Renderer
  private worldGen: WorldGenerator
  private lighting: LightingEngine

  constructor(
    world: World,
    mesher: ChunkMesher,
    gl: WebGL2RenderingContext,
    renderer: Renderer,
    worldGen: WorldGenerator,
    lighting: LightingEngine
  ) {
    this.world = world
    this.mesher = mesher
    this.gl = gl
    this.renderer = renderer
    this.worldGen = worldGen
    this.lighting = lighting
  }

  update(playerX: number, playerZ: number): void {
    const pcx = Math.floor(playerX / CHUNK_WIDTH)
    const pcz = Math.floor(playerZ / CHUNK_DEPTH)
    const rd = this.renderDistance

    for (let dx = -rd; dx <= rd; dx++) {
      for (let dz = -rd; dz <= rd; dz++) {
        if (dx * dx + dz * dz <= rd * rd) {
          const cx = pcx + dx
          const cz = pcz + dz
          const key = this.getChunkKey(cx, cz)
          if (!this.loadedChunks.has(key) && !this.pendingChunks.has(key) && !this.generateQueue.includes(key)) {
            this.generateQueue.push(key)
          }
        }
      }
    }

    this.generateQueue.sort((a, b) => {
      const [ax, az] = a.split(',').map(Number)
      const [bx, bz] = b.split(',').map(Number)
      return this.getDistance(ax, az, playerX, playerZ) - this.getDistance(bx, bz, playerX, playerZ)
    })

    const unloadDist = rd + 2
    for (const key of [...this.loadedChunks]) {
      const [cx, cz] = key.split(',').map(Number)
      const dx = cx - pcx
      const dz = cz - pcz
      if (dx * dx + dz * dz > unloadDist * unloadDist) {
        this.unloadChunk(key)
      }
    }

    let processed = 0
    while (this.generateQueue.length > 0 && processed < 4) {
      const key = this.generateQueue.shift()!
      if (this.loadedChunks.has(key) || this.pendingChunks.has(key)) continue
      const [cx, cz] = key.split(',').map(Number)
      const dx = cx - pcx
      const dz = cz - pcz
      if (dx * dx + dz * dz > rd * rd) continue
      this.generateChunk(cx, cz)
      processed++
    }
  }

  generateChunk(cx: number, cz: number): void {
    const key = this.getChunkKey(cx, cz)
    const chunk = this.world.getOrCreateChunk(cx, cz)

    this.worldGen.generateChunk(chunk)
    this.lighting.initializeSkyLight(chunk)
    this.lighting.propagateBlockLight(chunk)

    const meshData = this.mesher.buildMesh(
      chunk,
      (wx, wy, wz) => this.world.getBlock(wx, wy, wz),
      (wx, wy, wz) => this.lighting.getSkyLight(wx, wy, wz),
      (wx, wy, wz) => this.lighting.getBlockLight(wx, wy, wz)
    )
    const chunkMesh = new ChunkMesh(this.gl)
    chunkMesh.upload(meshData.positions, meshData.uvs, meshData.lights, meshData.indices)
    this.renderer.addChunkMesh(chunkMesh, cx, cz)
    this.chunkMeshes.set(key, chunkMesh)
    this.loadedChunks.add(key)
  }

  unloadChunk(key: string): void {
    const mesh = this.chunkMeshes.get(key)
    if (mesh) {
      mesh.dispose()
      this.renderer.removeChunkMesh(mesh)
      this.chunkMeshes.delete(key)
    }
    this.world.chunks.delete(key)
    this.loadedChunks.delete(key)
  }

  rebuildChunkAt(wx: number, wz: number): void {
    const [cx, cz] = this.world.worldToChunk(wx, wz)
    const lx = ((wx % CHUNK_WIDTH) + CHUNK_WIDTH) % CHUNK_WIDTH
    const lz = ((wz % CHUNK_DEPTH) + CHUNK_DEPTH) % CHUNK_DEPTH

    this.rebuildChunkMesh(cx, cz)

    if (lx === 0) this.rebuildChunkMesh(cx - 1, cz)
    if (lx === CHUNK_WIDTH - 1) this.rebuildChunkMesh(cx + 1, cz)
    if (lz === 0) this.rebuildChunkMesh(cx, cz - 1)
    if (lz === CHUNK_DEPTH - 1) this.rebuildChunkMesh(cx, cz + 1)
  }

  private rebuildChunkMesh(cx: number, cz: number): void {
    const key = this.getChunkKey(cx, cz)
    if (!this.loadedChunks.has(key)) return

    const chunk = this.world.getChunk(cx, cz)
    if (!chunk) return

    const oldMesh = this.chunkMeshes.get(key)
    if (oldMesh) {
      this.renderer.removeChunkMesh(oldMesh)
      oldMesh.dispose()
    }

    const meshData = this.mesher.buildMesh(
      chunk,
      (wx, wy, wz) => this.world.getBlock(wx, wy, wz),
      (wx, wy, wz) => this.lighting.getSkyLight(wx, wy, wz),
      (wx, wy, wz) => this.lighting.getBlockLight(wx, wy, wz)
    )
    const chunkMesh = new ChunkMesh(this.gl)
    chunkMesh.upload(meshData.positions, meshData.uvs, meshData.lights, meshData.indices)
    this.renderer.addChunkMesh(chunkMesh, cx, cz)
    this.chunkMeshes.set(key, chunkMesh)
  }

  getChunkKey(cx: number, cz: number): string {
    return `${cx},${cz}`
  }

  getDistance(cx: number, cz: number, px: number, pz: number): number {
    const pcx = px / CHUNK_WIDTH
    const pcz = pz / CHUNK_DEPTH
    const dx = cx - pcx
    const dz = cz - pcz
    return Math.sqrt(dx * dx + dz * dz)
  }
}
