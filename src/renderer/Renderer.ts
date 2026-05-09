import { createShaderProgram } from './Shader';
import { Camera } from './Camera';
import blockVertSource from './shaders/block.vert.glsl?raw';
import blockFragSource from './shaders/block.frag.glsl?raw';

export interface SectionMeshEntry {
  mesh: { draw(): void; dispose(): void; indexCount: number };
  cx: number;
  cy: number;
  cz: number;
}

export class Renderer {
  private gl: WebGL2RenderingContext;
  private blockProgram: WebGLProgram;
  private textureAtlas: WebGLTexture | null = null;
  private sectionEntries: SectionMeshEntry[] = [];
  camera: Camera;
  private fogColor: [number, number, number] = [0.53, 0.81, 0.92];
  private fogNear = 80;
  private fogFar = 200;
  private timeOfDay = 0;
  private uProjection: WebGLUniformLocation | null;
  private uView: WebGLUniformLocation | null;
  private uTexture: WebGLUniformLocation | null;
  private uFogColor: WebGLUniformLocation | null;
  private uFogNear: WebGLUniformLocation | null;
  private uFogFar: WebGLUniformLocation | null;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.blockProgram = createShaderProgram(gl, blockVertSource, blockFragSource);
    this.camera = new Camera();
    this.uProjection = gl.getUniformLocation(this.blockProgram, 'uProjection');
    this.uView = gl.getUniformLocation(this.blockProgram, 'uView');
    this.uTexture = gl.getUniformLocation(this.blockProgram, 'uTexture');
    this.uFogColor = gl.getUniformLocation(this.blockProgram, 'uFogColor');
    this.uFogNear = gl.getUniformLocation(this.blockProgram, 'uFogNear');
    this.uFogFar = gl.getUniformLocation(this.blockProgram, 'uFogFar');
    gl.enable(gl.DEPTH_TEST);
  }

  setTextureAtlas(texture: WebGLTexture): void {
    this.textureAtlas = texture;
  }

  setCamera(pos: [number, number, number], yaw: number, pitch: number, fov: number, aspect: number): void {
    this.camera.position = pos;
    this.camera.yaw = yaw;
    this.camera.pitch = pitch;
    this.camera.fov = fov;
    this.camera.aspect = aspect;
    this.camera.update();
  }

  beginFrame(): void {
    this.updateFogColor();
    const gl = this.gl;
    gl.clearColor(this.fogColor[0], this.fogColor[1], this.fogColor[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  endFrame(): void {}

  addSectionMesh(mesh: { draw(): void; dispose(): void; indexCount: number }, cx: number, cy: number, cz: number): void {
    this.sectionEntries.push({ mesh, cx, cy, cz });
  }

  removeSectionMesh(mesh: { draw(): void; dispose(): void; indexCount: number }): void {
    this.sectionEntries = this.sectionEntries.filter(e => e.mesh !== mesh);
  }

  renderSections(): void {
    for (const entry of this.sectionEntries) {
      const minX = entry.cx * 16;
      const minY = entry.cy * 16;
      const minZ = entry.cz * 16;
      const maxX = minX + 16;
      const maxY = minY + 16;
      const maxZ = minZ + 16;
      if (this.isAABBInFrustum(minX, minY, minZ, maxX, maxY, maxZ)) {
        this.drawSectionMesh(entry.mesh);
      }
    }
  }

  setTimeOfDay(t: number): void {
    this.timeOfDay = t;
  }

  drawSectionMesh(mesh: { draw(): void; dispose(): void; indexCount: number }): void {
    const gl = this.gl;
    gl.useProgram(this.blockProgram);
    gl.uniformMatrix4fv(this.uProjection, false, this.camera.getProjectionMatrix());
    gl.uniformMatrix4fv(this.uView, false, this.camera.getViewMatrix());
    gl.uniform1i(this.uTexture, 0);
    gl.uniform3f(this.uFogColor, this.fogColor[0], this.fogColor[1], this.fogColor[2]);
    gl.uniform1f(this.uFogNear, this.fogNear);
    gl.uniform1f(this.uFogFar, this.fogFar);
    if (this.textureAtlas) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.textureAtlas);
    }
    mesh.draw();
  }

  private updateFogColor(): void {
    const daylight = Math.cos(this.timeOfDay * 2 * Math.PI) * 0.5 + 0.5;
    const dayR = 0.53, dayG = 0.81, dayB = 0.92;
    const nightR = 0.01, nightG = 0.01, nightB = 0.05;
    this.fogColor = [
      nightR + (dayR - nightR) * daylight,
      nightG + (dayG - nightG) * daylight,
      nightB + (dayB - nightB) * daylight,
    ];
  }

  private isAABBInFrustum(minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number): boolean {
    const planes = this.camera.getFrustumPlanes();
    for (const plane of planes) {
      const px = plane[0] >= 0 ? maxX : minX;
      const py = plane[1] >= 0 ? maxY : minY;
      const pz = plane[2] >= 0 ? maxZ : minZ;
      if (plane[0] * px + plane[1] * py + plane[2] * pz + plane[3] < 0) {
        return false;
      }
    }
    return true;
  }
}
