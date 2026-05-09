export const CHUNK_WIDTH = 16;
export const CHUNK_DEPTH = 16;
export const CHUNK_HEIGHT = 256;
export const SECTION_HEIGHT = 16;
export const SECTIONS_PER_CHUNK = 16;

const VOLUME = CHUNK_WIDTH * CHUNK_DEPTH * CHUNK_HEIGHT;

export class Chunk {
  readonly cx: number;
  readonly cz: number;
  private data: Uint16Array;
  skyLight: Uint8Array;
  blockLight: Uint8Array;

  constructor(cx: number, cz: number) {
    this.cx = cx;
    this.cz = cz;
    this.data = new Uint16Array(VOLUME);
    this.skyLight = new Uint8Array(VOLUME);
    this.blockLight = new Uint8Array(VOLUME);
  }

  private index(x: number, y: number, z: number): number {
    return (y * CHUNK_DEPTH + z) * CHUNK_WIDTH + x;
  }

  getBlock(x: number, y: number, z: number): number {
    if (x < 0 || x >= CHUNK_WIDTH || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_DEPTH) {
      return 0;
    }
    return this.data[this.index(x, y, z)];
  }

  setBlock(x: number, y: number, z: number, id: number): void {
    if (x < 0 || x >= CHUNK_WIDTH || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_DEPTH) {
      return;
    }
    this.data[this.index(x, y, z)] = id;
  }

  getSkyLight(x: number, y: number, z: number): number {
    if (x < 0 || x >= CHUNK_WIDTH || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_DEPTH) {
      return 15;
    }
    return this.skyLight[this.index(x, y, z)];
  }

  setSkyLight(x: number, y: number, z: number, value: number): void {
    if (x < 0 || x >= CHUNK_WIDTH || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_DEPTH) {
      return;
    }
    this.skyLight[this.index(x, y, z)] = value;
  }

  getBlockLight(x: number, y: number, z: number): number {
    if (x < 0 || x >= CHUNK_WIDTH || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_DEPTH) {
      return 0;
    }
    return this.blockLight[this.index(x, y, z)];
  }

  setBlockLight(x: number, y: number, z: number, value: number): void {
    if (x < 0 || x >= CHUNK_WIDTH || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_DEPTH) {
      return;
    }
    this.blockLight[this.index(x, y, z)] = value;
  }

  getKey(): string {
    return `${this.cx},${this.cz}`;
  }

  static fromData(cx: number, cz: number, blocks: Uint16Array, skyLight: Uint8Array, blockLight: Uint8Array): Chunk {
    const chunk = new Chunk(cx, cz);
    chunk.data = blocks;
    chunk.skyLight = skyLight;
    chunk.blockLight = blockLight;
    return chunk;
  }
}
