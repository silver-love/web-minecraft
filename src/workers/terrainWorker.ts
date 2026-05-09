export {};

const CHUNK_WIDTH = 16;
const CHUNK_DEPTH = 16;
const CHUNK_HEIGHT = 384;

const BLOCK_STONE = 1;
const BLOCK_DIRT = 2;
const BLOCK_GRASS = 3;
const BLOCK_BEDROCK = 15;

function hash(x: number, z: number, seed: number): number {
  let h = seed + Math.imul(x, 374761393) + Math.imul(z, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return h;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function valueNoise(x: number, z: number, seed: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = smoothstep(x - ix);
  const fz = smoothstep(z - iz);
  const v00 = (hash(ix, iz, seed) & 0xffff) / 0xffff;
  const v10 = (hash(ix + 1, iz, seed) & 0xffff) / 0xffff;
  const v01 = (hash(ix, iz + 1, seed) & 0xffff) / 0xffff;
  const v11 = (hash(ix + 1, iz + 1, seed) & 0xffff) / 0xffff;
  return lerp(lerp(v00, v10, fx), lerp(v01, v11, fx), fz);
}

function terrainHeight(wx: number, wz: number, seed: number): number {
  const n = valueNoise(wx * 0.02, wz * 0.02, seed) * 0.6
    + valueNoise(wx * 0.05, wz * 0.05, seed) * 0.3
    + valueNoise(wx * 0.1, wz * 0.1, seed) * 0.1;
  return Math.floor(n * 20 + 5);
}

interface WorkerContext {
  onmessage: ((e: MessageEvent) => void) | null;
  postMessage(message: unknown, transfer: Transferable[]): void;
}

const ctx = self as unknown as WorkerContext;

ctx.onmessage = (e: MessageEvent) => {
  const { type, cx, cz, seed } = e.data as { type: string; cx: number; cz: number; seed: number };
  if (type === 'generate') {
    const data = new Uint16Array(CHUNK_WIDTH * CHUNK_DEPTH * CHUNK_HEIGHT);

    for (let lx = 0; lx < CHUNK_WIDTH; lx++) {
      for (let lz = 0; lz < CHUNK_DEPTH; lz++) {
        const wx = cx * CHUNK_WIDTH + lx;
        const wz = cz * CHUNK_DEPTH + lz;
        const surfaceY = terrainHeight(wx, wz, seed);

        data[lz * CHUNK_WIDTH + lx] = BLOCK_BEDROCK;

        for (let y = 1; y < surfaceY - 1; y++) {
          data[(y * CHUNK_DEPTH + lz) * CHUNK_WIDTH + lx] = BLOCK_STONE;
        }

        if (surfaceY > 1) {
          for (let y = Math.max(1, surfaceY - 1); y < surfaceY; y++) {
            data[(y * CHUNK_DEPTH + lz) * CHUNK_WIDTH + lx] = BLOCK_DIRT;
          }
        }

        data[(surfaceY * CHUNK_DEPTH + lz) * CHUNK_WIDTH + lx] = BLOCK_GRASS;
      }
    }

    ctx.postMessage({ type: 'generated', cx, cz, data }, [data.buffer]);
  }
};
