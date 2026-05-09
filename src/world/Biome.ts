import { SimplexNoise } from '../utils/SimplexNoise'

export const BiomeType = {
  OCEAN: 0,
  PLAINS: 1,
  DESERT: 2,
  FOREST: 3,
  TAIGA: 4,
  MOUNTAINS: 5,
  SWAMP: 6,
  SNOWY_TUNDRA: 7,
} as const

export type BiomeTypeValue = (typeof BiomeType)[keyof typeof BiomeType]

export interface Biome {
  type: BiomeTypeValue
  name: string
  baseHeight: number
  heightVariation: number
  temperature: number
  rainfall: number
  surfaceBlock: number
  subsurfaceBlock: number
  treeChance: number
}

const BIOMES: Biome[] = [
  { type: BiomeType.OCEAN, name: 'ocean', baseHeight: 30, heightVariation: 5, temperature: 0.5, rainfall: 0.8, surfaceBlock: 7, subsurfaceBlock: 1, treeChance: 0 },
  { type: BiomeType.PLAINS, name: 'plains', baseHeight: 64, heightVariation: 4, temperature: 0.5, rainfall: 0.4, surfaceBlock: 3, subsurfaceBlock: 2, treeChance: 0.005 },
  { type: BiomeType.DESERT, name: 'desert', baseHeight: 63, heightVariation: 3, temperature: 0.9, rainfall: 0.1, surfaceBlock: 6, subsurfaceBlock: 6, treeChance: 0.003 },
  { type: BiomeType.FOREST, name: 'forest', baseHeight: 66, heightVariation: 6, temperature: 0.6, rainfall: 0.5, surfaceBlock: 3, subsurfaceBlock: 2, treeChance: 0.03 },
  { type: BiomeType.TAIGA, name: 'taiga', baseHeight: 68, heightVariation: 8, temperature: 0.2, rainfall: 0.4, surfaceBlock: 3, subsurfaceBlock: 1, treeChance: 0.02 },
  { type: BiomeType.MOUNTAINS, name: 'mountains', baseHeight: 80, heightVariation: 25, temperature: 0.3, rainfall: 0.3, surfaceBlock: 1, subsurfaceBlock: 1, treeChance: 0.001 },
  { type: BiomeType.SWAMP, name: 'swamp', baseHeight: 61, heightVariation: 2, temperature: 0.7, rainfall: 0.7, surfaceBlock: 3, subsurfaceBlock: 2, treeChance: 0.01 },
  { type: BiomeType.SNOWY_TUNDRA, name: 'snowy_tundra', baseHeight: 64, heightVariation: 5, temperature: 0.1, rainfall: 0.3, surfaceBlock: 3, subsurfaceBlock: 2, treeChance: 0.001 },
]

export class BiomeManager {
  private tempNoise: SimplexNoise
  private rainNoise: SimplexNoise
  private biomes: Biome[] = BIOMES

  constructor(seed: number) {
    this.tempNoise = new SimplexNoise(seed)
    this.rainNoise = new SimplexNoise(seed + 100)
  }

  getBiome(wx: number, wz: number): Biome {
    const tempRaw = this.tempNoise.octaveNoise2D(wx * 0.001, wz * 0.001, 4, 0.5, 1.0)
    const rainRaw = this.rainNoise.octaveNoise2D(wx * 0.001 + 500, wz * 0.001 + 500, 4, 0.5, 1.0)
    const temp = Math.max(0, Math.min(1, (tempRaw + 1) * 0.5))
    const rain = Math.max(0, Math.min(1, (rainRaw + 1) * 0.5))

    let biome: Biome
    if (temp < 0.2) {
      biome = rain > 0.3 ? this.biomes[BiomeType.TAIGA] : this.biomes[BiomeType.SNOWY_TUNDRA]
    } else if (temp < 0.5) {
      biome = rain > 0.4 ? this.biomes[BiomeType.FOREST] : this.biomes[BiomeType.PLAINS]
    } else if (temp < 0.7) {
      biome = rain > 0.6 ? this.biomes[BiomeType.SWAMP] : this.biomes[BiomeType.FOREST]
    } else {
      biome = rain < 0.3 ? this.biomes[BiomeType.DESERT] : rain > 0.5 ? this.biomes[BiomeType.MOUNTAINS] : this.biomes[BiomeType.PLAINS]
    }

    if (biome.baseHeight < 40) {
      biome = this.biomes[BiomeType.OCEAN]
    }

    return biome
  }
}
