import type { BlockRegistry } from './BlockType';
import type { World } from './World';
import { SECTION_HEIGHT } from './Chunk';

export interface MeshData {
  vertices: Float32Array;
  indices: Uint32Array;
}

const FACE_OFFSETS: [number, number, number][] = [
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
  [1, 0, 0],
  [-1, 0, 0],
];

const FACE_VERTICES: [number, number, number, number, number][][] = [
  [[0,1,0, 0,0], [0,1,1, 0,1], [1,1,1, 1,1], [1,1,0, 1,0]],
  [[0,0,0, 0,0], [1,0,0, 1,0], [1,0,1, 1,1], [0,0,1, 0,1]],
  [[0,0,1, 0,1], [1,0,1, 1,1], [1,1,1, 1,0], [0,1,1, 0,0]],
  [[1,0,0, 0,1], [0,0,0, 1,1], [0,1,0, 1,0], [1,1,0, 0,0]],
  [[1,0,1, 0,1], [1,0,0, 1,1], [1,1,0, 1,0], [1,1,1, 0,0]],
  [[0,0,0, 0,1], [0,0,1, 1,1], [0,1,1, 1,0], [0,1,0, 0,0]],
];

export class ChunkMesher {
  private registry: BlockRegistry;
  private world: World;

  constructor(registry: BlockRegistry, world: World) {
    this.registry = registry;
    this.world = world;
  }

  buildSectionMesh(cx: number, sectionY: number, cz: number): MeshData | null {
    const vertices: number[] = [];
    const indices: number[] = [];
    let vertexCount = 0;

    const chunk = this.world.getChunk(cx, cz);

    for (let ly = 0; ly < SECTION_HEIGHT; ly++) {
      const wy = sectionY * SECTION_HEIGHT + ly;
      for (let lz = 0; lz < 16; lz++) {
        const wz = cz * 16 + lz;
        for (let lx = 0; lx < 16; lx++) {
          const wx = cx * 16 + lx;
          const blockId = this.world.getBlock(wx, wy, wz);
          if (blockId === 0) continue;

          const blockType = this.registry.get(blockId);
          const skyLight = chunk ? chunk.getSkyLight(lx, wy, lz) / 15 : 1;
          const blockLight = chunk ? chunk.getBlockLight(lx, wy, lz) / 15 : 0;

          for (let face = 0; face < 6; face++) {
            const [dx, dy, dz] = FACE_OFFSETS[face];
            const neighborId = this.world.getBlock(wx + dx, wy + dy, wz + dz);

            if (!this.registry.isTransparent(neighborId)) continue;
            if (neighborId === blockId && blockType.name !== 'water') continue;

            const texIdx = blockType.textureIndices
              ? blockType.textureIndices[face]
              : blockType.textureIndex;
            const tileCol = texIdx % 16;
            const tileRow = Math.floor(texIdx / 16);

            const faceVerts = FACE_VERTICES[face];
            for (let v = 0; v < 4; v++) {
              const [ox, oy, oz, localU, localV] = faceVerts[v];
              const u = (tileCol + localU) / 16;
              const vCoord = 1 - (tileRow + 1 - localV) / 16;
              vertices.push(wx + ox, wy + oy, wz + oz, u, vCoord, skyLight, blockLight);
            }

            indices.push(
              vertexCount, vertexCount + 1, vertexCount + 2,
              vertexCount, vertexCount + 2, vertexCount + 3,
            );
            vertexCount += 4;
          }
        }
      }
    }

    if (vertices.length === 0) return null;

    return {
      vertices: new Float32Array(vertices),
      indices: new Uint32Array(indices),
    };
  }
}
