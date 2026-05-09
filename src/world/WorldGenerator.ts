import { SimplexNoise } from '../utils/SimplexNoise'
import type { BlockRegistry } from './BlockType'
import { BiomeManager } from './Biome'
import { Chunk, CHUNK_HEIGHT } from './Chunk'

export const SEA_LEVEL = 62

export class WorldGenerator {
  private heightNoise: SimplexNoise
  private detailNoise: SimplexNoise
  private caveNoise: SimplexNoise
  private coalNoise: SimplexNoise
  private ironNoise: SimplexNoise
  private goldNoise: SimplexNoise
  private diamondNoise: SimplexNoise
  private biomeManager: BiomeManager
  private registry: BlockRegistry
  private treeSeed: SimplexNoise

  constructor(seed: number, registry: BlockRegistry, biomeManager: BiomeManager) {
    this.heightNoise = new SimplexNoise(seed)
    this.detailNoise = new SimplexNoise(seed + 1)
    this.caveNoise = new SimplexNoise(seed + 2)
    this.coalNoise = new SimplexNoise(seed + 3)
    this.ironNoise = new SimplexNoise(seed + 4)
    this.goldNoise = new SimplexNoise(seed + 5)
    this.diamondNoise = new SimplexNoise(seed + 6)
    this.treeSeed = new SimplexNoise(seed + 7)
    this.biomeManager = biomeManager
    this.registry = registry
  }

  generateChunk(chunk: Chunk): void {
    const cx = chunk.cx
    const cz = chunk.cz

    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        const wx = cx * 16 + x
        const wz = cz * 16 + z
        const biome = this.biomeManager.getBiome(wx, wz)

        const h1 = this.heightNoise.octaveNoise2D(wx * 0.01, wz * 0.01, 6, 0.5, 1.0)
        const h2 = this.detailNoise.octaveNoise2D(wx * 0.05, wz * 0.05, 3, 0.5, 1.0)
        const baseHeight = biome.baseHeight + h1 * biome.heightVariation + h2 * 3
        const surfaceY = Math.floor(Math.max(1, Math.min(254, baseHeight)))

        for (let y = 0; y <= surfaceY; y++) {
          if (y === 0) {
            chunk.setBlock(x, y, z, 15)
            continue
          }

          if (this.isCave(wx, y, wz)) {
            chunk.setBlock(x, y, z, 0)
            continue
          }

          const ore = this.getOreBlock(wx, y, wz)
          if (ore > 0 && y < surfaceY - 3) {
            chunk.setBlock(x, y, z, ore)
            continue
          }

          if (y < surfaceY - 3) {
            chunk.setBlock(x, y, z, 1)
          } else if (y < surfaceY) {
            chunk.setBlock(x, y, z, biome.subsurfaceBlock)
          } else {
            chunk.setBlock(x, y, z, biome.surfaceBlock)
          }
        }

        if (biome.surfaceBlock !== 7) {
          for (let y = surfaceY + 1; y <= SEA_LEVEL; y++) {
            chunk.setBlock(x, y, z, 7)
          }
        }

        for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
          if (this.registry.isSolid(chunk.getBlock(x, y, z))) {
            for (let sy = y + 1; sy < CHUNK_HEIGHT; sy++) {
              chunk.setSkyLight(x, sy, z, 15)
            }
            break
          }
        }
      }
    }

    this.generateTrees(chunk)
  }

  private isCave(wx: number, y: number, wz: number): boolean {
    if (y < 2 || y > 55) return false
    return this.caveNoise.noise3D(wx * 0.05, y * 0.05, wz * 0.05) > 0.6
  }

  private getOreBlock(wx: number, y: number, wz: number): number {
    if (y <= 80 && this.coalNoise.noise3D(wx * 0.1, y * 0.1, wz * 0.1) > 0.7) return 11
    if (y <= 50 && this.ironNoise.noise3D(wx * 0.1, y * 0.1, wz * 0.1) > 0.75) return 12
    if (y <= 30 && this.goldNoise.noise3D(wx * 0.15, y * 0.15, wz * 0.15) > 0.82) return 13
    if (y <= 16 && this.diamondNoise.noise3D(wx * 0.15, y * 0.15, wz * 0.15) > 0.88) return 14
    return 0
  }

  private generateTrees(chunk: Chunk): void {
    const cx = chunk.cx
    const cz = chunk.cz

    for (let x = 2; x < 14; x++) {
      for (let z = 2; z < 14; z++) {
        const wx = cx * 16 + x
        const wz = cz * 16 + z
        const biome = this.biomeManager.getBiome(wx, wz)

        const treeVal = this.treeSeed.noise2D(wx * 0.5, wz * 0.5)
        const threshold = 1.0 - biome.treeChance * 100
        if (treeVal < threshold) continue

        let surfaceY = -1
        for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
          if (chunk.getBlock(x, y, z) !== 0 && chunk.getBlock(x, y, z) !== 7) {
            surfaceY = y
            break
          }
        }

        if (surfaceY < SEA_LEVEL || surfaceY > CHUNK_HEIGHT - 8) continue

        for (let ty = 1; ty <= 5; ty++) {
          chunk.setBlock(x, surfaceY + ty, z, 9)
        }

        for (let dx = -2; dx <= 2; dx++) {
          for (let dz = -2; dz <= 2; dz++) {
            for (let dy = 3; dy <= 5; dy++) {
              if (dx === 0 && dz === 0 && dy < 5) continue
              const lx = x + dx
              const lz = z + dz
              if (lx < 0 || lx >= 16 || lz < 0 || lz >= 16) continue
              const dist = Math.abs(dx) + Math.abs(dz)
              if (dist > 2) continue
              if (dist === 2 && dy === 5) continue
              if (chunk.getBlock(lx, surfaceY + dy, lz) === 0) {
                chunk.setBlock(lx, surfaceY + dy, lz, 10)
              }
            }
          }
        }
      }
    }
  }
}
