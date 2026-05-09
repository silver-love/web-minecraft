import type { World } from "./World";
import type { WorldGenerator } from "./WorldGenerator";
import type { LightingEngine } from "./Lighting";
import type { ChunkRenderer } from "../renderer/ChunkRenderer";
import { SECTIONS_PER_CHUNK } from "./Chunk";

export class ChunkManager {
  private world: World;
  private worldGen: WorldGenerator;
  private lighting: LightingEngine;
  private chunkRenderer: ChunkRenderer;
  private renderDistance = 6;
  private loadedChunks: Set<string> = new Set();
  private generateQueue: { cx: number; cz: number; dist: number }[] = [];

  constructor(world: World, worldGen: WorldGenerator, lighting: LightingEngine, chunkRenderer: ChunkRenderer) {
    this.world = world;
    this.worldGen = worldGen;
    this.lighting = lighting;
    this.chunkRenderer = chunkRenderer;
  }

  update(playerX: number, playerZ: number): void {
    const pcx = Math.floor(playerX / 16);
    const pcz = Math.floor(playerZ / 16);

    for (let dx = -this.renderDistance; dx <= this.renderDistance; dx++) {
      for (let dz = -this.renderDistance; dz <= this.renderDistance; dz++) {
        if (dx * dx + dz * dz > this.renderDistance * this.renderDistance) continue;
        const cx = pcx + dx;
        const cz = pcz + dz;
        const key = `${cx},${cz}`;
        if (this.loadedChunks.has(key)) continue;
        if (this.generateQueue.some((item) => item.cx === cx && item.cz === cz)) continue;
        this.generateQueue.push({ cx, cz, dist: dx * dx + dz * dz });
      }
    }

    this.generateQueue.sort((a, b) => a.dist - b.dist);

    const toProcess = Math.min(4, this.generateQueue.length);
    for (let i = 0; i < toProcess; i++) {
      const { cx, cz } = this.generateQueue[i];
      const chunk = this.world.getOrCreateChunk(cx, cz);
      this.worldGen.generateChunk(chunk);
      this.lighting.initializeSkyLight(cx, cz);
      for (let sy = 0; sy < SECTIONS_PER_CHUNK; sy++) {
        this.chunkRenderer.buildSection(cx, sy, cz);
      }
      this.loadedChunks.add(`${cx},${cz}`);
    }
    this.generateQueue.splice(0, toProcess);

    const unloadThreshold = this.renderDistance + 2;
    const toUnload: string[] = [];
    for (const key of this.loadedChunks) {
      const parts = key.split(",");
      const cx = Number(parts[0]);
      const cz = Number(parts[1]);
      const dx = cx - pcx;
      const dz = cz - pcz;
      if (dx * dx + dz * dz > unloadThreshold * unloadThreshold) {
        toUnload.push(key);
      }
    }

    for (const key of toUnload) {
      const parts = key.split(",");
      const cx = Number(parts[0]);
      const cz = Number(parts[1]);
      this.chunkRenderer.removeChunk(cx, cz);
      this.world.chunks.delete(key);
      this.loadedChunks.delete(key);
    }
  }

  getLoadedChunkCount(): number {
    return this.loadedChunks.size;
  }
}
