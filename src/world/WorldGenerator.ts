import { SimplexNoise } from '../utils/SimplexNoise'
import { BiomeManager } from './Biome'
import { Chunk, CHUNK_WIDTH, CHUNK_DEPTH, CHUNK_HEIGHT } from './Chunk'
import type { BlockRegistry } from './BlockRegistry'

const BLOCK_AIR = 0
const BLOCK_STONE = 1
const BLOCK_DIRT = 2
const BLOCK_GRASS = 3
const BLOCK_SAND = 6
const BLOCK_WATER = 7
const BLOCK_OAK_LOG = 9
const BLOCK_OAK_LEAVES = 10
const BLOCK_COAL_ORE = 11
const BLOCK_IRON_ORE = 12
const BLOCK_GOLD_ORE = 13
const BLOCK_DIAMOND_ORE = 14
const BLOCK_BEDROCK = 15
const SEA_LEVEL = 5

export class WorldGenerator {
  private biomeManager: BiomeManager
  private heightNoise: SimplexNoise
  private caveNoise: SimplexNoise
  private caveNoise2: SimplexNoise
  private coalNoise: SimplexNoise
  private ironNoise: SimplexNoise
  private goldNoise: SimplexNoise
  private diamondNoise: SimplexNoise
  private treeNoise: SimplexNoise

  constructor(seed: number, _registry: BlockRegistry, biomeManager: BiomeManager) {
    this.biomeManager = biomeManager
    this.heightNoise = new SimplexNoise(seed)
    this.caveNoise = new SimplexNoise(seed + 100)
    this.caveNoise2 = new SimplexNoise(seed + 200)
    this.coalNoise = new SimplexNoise(seed + 300)
    this.ironNoise = new SimplexNoise(seed + 400)
    this.goldNoise = new SimplexNoise(seed + 500)
    this.diamondNoise = new SimplexNoise(seed + 600)
    this.treeNoise = new SimplexNoise(seed + 700)
  }

  generateChunk(chunk: Chunk): void {
    const cx = chunk.cx
    const cz = chunk.cz

    for (let lx = 0; lx < CHUNK_WIDTH; lx++) {
      for (let lz = 0; lz < CHUNK_DEPTH; lz++) {
        const wx = cx * CHUNK_WIDTH + lx
        const wz = cz * CHUNK_DEPTH + lz
        const biome = this.biomeManager.getBiome(wx, wz)

        const heightVal = this.heightNoise.octaveNoise2D(wx, wz, 6, 0.5, 0.008)
        const surfaceY = Math.floor(biome.baseHeight + heightVal * biome.heightVariation)

        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          if (y === 0) {
            chunk.setBlock(lx, y, lz, BLOCK_BEDROCK)
            continue
          }

          if (y > surfaceY) {
            if (y <= SEA_LEVEL && biome.type !== 0) {
              chunk.setBlock(lx, y, lz, BLOCK_WATER)
            }
            continue
          }

          if (this.isCave(wx, y, wz)) {
            continue
          }

          const oreBlock = this.getOreBlock(wx, y, wz)
          if (oreBlock !== BLOCK_AIR) {
            chunk.setBlock(lx, y, lz, oreBlock)
            continue
          }

          if (y === surfaceY) {
            chunk.setBlock(lx, y, lz, biome.surfaceBlock)
          } else if (y >= surfaceY - 3) {
            chunk.setBlock(lx, y, lz, biome.subsurfaceBlock)
          } else {
            chunk.setBlock(lx, y, lz, BLOCK_STONE)
          }
        }
      }
    }

    this.placeTrees(chunk)
  }

  private isCave(wx: number, y: number, wz: number): boolean {
    if (y < 2 || y > 40) return false
    const n1 = this.caveNoise.noise3D(wx * 0.05, y * 0.05, wz * 0.05)
    const n2 = this.caveNoise2.noise3D(wx * 0.08, y * 0.08, wz * 0.08)
    return n1 * n1 + n2 * n2 < 0.02
  }

  private getOreBlock(wx: number, y: number, wz: number): number {
    if (y <= 80 && this.coalNoise.noise3D(wx * 0.1, y * 0.1, wz * 0.1) > 0.7) return BLOCK_COAL_ORE
    if (y <= 40 && this.ironNoise.noise3D(wx * 0.1, y * 0.1, wz * 0.1) > 0.75) return BLOCK_IRON_ORE
    if (y <= 20 && this.goldNoise.noise3D(wx * 0.15, y * 0.15, wz * 0.15) > 0.82) return BLOCK_GOLD_ORE
    if (y <= 16 && this.diamondNoise.noise3D(wx * 0.15, y * 0.15, wz * 0.15) > 0.88) return BLOCK_DIAMOND_ORE
    return BLOCK_AIR
  }

  private placeTrees(chunk: Chunk): void {
    const cx = chunk.cx
    const cz = chunk.cz

    for (let lx = 2; lx < CHUNK_WIDTH - 2; lx++) {
      for (let lz = 2; lz < CHUNK_DEPTH - 2; lz++) {
        const wx = cx * CHUNK_WIDTH + lx
        const wz = cz * CHUNK_DEPTH + lz
        const biome = this.biomeManager.getBiome(wx, wz)

        if (biome.treeChance <= 0) continue

        const treeVal = this.treeNoise.noise2D(wx * 0.5, wz * 0.5) * 0.5 + 0.5
        if (treeVal > biome.treeChance * 100) continue

        let surfaceY = -1
        for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
          const blockId = chunk.getBlock(lx, y, lz)
          if (blockId === BLOCK_GRASS || blockId === BLOCK_DIRT || blockId === BLOCK_SAND) {
            surfaceY = y
            break
          }
        }

        if (surfaceY < 0 || surfaceY > CHUNK_HEIGHT - 8) continue

        this.placeOakTree(chunk, lx, surfaceY + 1, lz)
      }
    }
  }

  private placeOakTree(chunk: Chunk, x: number, baseY: number, z: number): void {
    for (let dy = 0; dy < 5; dy++) {
      chunk.setBlock(x, baseY + dy, z, BLOCK_OAK_LOG)
    }
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        for (let dy = 3; dy <= 6; dy++) {
          const dist = Math.abs(dx) + Math.abs(dz)
          if (dist > 3) continue
          if (dy === 6 && dist > 1) continue
          if (dy === 5 && dist > 2) continue
          if (dx === 0 && dz === 0 && dy < 5) continue
          const bx = x + dx
          const bz = z + dz
          if (bx < 0 || bx >= CHUNK_WIDTH || bz < 0 || bz >= CHUNK_DEPTH) continue
          if (chunk.getBlock(bx, baseY + dy, bz) === BLOCK_AIR) {
            chunk.setBlock(bx, baseY + dy, bz, BLOCK_OAK_LEAVES)
          }
        }
      }
    }
  }
}
