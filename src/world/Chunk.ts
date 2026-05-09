export const CHUNK_WIDTH = 16;
export const CHUNK_DEPTH = 16;
export const CHUNK_HEIGHT = 384;

export class Chunk {
  readonly cx: number;
  readonly cz: number;
  private data: Uint16Array;
  skyLight: Uint8Array;
  blockLight: Uint8Array;

  constructor(cx: number, cz: number) {
    this.cx = cx;
    this.cz = cz;
    const size = CHUNK_WIDTH * CHUNK_DEPTH * CHUNK_HEIGHT;
    this.data = new Uint16Array(size);
    this.skyLight = new Uint8Array(size);
    this.blockLight = new Uint8Array(size);
  }

  getBlock(x: number, y: number, z: number): number {
    if (x < 0 || x >= CHUNK_WIDTH || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_DEPTH) {
      return 0;
    }
    return this.data[(y * CHUNK_DEPTH + z) * CHUNK_WIDTH + x];
  }

  setBlock(x: number, y: number, z: number, id: number): void {
    if (x < 0 || x >= CHUNK_WIDTH || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_DEPTH) {
      return;
    }
    this.data[(y * CHUNK_DEPTH + z) * CHUNK_WIDTH + x] = id;
  }

  getSkyLight(x: number, y: number, z: number): number {
    if (x < 0 || x >= CHUNK_WIDTH || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_DEPTH) {
      return 15;
    }
    return this.skyLight[(y * CHUNK_DEPTH + z) * CHUNK_WIDTH + x];
  }

  setSkyLight(x: number, y: number, z: number, value: number): void {
    if (x < 0 || x >= CHUNK_WIDTH || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_DEPTH) {
      return;
    }
    this.skyLight[(y * CHUNK_DEPTH + z) * CHUNK_WIDTH + x] = value;
  }

  getBlockLight(x: number, y: number, z: number): number {
    if (x < 0 || x >= CHUNK_WIDTH || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_DEPTH) {
      return 0;
    }
    return this.blockLight[(y * CHUNK_DEPTH + z) * CHUNK_WIDTH + x];
  }

  setBlockLight(x: number, y: number, z: number, value: number): void {
    if (x < 0 || x >= CHUNK_WIDTH || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_DEPTH) {
      return;
    }
    this.blockLight[(y * CHUNK_DEPTH + z) * CHUNK_WIDTH + x] = value;
  }

  getKey(): string {
    return `${this.cx},${this.cz}`;
  }

  get blocks(): Uint16Array {
    return this.data;
  }

  static fromData(cx: number, cz: number, blocks: Uint16Array, skyLight: Uint8Array, blockLight: Uint8Array): Chunk {
    const chunk = new Chunk(cx, cz);
    chunk.data = blocks;
    chunk.skyLight = skyLight;
    chunk.blockLight = blockLight;
    return chunk;
  }
}
