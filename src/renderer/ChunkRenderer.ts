import type { BlockRegistry } from '../world/BlockType';
import type { World } from '../world/World';
import type { Renderer } from './Renderer';
import { SectionMesh } from './SectionMesh';
import { ChunkMesher } from '../world/ChunkMesher';

export class ChunkRenderer {
  private gl: WebGL2RenderingContext;
  private renderer: Renderer;
  private mesher: ChunkMesher;
  private meshes: Map<string, SectionMesh> = new Map();

  constructor(gl: WebGL2RenderingContext, renderer: Renderer, registry: BlockRegistry, world: World) {
    this.gl = gl;
    this.renderer = renderer;
    this.mesher = new ChunkMesher(registry, world);
  }

  buildSection(cx: number, sectionY: number, cz: number): void {
    const key = `${cx},${sectionY},${cz}`;
    const existing = this.meshes.get(key);
    if (existing) {
      this.renderer.removeSectionMesh(existing);
      existing.dispose();
    }

    const data = this.mesher.buildSectionMesh(cx, sectionY, cz);
    if (!data) {
      this.meshes.delete(key);
      return;
    }

    const mesh = new SectionMesh(this.gl, data);
    this.meshes.set(key, mesh);
    this.renderer.addSectionMesh(mesh, cx, sectionY, cz);
  }

  removeSection(cx: number, sectionY: number, cz: number): void {
    const key = `${cx},${sectionY},${cz}`;
    const mesh = this.meshes.get(key);
    if (mesh) {
      this.renderer.removeSectionMesh(mesh);
      mesh.dispose();
      this.meshes.delete(key);
    }
  }

  removeChunk(cx: number, cz: number): void {
    for (let sectionY = 0; sectionY < 16; sectionY++) {
      this.removeSection(cx, sectionY, cz);
    }
  }

  getMesh(key: string): SectionMesh | undefined {
    return this.meshes.get(key);
  }
}
