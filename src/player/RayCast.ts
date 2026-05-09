import type { World } from '../world/World'
import type { BlockRegistry } from '../world/BlockRegistry'

export function rayCast(
  world: World,
  registry: BlockRegistry,
  origin: [number, number, number],
  direction: [number, number, number],
  maxDistance: number
): { hit: boolean; blockX: number; blockY: number; blockZ: number; prevX: number; prevY: number; prevZ: number; distance: number } {
  let x = Math.floor(origin[0])
  let y = Math.floor(origin[1])
  let z = Math.floor(origin[2])

  const stepX = direction[0] >= 0 ? 1 : -1
  const stepY = direction[1] >= 0 ? 1 : -1
  const stepZ = direction[2] >= 0 ? 1 : -1

  const tDeltaX = direction[0] !== 0 ? Math.abs(1 / direction[0]) : Infinity
  const tDeltaY = direction[1] !== 0 ? Math.abs(1 / direction[1]) : Infinity
  const tDeltaZ = direction[2] !== 0 ? Math.abs(1 / direction[2]) : Infinity

  let tMaxX = direction[0] !== 0
    ? ((stepX > 0 ? (x + 1 - origin[0]) : (origin[0] - x)) * tDeltaX)
    : Infinity
  let tMaxY = direction[1] !== 0
    ? ((stepY > 0 ? (y + 1 - origin[1]) : (origin[1] - y)) * tDeltaY)
    : Infinity
  let tMaxZ = direction[2] !== 0
    ? ((stepZ > 0 ? (z + 1 - origin[2]) : (origin[2] - z)) * tDeltaZ)
    : Infinity

  let prevX = x
  let prevY = y
  let prevZ = z
  let t = 0

  while (t < maxDistance) {
    const blockId = world.getBlock(x, y, z)
    if (blockId !== 0 && registry.isSolid(blockId)) {
      return { hit: true, blockX: x, blockY: y, blockZ: z, prevX, prevY, prevZ, distance: t }
    }

    prevX = x
    prevY = y
    prevZ = z

    if (tMaxX < tMaxY) {
      if (tMaxX < tMaxZ) {
        t = tMaxX
        tMaxX += tDeltaX
        x += stepX
      } else {
        t = tMaxZ
        tMaxZ += tDeltaZ
        z += stepZ
      }
    } else {
      if (tMaxY < tMaxZ) {
        t = tMaxY
        tMaxY += tDeltaY
        y += stepY
      } else {
        t = tMaxZ
        tMaxZ += tDeltaZ
        z += stepZ
      }
    }
  }

  return { hit: false, blockX: x, blockY: y, blockZ: z, prevX, prevY, prevZ, distance: maxDistance }
}
