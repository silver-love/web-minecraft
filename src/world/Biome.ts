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

export type BiomeType = (typeof BiomeType)[keyof typeof BiomeType]

export interface Biome {
  type: BiomeType
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
  {
    type: BiomeType.OCEAN, name: 'ocean', baseHeight: 3, heightVariation: 1,
    temperature: 0.5, rainfall: 0.8, surfaceBlock: 7, subsurfaceBlock: 1, treeChance: 0,
  },
  {
    type: BiomeType.PLAINS, name: 'plains', baseHeight: 8, heightVariation: 3,
    temperature: 0.5, rainfall: 0.4, surfaceBlock: 3, subsurfaceBlock: 2, treeChance: 0.005,
  },
  {
    type: BiomeType.DESERT, name: 'desert', baseHeight: 8, heightVariation: 2,
    temperature: 0.9, rainfall: 0.1, surfaceBlock: 6, subsurfaceBlock: 6, treeChance: 0.003,
  },
  {
    type: BiomeType.FOREST, name: 'forest', baseHeight: 9, heightVariation: 4,
    temperature: 0.6, rainfall: 0.5, surfaceBlock: 3, subsurfaceBlock: 2, treeChance: 0.03,
  },
  {
    type: BiomeType.TAIGA, name: 'taiga', baseHeight: 10, heightVariation: 5,
    temperature: 0.2, rainfall: 0.4, surfaceBlock: 3, subsurfaceBlock: 1, treeChance: 0.02,
  },
  {
    type: BiomeType.MOUNTAINS, name: 'mountains', baseHeight: 20, heightVariation: 15,
    temperature: 0.3, rainfall: 0.3, surfaceBlock: 1, subsurfaceBlock: 1, treeChance: 0.001,
  },
  {
    type: BiomeType.SWAMP, name: 'swamp', baseHeight: 6, heightVariation: 1,
    temperature: 0.7, rainfall: 0.7, surfaceBlock: 3, subsurfaceBlock: 2, treeChance: 0.01,
  },
  {
    type: BiomeType.SNOWY_TUNDRA, name: 'snowy_tundra', baseHeight: 8, heightVariation: 3,
    temperature: 0.1, rainfall: 0.3, surfaceBlock: 3, subsurfaceBlock: 2, treeChance: 0.001,
  },
]

export class BiomeManager {
  private tempNoise: SimplexNoise
  private rainNoise: SimplexNoise
  private heightNoise: SimplexNoise

  constructor(seed: number) {
    this.tempNoise = new SimplexNoise(seed)
    this.rainNoise = new SimplexNoise(seed + 1000)
    this.heightNoise = new SimplexNoise(seed + 2000)
  }

  getBiome(wx: number, wz: number): Biome {
    const temp = this.tempNoise.octaveNoise2D(wx, wz, 4, 0.5, 0.002) * 0.5 + 0.5
    const rain = this.rainNoise.octaveNoise2D(wx, wz, 4, 0.5, 0.002) * 0.5 + 0.5
    const heightVal = this.heightNoise.octaveNoise2D(wx, wz, 3, 0.5, 0.003) * 0.5 + 0.5

    if (heightVal < 0.25) return BIOMES[BiomeType.OCEAN]
    if (temp < 0.2) return BIOMES[BiomeType.SNOWY_TUNDRA]
    if (rain < 0.2) return BIOMES[BiomeType.DESERT]
    if (temp > 0.6 && rain > 0.6) return BIOMES[BiomeType.SWAMP]
    if (heightVal > 0.75) return BIOMES[BiomeType.MOUNTAINS]
    if (temp > 0.5 && rain > 0.3) return BIOMES[BiomeType.FOREST]
    if (temp < 0.3 && rain > 0.3) return BIOMES[BiomeType.TAIGA]
    return BIOMES[BiomeType.PLAINS]
  }
}
