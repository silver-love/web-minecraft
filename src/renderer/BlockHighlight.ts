import { createShaderProgram } from './Shader'

const HIGHLIGHT_VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec3 aPosition;
uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uModel;
void main() {
    gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
}
`

const HIGHLIGHT_FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;
void main() {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
`

export class BlockHighlight {
  private gl: WebGL2RenderingContext
  private program: WebGLProgram
  private vao: WebGLVertexArrayObject | null = null
  private vbo: WebGLBuffer | null = null

  private uProjection: WebGLUniformLocation | null
  private uView: WebGLUniformLocation | null
  private uModel: WebGLUniformLocation | null

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl
    this.program = createShaderProgram(gl, HIGHLIGHT_VERT, HIGHLIGHT_FRAG)

    this.uProjection = gl.getUniformLocation(this.program, 'uProjection')
    this.uView = gl.getUniformLocation(this.program, 'uView')
    this.uModel = gl.getUniformLocation(this.program, 'uModel')

    this.createWireframeVAO()
  }

  private createWireframeVAO(): void {
    const gl = this.gl
    const e = 0.002
    const s = -e
    const b = 1 + e

    const vertices = new Float32Array([
      s, s, s,  b, s, s,
      b, s, s,  b, b, s,
      b, b, s,  s, b, s,
      s, b, s,  s, s, s,
      s, s, b,  b, s, b,
      b, s, b,  b, b, b,
      b, b, b,  s, b, b,
      s, b, b,  s, s, b,
      s, s, s,  s, s, b,
      b, s, s,  b, s, b,
      b, b, s,  b, b, b,
      s, b, s,  s, b, b,
    ])

    this.vao = gl.createVertexArray()
    gl.bindVertexArray(this.vao)

    this.vbo = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)

    gl.bindVertexArray(null)
  }

  render(gl: WebGL2RenderingContext, x: number, y: number, z: number, viewMatrix: Float32Array, projectionMatrix: Float32Array): void {
    gl.useProgram(this.program)
    gl.uniformMatrix4fv(this.uProjection, false, projectionMatrix)
    gl.uniformMatrix4fv(this.uView, false, viewMatrix)

    const modelMatrix = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      x, y, z, 1,
    ])
    gl.uniformMatrix4fv(this.uModel, false, modelMatrix)

    gl.bindVertexArray(this.vao)
    gl.drawArrays(gl.LINES, 0, 24)
    gl.bindVertexArray(null)
  }
}
