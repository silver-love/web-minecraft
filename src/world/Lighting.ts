import { Chunk, CHUNK_WIDTH, CHUNK_DEPTH, CHUNK_HEIGHT } from './Chunk'
import type { World } from './World'
import type { BlockRegistry } from './BlockRegistry'

export class LightingEngine {
  private world: World
  private registry: BlockRegistry

  constructor(world: World, registry: BlockRegistry) {
    this.world = world
    this.registry = registry
  }

  initializeSkyLight(chunk: Chunk): void {
    for (let x = 0; x < CHUNK_WIDTH; x++) {
      for (let z = 0; z < CHUNK_DEPTH; z++) {
        let light = 15
        for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
          const blockId = chunk.getBlock(x, y, z)
          if (blockId !== 0 && !this.registry.isTransparent(blockId)) {
            light = Math.max(0, light - 1)
          }
          chunk.setSkyLight(x, y, z, light)
        }
      }
    }
  }

  propagateBlockLight(chunk: Chunk): void {
    const queue: number[] = []

    for (let x = 0; x < CHUNK_WIDTH; x++) {
      for (let z = 0; z < CHUNK_DEPTH; z++) {
        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          const blockId = chunk.getBlock(x, y, z)
          const emission = this.registry.getLightEmission(blockId)
          if (emission > 0) {
            chunk.setBlockLight(x, y, z, emission)
            queue.push(x, y, z)
          }
        }
      }
    }

    const dirs = [0, 1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1, 1, 0, 0, -1, 0, 0]

    let idx = 0
    while (idx < queue.length) {
      const cx = queue[idx++]
      const cy = queue[idx++]
      const cz = queue[idx++]
      const currentLight = chunk.getBlockLight(cx, cy, cz)
      if (currentLight <= 1) continue

      for (let d = 0; d < 6; d++) {
        const nx = cx + dirs[d * 3]
        const ny = cy + dirs[d * 3 + 1]
        const nz = cz + dirs[d * 3 + 2]

        let neighborLight: number
        if (nx >= 0 && nx < CHUNK_WIDTH && ny >= 0 && ny < CHUNK_HEIGHT && nz >= 0 && nz < CHUNK_DEPTH) {
          neighborLight = chunk.getBlockLight(nx, ny, nz)
          if (neighborLight < currentLight - 1) {
            const nBlockId = chunk.getBlock(nx, ny, nz)
            if (nBlockId === 0 || this.registry.isTransparent(nBlockId)) {
              chunk.setBlockLight(nx, ny, nz, currentLight - 1)
              queue.push(nx, ny, nz)
            }
          }
        }
      }
    }
  }

  updateLightAt(wx: number, _wy: number, wz: number): void {
    const [cx, cz] = this.world.worldToChunk(wx, wz)
    const chunk = this.world.getChunk(cx, cz)
    if (!chunk) return

    this.initializeSkyLight(chunk)
    this.propagateBlockLight(chunk)
  }

  getSkyLight(wx: number, wy: number, wz: number): number {
    const [cx, cz] = this.world.worldToChunk(wx, wz)
    const chunk = this.world.getChunk(cx, cz)
    if (!chunk) return 15
    const lx = ((wx % CHUNK_WIDTH) + CHUNK_WIDTH) % CHUNK_WIDTH
    const lz = ((wz % CHUNK_DEPTH) + CHUNK_DEPTH) % CHUNK_DEPTH
    return chunk.getSkyLight(lx, wy, lz)
  }

  getBlockLight(wx: number, wy: number, wz: number): number {
    const [cx, cz] = this.world.worldToChunk(wx, wz)
    const chunk = this.world.getChunk(cx, cz)
    if (!chunk) return 0
    const lx = ((wx % CHUNK_WIDTH) + CHUNK_WIDTH) % CHUNK_WIDTH
    const lz = ((wz % CHUNK_DEPTH) + CHUNK_DEPTH) % CHUNK_DEPTH
    return chunk.getBlockLight(lx, wy, lz)
  }
}
