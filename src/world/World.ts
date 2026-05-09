import { Chunk, CHUNK_WIDTH, CHUNK_DEPTH } from "./Chunk";

export class World {
  chunks: Map<string, Chunk> = new Map();

  getBlock(wx: number, wy: number, wz: number): number {
    const [cx, cz] = this.worldToChunk(wx, wz);
    const chunk = this.getChunk(cx, cz);
    if (!chunk) return 0;
    const lx = ((wx % CHUNK_WIDTH) + CHUNK_WIDTH) % CHUNK_WIDTH;
    const lz = ((wz % CHUNK_DEPTH) + CHUNK_DEPTH) % CHUNK_DEPTH;
    return chunk.getBlock(lx, wy, lz);
  }

  setBlock(wx: number, wy: number, wz: number, id: number): void {
    const [cx, cz] = this.worldToChunk(wx, wz);
    const chunk = this.getOrCreateChunk(cx, cz);
    const lx = ((wx % CHUNK_WIDTH) + CHUNK_WIDTH) % CHUNK_WIDTH;
    const lz = ((wz % CHUNK_DEPTH) + CHUNK_DEPTH) % CHUNK_DEPTH;
    chunk.setBlock(lx, wy, lz, id);
  }

  getChunk(cx: number, cz: number): Chunk | undefined {
    return this.chunks.get(`${cx},${cz}`);
  }

  getOrCreateChunk(cx: number, cz: number): Chunk {
    const key = `${cx},${cz}`;
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = new Chunk(cx, cz);
      this.chunks.set(key, chunk);
    }
    return chunk;
  }

  worldToChunk(wx: number, wz: number): [number, number] {
    const cx = Math.floor(wx / CHUNK_WIDTH);
    const cz = Math.floor(wz / CHUNK_DEPTH);
    return [cx, cz];
  }
}
