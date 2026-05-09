import { mat4Perspective, mat4LookAt, mat4Multiply } from '../utils/MathUtils'

export class Camera {
  position: [number, number, number] = [0, 0, 0]
  yaw = 0
  pitch = 0
  fov = Math.PI / 3
  aspect = 1
  near = 0.1
  far = 1000

  private viewMatrix: Float32Array = new Float32Array(16)
  private projectionMatrix: Float32Array = new Float32Array(16)
  private vpMatrix: Float32Array = new Float32Array(16)
  private frustumPlanes: Float32Array[] = []

  update(): void {
    const forwardX = Math.sin(this.yaw) * Math.cos(this.pitch)
    const forwardY = Math.sin(this.pitch)
    const forwardZ = -Math.cos(this.yaw) * Math.cos(this.pitch)

    const centerX = this.position[0] + forwardX
    const centerY = this.position[1] + forwardY
    const centerZ = this.position[2] + forwardZ

    this.viewMatrix = mat4LookAt(this.position, [centerX, centerY, centerZ], [0, 1, 0])
    this.projectionMatrix = mat4Perspective(this.fov, this.aspect, this.near, this.far)
    this.vpMatrix = mat4Multiply(this.projectionMatrix, this.viewMatrix)
    this.extractFrustumPlanes()
  }

  getViewMatrix(): Float32Array {
    return this.viewMatrix
  }

  getProjectionMatrix(): Float32Array {
    return this.projectionMatrix
  }

  getViewProjectionMatrix(): Float32Array {
    return this.vpMatrix
  }

  getFrustumPlanes(): Float32Array[] {
    return this.frustumPlanes
  }

  getForward(): [number, number, number] {
    return [
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch),
    ]
  }

  getRight(): [number, number, number] {
    const fx = Math.sin(this.yaw)
    const fz = -Math.cos(this.yaw)
    const len = Math.sqrt(fx * fx + fz * fz)
    if (len < 1e-6) return [1, 0, 0]
    return [fz / len, 0, -fx / len]
  }

  private extractFrustumPlanes(): void {
    const m = this.vpMatrix
    const planes: Float32Array[] = []

    const pairs = [
      [3, 0],
      [3, 0],
      [3, 1],
      [3, 1],
      [3, 2],
      [3, 2],
    ] as const

    const signs = [1, -1, 1, -1, 1, -1]

    for (let i = 0; i < 6; i++) {
      const [row3, rowN] = pairs[i]
      const sign = signs[i]
      const a = sign * (m[row3] + sign * m[rowN])
      const b = sign * (m[row3 + 4] + sign * m[rowN + 4])
      const c = sign * (m[row3 + 8] + sign * m[rowN + 8])
      const d = sign * (m[row3 + 12] + sign * m[rowN + 12])
      const len = Math.sqrt(a * a + b * b + c * c)
      if (len < 1e-6) {
        planes.push(new Float32Array([0, 0, 0, 0]))
      } else {
        planes.push(new Float32Array([a / len, b / len, c / len, d / len]))
      }
    }

    this.frustumPlanes = planes
  }
}
