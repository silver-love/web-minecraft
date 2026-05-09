export class ChunkMesh {
  private gl: WebGL2RenderingContext
  private vao: WebGLVertexArrayObject | null = null
  private posVbo: WebGLBuffer | null = null
  private uvVbo: WebGLBuffer | null = null
  private lightVbo: WebGLBuffer | null = null
  private ibo: WebGLBuffer | null = null
  public indexCount = 0

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl
  }

  upload(
    positions: Float32Array,
    uvs: Float32Array,
    lights: Float32Array,
    indices: Uint32Array
  ): void {
    this.dispose()

    const gl = this.gl

    this.vao = gl.createVertexArray()
    gl.bindVertexArray(this.vao)

    this.posVbo = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posVbo)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)

    this.uvVbo = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvVbo)
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0)

    this.lightVbo = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lightVbo)
    gl.bufferData(gl.ARRAY_BUFFER, lights, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(2)
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0)

    this.ibo = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

    this.indexCount = indices.length

    gl.bindVertexArray(null)
  }

  draw(): void {
    if (this.indexCount === 0) return
    const gl = this.gl
    gl.bindVertexArray(this.vao)
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_INT, 0)
  }

  dispose(): void {
    const gl = this.gl
    if (this.vao) {
      gl.deleteVertexArray(this.vao)
      this.vao = null
    }
    if (this.posVbo) {
      gl.deleteBuffer(this.posVbo)
      this.posVbo = null
    }
    if (this.uvVbo) {
      gl.deleteBuffer(this.uvVbo)
      this.uvVbo = null
    }
    if (this.lightVbo) {
      gl.deleteBuffer(this.lightVbo)
      this.lightVbo = null
    }
    if (this.ibo) {
      gl.deleteBuffer(this.ibo)
      this.ibo = null
    }
    this.indexCount = 0
  }
}
