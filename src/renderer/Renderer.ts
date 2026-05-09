import type { ChunkMesh } from './ChunkMesh'
import type { SkyBox } from './SkyBox'
import { createShaderProgram } from './Shader'
import { Camera } from './Camera'
import { frustumAABBIntersect } from './Frustum'
import blockVertSrc from './shaders/block.vert.glsl?raw'
import blockFragSrc from './shaders/block.frag.glsl?raw'

export interface ChunkMeshEntry {
  mesh: ChunkMesh
  cx: number
  cz: number
}

export class Renderer {
  private gl: WebGL2RenderingContext
  private programs: Map<string, WebGLProgram> = new Map()
  private blockProgram: WebGLProgram
  private textureAtlas: WebGLTexture | null = null
  private chunkEntries: ChunkMeshEntry[] = []
  private running = false
  private fogColor: [number, number, number] = [0.53, 0.81, 0.92]
  private fogNear = 50
  private fogFar = 200
  private skybox: SkyBox | null = null
  camera: Camera = new Camera()
  timeOfDay = 0.25
  gameTime = 0

  private uProjection: WebGLUniformLocation | null
  private uView: WebGLUniformLocation | null
  private uTexture: WebGLUniformLocation | null
  private uFogColor: WebGLUniformLocation | null
  private uFogNear: WebGLUniformLocation | null
  private uFogFar: WebGLUniformLocation | null

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl
    this.blockProgram = this.getShaderProgram('block', blockVertSrc, blockFragSrc)

    this.uProjection = gl.getUniformLocation(this.blockProgram, 'uProjection')
    this.uView = gl.getUniformLocation(this.blockProgram, 'uView')
    this.uTexture = gl.getUniformLocation(this.blockProgram, 'uTexture')
    this.uFogColor = gl.getUniformLocation(this.blockProgram, 'uFogColor')
    this.uFogNear = gl.getUniformLocation(this.blockProgram, 'uFogNear')
    this.uFogFar = gl.getUniformLocation(this.blockProgram, 'uFogFar')

    gl.enable(gl.DEPTH_TEST)
  }

  private getShaderProgram(name: string, vsSource: string, fsSource: string): WebGLProgram {
    const cached = this.programs.get(name)
    if (cached) return cached

    const program = createShaderProgram(this.gl, vsSource, fsSource)
    this.programs.set(name, program)
    return program
  }

  setCamera(
    pos: [number, number, number],
    yaw: number,
    pitch: number,
    fov: number,
    aspect: number
  ): void {
    this.camera.position = pos
    this.camera.yaw = yaw
    this.camera.pitch = pitch
    this.camera.fov = fov
    this.camera.aspect = aspect
    this.camera.update()
  }

  setSkybox(skybox: SkyBox): void {
    this.skybox = skybox
  }

  private updateFogColor(): void {
    const angle = this.timeOfDay * 2 * Math.PI
    const sunY = Math.sin(angle)
    const dayFactor = Math.max(0, Math.min(1, (sunY + 0.1) / 0.3))

    const dayFog: [number, number, number] = [0.53, 0.81, 0.92]
    const nightFog: [number, number, number] = [0.02, 0.02, 0.08]

    this.fogColor[0] = nightFog[0] + (dayFog[0] - nightFog[0]) * dayFactor
    this.fogColor[1] = nightFog[1] + (dayFog[1] - nightFog[1]) * dayFactor
    this.fogColor[2] = nightFog[2] + (dayFog[2] - nightFog[2]) * dayFactor
  }

  beginFrame(): void {
    this.gameTime++
    this.updateFogColor()
    const gl = this.gl
    gl.clearColor(this.fogColor[0], this.fogColor[1], this.fogColor[2], 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  }

  endFrame(): void {
  }

  renderSkybox(): void {
    if (!this.skybox) return
    this.skybox.render(
      this.gl,
      this.camera.getViewMatrix(),
      this.camera.getProjectionMatrix(),
      this.timeOfDay
    )
  }

  drawChunkMesh(mesh: ChunkMesh): void {
    const gl = this.gl
    gl.useProgram(this.blockProgram)

    gl.uniformMatrix4fv(this.uProjection, false, this.camera.getProjectionMatrix())
    gl.uniformMatrix4fv(this.uView, false, this.camera.getViewMatrix())

    gl.uniform3f(this.uFogColor, this.fogColor[0], this.fogColor[1], this.fogColor[2])
    gl.uniform1f(this.uFogNear, this.fogNear)
    gl.uniform1f(this.uFogFar, this.fogFar)

    if (this.textureAtlas) {
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, this.textureAtlas)
      gl.uniform1i(this.uTexture, 0)
    }

    mesh.draw()
  }

  addChunkMesh(mesh: ChunkMesh, cx: number, cz: number): void {
    this.chunkEntries.push({ mesh, cx, cz })
  }

  removeChunkMesh(mesh: ChunkMesh): void {
    this.chunkEntries = this.chunkEntries.filter(e => e.mesh !== mesh)
  }

  setTextureAtlas(texture: WebGLTexture): void {
    this.textureAtlas = texture
  }

  renderChunks(): void {
    const planes = this.camera.getFrustumPlanes()
    for (const entry of this.chunkEntries) {
      const minX = entry.cx * 16
      const minZ = entry.cz * 16
      if (frustumAABBIntersect(planes, minX, 0, minZ, minX + 16, 128, minZ + 16)) {
        this.drawChunkMesh(entry.mesh)
      }
    }
  }

  setTimeOfDay(timeOfDay: number): void {
    const raw = Math.cos((timeOfDay - 0.25) * Math.PI * 2)
    const dayFactor = Math.max(0.05, raw * 0.5 + 0.5)
    this.fogColor = [
      0.53 * dayFactor,
      0.81 * dayFactor,
      0.92 * dayFactor,
    ]
  }

  start(): void {
    this.running = true
    const loop = (): void => {
      if (!this.running) return
      this.beginFrame()
      this.renderSkybox()
      this.renderChunks()
      this.endFrame()
      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
  }

  stop(): void {
    this.running = false
  }
}
