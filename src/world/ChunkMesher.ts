import type { MeshData } from './MeshData'
import { BlockRegistry } from './BlockRegistry'
import { Chunk, CHUNK_WIDTH, CHUNK_HEIGHT, CHUNK_DEPTH } from './Chunk'

const FACE_VERTICES: number[][] = [
  [0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1],
  [0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0],
  [1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 0, 1],
  [1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1],
  [0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0],
]

const FACE_UVS: number[][] = [
  [0, 0, 0, 1, 1, 1, 1, 0],
  [0, 0, 1, 0, 1, 1, 0, 1],
  [0, 0, 0, 1, 1, 1, 1, 0],
  [0, 0, 0, 1, 1, 1, 1, 0],
  [0, 0, 0, 1, 1, 1, 1, 0],
  [0, 0, 0, 1, 1, 1, 1, 0],
]

const FACE_DIRS: number[][] = [
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, -1],
  [0, 0, 1],
  [1, 0, 0],
  [-1, 0, 0],
]

const ATLAS_SIZE = 16
const UV_UNIT = 1 / ATLAS_SIZE

export class ChunkMesher {
  private registry: BlockRegistry

  constructor(registry: BlockRegistry) {
    this.registry = registry
  }

  buildMesh(
    chunk: Chunk,
    getNeighborBlock: (wx: number, wy: number, wz: number) => number,
    getSkyLight: (wx: number, wy: number, wz: number) => number,
    getBlockLight: (wx: number, wy: number, wz: number) => number
  ): MeshData {
    const positions: number[] = []
    const uvs: number[] = []
    const lights: number[] = []
    const indices: number[] = []
    let vertexCount = 0

    const worldX = chunk.cx * CHUNK_WIDTH
    const worldZ = chunk.cz * CHUNK_DEPTH

    for (let y = 0; y < CHUNK_HEIGHT; y++) {
      for (let z = 0; z < CHUNK_DEPTH; z++) {
        for (let x = 0; x < CHUNK_WIDTH; x++) {
          const blockId = chunk.getBlock(x, y, z)
          if (blockId === 0) continue

          const blockType = this.registry.get(blockId)

          for (let face = 0; face < 6; face++) {
            const dir = FACE_DIRS[face]
            const nx = x + dir[0]
            const ny = y + dir[1]
            const nz = z + dir[2]

            let neighborId: number
            if (nx >= 0 && nx < CHUNK_WIDTH && ny >= 0 && ny < CHUNK_HEIGHT && nz >= 0 && nz < CHUNK_DEPTH) {
              neighborId = chunk.getBlock(nx, ny, nz)
            } else {
              neighborId = getNeighborBlock(worldX + nx, ny, worldZ + nz)
            }

            if (!this.registry.isTransparent(neighborId)) continue

            const textureIndex = blockType.textureIndices
              ? blockType.textureIndices[face]
              : blockType.textureIndex

            const uOffset = (textureIndex % ATLAS_SIZE) * UV_UNIT
            const vOffset = Math.floor(textureIndex / ATLAS_SIZE) * UV_UNIT

            const faceVerts = FACE_VERTICES[face]
            const faceUvs = FACE_UVS[face]

            const faceSkyLight = this.computeFaceLight(
              x, y, z, face, getSkyLight, worldX, worldZ
            )
            const faceBlockLight = this.computeFaceLight(
              x, y, z, face, getBlockLight, worldX, worldZ
            )

            for (let v = 0; v < 4; v++) {
              positions.push(
                worldX + x + faceVerts[v * 3],
                y + faceVerts[v * 3 + 1],
                worldZ + z + faceVerts[v * 3 + 2],
              )
              uvs.push(
                uOffset + faceUvs[v * 2] * UV_UNIT,
                vOffset + faceUvs[v * 2 + 1] * UV_UNIT,
              )
              lights.push(faceSkyLight[v] / 15, faceBlockLight[v] / 15)
            }

            indices.push(
              vertexCount, vertexCount + 1, vertexCount + 2,
              vertexCount, vertexCount + 2, vertexCount + 3,
            )
            vertexCount += 4
          }
        }
      }
    }

    return {
      positions: new Float32Array(positions),
      uvs: new Float32Array(uvs),
      lights: new Float32Array(lights),
      indices: new Uint32Array(indices),
    }
  }

  private computeFaceLight(
    x: number, y: number, z: number, face: number,
    getLight: (wx: number, wy: number, wz: number) => number,
    worldX: number, worldZ: number
  ): number[] {
    const wx = worldX + x
    const wz = worldZ + z

    if (face === 0) {
      return [
        (getLight(wx - 1, y + 1, wz - 1) + getLight(wx, y + 1, wz - 1) + getLight(wx - 1, y + 1, wz) + getLight(wx, y + 1, wz)) / 4,
        (getLight(wx - 1, y + 1, wz) + getLight(wx, y + 1, wz) + getLight(wx - 1, y + 1, wz + 1) + getLight(wx, y + 1, wz + 1)) / 4,
        (getLight(wx, y + 1, wz) + getLight(wx + 1, y + 1, wz) + getLight(wx, y + 1, wz + 1) + getLight(wx + 1, y + 1, wz + 1)) / 4,
        (getLight(wx, y + 1, wz - 1) + getLight(wx + 1, y + 1, wz - 1) + getLight(wx, y + 1, wz) + getLight(wx + 1, y + 1, wz)) / 4,
      ]
    }
    if (face === 1) {
      return [
        (getLight(wx - 1, y, wz - 1) + getLight(wx, y, wz - 1) + getLight(wx - 1, y, wz) + getLight(wx, y, wz)) / 4,
        (getLight(wx - 1, y, wz) + getLight(wx, y, wz) + getLight(wx - 1, y, wz + 1) + getLight(wx, y, wz + 1)) / 4,
        (getLight(wx, y, wz) + getLight(wx + 1, y, wz) + getLight(wx, y, wz + 1) + getLight(wx + 1, y, wz + 1)) / 4,
        (getLight(wx, y, wz - 1) + getLight(wx + 1, y, wz - 1) + getLight(wx, y, wz) + getLight(wx + 1, y, wz)) / 4,
      ]
    }
    if (face === 2) {
      return [
        (getLight(wx - 1, y, wz) + getLight(wx, y, wz) + getLight(wx - 1, y + 1, wz) + getLight(wx, y + 1, wz)) / 4,
        (getLight(wx, y, wz) + getLight(wx + 1, y, wz) + getLight(wx, y + 1, wz) + getLight(wx + 1, y + 1, wz)) / 4,
        (getLight(wx, y + 1, wz) + getLight(wx + 1, y + 1, wz) + getLight(wx, y + 1, wz) + getLight(wx + 1, y + 1, wz)) / 4,
        (getLight(wx - 1, y + 1, wz) + getLight(wx, y + 1, wz) + getLight(wx - 1, y, wz) + getLight(wx, y, wz)) / 4,
      ]
    }
    if (face === 3) {
      return [
        (getLight(wx, y, wz + 1) + getLight(wx + 1, y, wz + 1) + getLight(wx, y + 1, wz + 1) + getLight(wx + 1, y + 1, wz + 1)) / 4,
        (getLight(wx - 1, y, wz + 1) + getLight(wx, y, wz + 1) + getLight(wx - 1, y + 1, wz + 1) + getLight(wx, y + 1, wz + 1)) / 4,
        (getLight(wx - 1, y + 1, wz + 1) + getLight(wx, y + 1, wz + 1) + getLight(wx - 1, y, wz + 1) + getLight(wx, y, wz + 1)) / 4,
        (getLight(wx, y + 1, wz + 1) + getLight(wx + 1, y + 1, wz + 1) + getLight(wx, y, wz + 1) + getLight(wx + 1, y, wz + 1)) / 4,
      ]
    }
    if (face === 4) {
      return [
        (getLight(wx + 1, y, wz - 1) + getLight(wx + 1, y, wz) + getLight(wx + 1, y + 1, wz - 1) + getLight(wx + 1, y + 1, wz)) / 4,
        (getLight(wx + 1, y, wz) + getLight(wx + 1, y, wz + 1) + getLight(wx + 1, y + 1, wz) + getLight(wx + 1, y + 1, wz + 1)) / 4,
        (getLight(wx + 1, y + 1, wz) + getLight(wx + 1, y + 1, wz + 1) + getLight(wx + 1, y, wz) + getLight(wx + 1, y, wz + 1)) / 4,
        (getLight(wx + 1, y + 1, wz - 1) + getLight(wx + 1, y + 1, wz) + getLight(wx + 1, y, wz - 1) + getLight(wx + 1, y, wz)) / 4,
      ]
    }
    return [
      (getLight(wx, y, wz) + getLight(wx, y, wz - 1) + getLight(wx, y + 1, wz) + getLight(wx, y + 1, wz - 1)) / 4,
      (getLight(wx, y, wz) + getLight(wx, y, wz + 1) + getLight(wx, y + 1, wz) + getLight(wx, y + 1, wz + 1)) / 4,
      (getLight(wx, y + 1, wz) + getLight(wx, y + 1, wz + 1) + getLight(wx, y, wz) + getLight(wx, y, wz + 1)) / 4,
      (getLight(wx, y + 1, wz - 1) + getLight(wx, y + 1, wz) + getLight(wx, y, wz - 1) + getLight(wx, y, wz)) / 4,
    ]
  }
}
