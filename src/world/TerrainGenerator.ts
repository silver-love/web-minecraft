import { World } from './World'
import { CHUNK_WIDTH, CHUNK_DEPTH } from './Chunk'

const BLOCK_STONE = 1
const BLOCK_DIRT = 2
const BLOCK_GRASS = 3
const BLOCK_WATER = 7
const BLOCK_GLASS = 8
const BLOCK_OAK_LOG = 9
const BLOCK_OAK_LEAVES = 10
const BLOCK_COAL_ORE = 11
const BLOCK_IRON_ORE = 12
const BLOCK_GOLD_ORE = 13
const BLOCK_DIAMOND_ORE = 14
const BLOCK_BEDROCK = 15

function getHeight(wx: number, wz: number): number {
  const dist = Math.sqrt(wx * wx + wz * wz)
  const hill = Math.max(0, Math.sin(dist * 0.05) * 8 * Math.max(0, 1 - dist / 80))
  return Math.floor(5 + hill)
}

function placeTree(world: World, wx: number, wz: number, baseY: number): void {
  for (let dy = 0; dy < 5; dy++) {
    world.setBlock(wx, baseY + dy, wz, BLOCK_OAK_LOG)
  }
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      for (let dy = 3; dy <= 6; dy++) {
        const dist = Math.abs(dx) + Math.abs(dz)
        if (dist > 3) continue
        if (dy === 6 && dist > 1) continue
        if (dy === 5 && dist > 2) continue
        if (dx === 0 && dz === 0 && dy < 5) continue
        world.setBlock(wx + dx, baseY + dy, wz + dz, BLOCK_OAK_LEAVES)
      }
    }
  }
}

export function generateTestTerrain(world: World, radius: number): void {
  for (let cx = -radius; cx <= radius; cx++) {
    for (let cz = -radius; cz <= radius; cz++) {
      world.getOrCreateChunk(cx, cz)
    }
  }

  for (let cx = -radius; cx <= radius; cx++) {
    for (let cz = -radius; cz <= radius; cz++) {
      for (let lx = 0; lx < CHUNK_WIDTH; lx++) {
        for (let lz = 0; lz < CHUNK_DEPTH; lz++) {
          const wx = cx * CHUNK_WIDTH + lx
          const wz = cz * CHUNK_DEPTH + lz
          const surfaceY = getHeight(wx, wz)

          world.setBlock(wx, 0, wz, BLOCK_BEDROCK)

          for (let y = 1; y < surfaceY - 1; y++) {
            world.setBlock(wx, y, wz, BLOCK_STONE)
          }

          if (surfaceY > 1) {
            for (let y = Math.max(1, surfaceY - 1); y < surfaceY; y++) {
              world.setBlock(wx, y, wz, BLOCK_DIRT)
            }
          }

          world.setBlock(wx, surfaceY, wz, BLOCK_GRASS)
        }
      }
    }
  }

  const centerX = 0
  const centerZ = 0
  const centerH = getHeight(centerX, centerZ)
  placeTree(world, 10, 10, getHeight(10, 10) + 1)
  placeTree(world, -15, 5, getHeight(-15, 5) + 1)
  placeTree(world, 25, -20, getHeight(25, -20) + 1)
  placeTree(world, -30, -25, getHeight(-30, -25) + 1)
  placeTree(world, 40, 15, getHeight(40, 15) + 1)

  const waterX = 20
  const waterZ = 20
  const waterLevel = 5
  for (let dx = -3; dx <= 3; dx++) {
    for (let dz = -3; dz <= 3; dz++) {
      if (dx * dx + dz * dz > 12) continue
      const wx = waterX + dx
      const wz = waterZ + dz
      for (let y = waterLevel; y <= waterLevel + 1; y++) {
        world.setBlock(wx, y, wz, BLOCK_WATER)
      }
      world.setBlock(wx, waterLevel - 1, wz, BLOCK_WATER)
    }
  }

  const glassX = -10
  const glassZ = -10
  const glassBase = getHeight(glassX, glassZ) + 1
  for (let dx = 0; dx < 3; dx++) {
    for (let dy = 0; dy < 3; dy++) {
      world.setBlock(glassX + dx, glassBase + dy, glassZ, BLOCK_GLASS)
      world.setBlock(glassX, glassBase + dy, glassZ + dx, BLOCK_GLASS)
      world.setBlock(glassX + 2, glassBase + dy, glassZ + dx, BLOCK_GLASS)
    }
    world.setBlock(glassX + dx, glassBase + 3, glassZ, BLOCK_GLASS)
    world.setBlock(glassX, glassBase + 3, glassZ + dx, BLOCK_GLASS)
    world.setBlock(glassX + 2, glassBase + 3, glassZ + dx, BLOCK_GLASS)
  }

  world.setBlock(5, 2, 5, BLOCK_COAL_ORE)
  world.setBlock(5, 2, 6, BLOCK_COAL_ORE)
  world.setBlock(-8, 3, -3, BLOCK_IRON_ORE)
  world.setBlock(-8, 3, -2, BLOCK_IRON_ORE)
  world.setBlock(15, 1, 15, BLOCK_GOLD_ORE)
  world.setBlock(15, 1, 16, BLOCK_GOLD_ORE)
  world.setBlock(-20, 2, 10, BLOCK_DIAMOND_ORE)
  world.setBlock(-20, 2, 11, BLOCK_DIAMOND_ORE)

  void centerH
}

export function generateFlatWorld(world: World, radius: number): void {
  for (let cx = -radius; cx <= radius; cx++) {
    for (let cz = -radius; cz <= radius; cz++) {
      world.getOrCreateChunk(cx, cz)
    }
  }

  for (let cx = -radius; cx <= radius; cx++) {
    for (let cz = -radius; cz <= radius; cz++) {
      for (let lx = 0; lx < CHUNK_WIDTH; lx++) {
        for (let lz = 0; lz < CHUNK_DEPTH; lz++) {
          const wx = cx * CHUNK_WIDTH + lx
          const wz = cz * CHUNK_DEPTH + lz
          world.setBlock(wx, 0, wz, BLOCK_BEDROCK)
          for (let y = 1; y <= 3; y++) {
            world.setBlock(wx, y, wz, BLOCK_DIRT)
          }
          world.setBlock(wx, 4, wz, BLOCK_GRASS)
        }
      }
    }
  }
}
