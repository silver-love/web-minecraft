import { createShaderProgram } from './Shader'
import skyboxVertSrc from './shaders/skybox.vert.glsl?raw'
import skyboxFragSrc from './shaders/skybox.frag.glsl?raw'

export class SkyBox {
  private gl: WebGL2RenderingContext
  private program: WebGLProgram
  private vao: WebGLVertexArrayObject | null = null
  private vbo: WebGLBuffer | null = null

  private uProjection: WebGLUniformLocation | null
  private uView: WebGLUniformLocation | null
  private uTimeOfDay: WebGLUniformLocation | null
  private uSunDirection: WebGLUniformLocation | null

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl
    this.program = createShaderProgram(gl, skyboxVertSrc, skyboxFragSrc)

    this.uProjection = gl.getUniformLocation(this.program, 'uProjection')
    this.uView = gl.getUniformLocation(this.program, 'uView')
    this.uTimeOfDay = gl.getUniformLocation(this.program, 'uTimeOfDay')
    this.uSunDirection = gl.getUniformLocation(this.program, 'uSunDirection')

    this.createCubeVAO()
  }

  private createCubeVAO(): void {
    const gl = this.gl
    const s = 500
    const vertices = new Float32Array([
      -s, -s,  s,
       s, -s,  s,
       s,  s,  s,
      -s,  s,  s,
      -s, -s, -s,
       s, -s, -s,
       s,  s, -s,
      -s,  s, -s,
    ])

    const indices = new Uint16Array([
      0, 1, 2, 0, 2, 3,
      5, 4, 7, 5, 7, 6,
      4, 0, 3, 4, 3, 7,
      1, 5, 6, 1, 6, 2,
      3, 2, 6, 3, 6, 7,
      4, 5, 1, 4, 1, 0,
    ])

    this.vao = gl.createVertexArray()
    gl.bindVertexArray(this.vao)

    this.vbo = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)

    const ibo = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

    gl.bindVertexArray(null)
  }

  render(gl: WebGL2RenderingContext, viewMatrix: Float32Array, projectionMatrix: Float32Array, timeOfDay: number): void {
    const angle = timeOfDay * 2 * Math.PI
    const rawX = Math.cos(angle)
    const rawY = Math.sin(angle)
    const rawZ = 0.3
    const len = Math.sqrt(rawX * rawX + rawY * rawY + rawZ * rawZ)
    const sunDirX = rawX / len
    const sunDirY = rawY / len
    const sunDirZ = rawZ / len

    gl.useProgram(this.program)
    gl.uniformMatrix4fv(this.uProjection, false, projectionMatrix)
    gl.uniformMatrix4fv(this.uView, false, viewMatrix)
    gl.uniform1f(this.uTimeOfDay, timeOfDay)
    gl.uniform3f(this.uSunDirection, sunDirX, sunDirY, sunDirZ)

    gl.depthFunc(gl.LEQUAL)
    gl.depthMask(false)

    gl.bindVertexArray(this.vao)
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0)
    gl.bindVertexArray(null)

    gl.depthMask(true)
    gl.depthFunc(gl.LESS)
  }
}
