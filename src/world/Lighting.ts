import type { BlockRegistry } from './BlockType'
import type { World } from './World'
import { CHUNK_HEIGHT } from './Chunk'

export class LightingEngine {
  private world: World
  private registry: BlockRegistry

  constructor(world: World, registry: BlockRegistry) {
    this.world = world
    this.registry = registry
  }

  initializeSkyLight(chunkX: number, chunkZ: number): void {
    const chunk = this.world.getChunk(chunkX, chunkZ)
    if (!chunk) return

    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        let light = 15
        for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
          if (light > 0 && this.registry.isSolid(chunk.getBlock(x, y, z))) {
            light = 0
          }
          chunk.setSkyLight(x, y, z, light)
        }
      }
    }
  }

  propagateBlockLight(x: number, y: number, z: number): void {
    const emission = this.registry.getLightEmission(this.world.getBlock(x, y, z))
    if (emission <= 0) return

    const queue: { x: number; y: number; z: number; level: number }[] = [{ x, y, z, level: emission }]
    const visited = new Set<string>()
    visited.add(`${x},${y},${z}`)

    while (queue.length > 0) {
      const current = queue.shift()!

      const dirs = [
        [1, 0, 0], [-1, 0, 0],
        [0, 1, 0], [0, -1, 0],
        [0, 0, 1], [0, 0, -1],
      ]

      for (const [dx, dy, dz] of dirs) {
        const nx = current.x + dx
        const ny = current.y + dy
        const nz = current.z + dz
        const key = `${nx},${ny},${nz}`

        if (visited.has(key)) continue
        if (ny < 0 || ny >= CHUNK_HEIGHT) continue

        const neighborId = this.world.getBlock(nx, ny, nz)
        if (this.registry.isSolid(neighborId) && !this.registry.isTransparent(neighborId)) continue

        const newLevel = current.level - 1
        if (newLevel <= 0) continue

        visited.add(key)

        const [cx, cz] = this.world.worldToChunk(nx, nz)
        const chunk = this.world.getChunk(cx, cz)
        if (chunk) {
          const lx = ((nx % 16) + 16) % 16
          const lz = ((nz % 16) + 16) % 16
          if (chunk.getBlockLight(lx, ny, lz) < newLevel) {
            chunk.setBlockLight(lx, ny, lz, newLevel)
            queue.push({ x: nx, y: ny, z: nz, level: newLevel })
          }
        }
      }
    }
  }

  updateLightAt(wx: number, wy: number, wz: number): void {
    const [cx, cz] = this.world.worldToChunk(wx, wz)
    this.initializeSkyLight(cx, cz)

    if (this.registry.getLightEmission(this.world.getBlock(wx, wy, wz)) > 0) {
      this.propagateBlockLight(wx, wy, wz)
    }
  }
}
