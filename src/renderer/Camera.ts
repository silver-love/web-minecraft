import { mat4Perspective, mat4LookAt, mat4Multiply } from '../utils/MathUtils';

export class Camera {
  position: [number, number, number] = [0, 0, 0];
  yaw = 0;
  pitch = 0;
  fov = Math.PI / 3;
  aspect = 1;
  near = 0.1;
  far = 1000;
  private viewMatrix!: Float32Array;
  private projectionMatrix!: Float32Array;
  private vpMatrix!: Float32Array;
  private frustumPlanes: Float32Array[] = [];

  update(): void {
    const forward = this.getForward();
    const center: [number, number, number] = [
      this.position[0] + forward[0],
      this.position[1] + forward[1],
      this.position[2] + forward[2],
    ];
    this.viewMatrix = mat4LookAt(this.position, center, [0, 1, 0]);
    this.projectionMatrix = mat4Perspective(this.fov, this.aspect, this.near, this.far);
    this.vpMatrix = mat4Multiply(this.projectionMatrix, this.viewMatrix);
    this.extractFrustumPlanes();
  }

  private extractFrustumPlanes(): void {
    const m = this.vpMatrix;
    const planes: Float32Array[] = [];
    const indices: [number, number][] = [
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [2, 1],
      [2, -1],
    ];
    for (const [col, sign] of indices) {
      const plane = new Float32Array(4);
      plane[0] = m[3] + sign * m[col];
      plane[1] = m[7] + sign * m[col + 4];
      plane[2] = m[11] + sign * m[col + 8];
      plane[3] = m[15] + sign * m[col + 12];
      const len = Math.sqrt(plane[0] * plane[0] + plane[1] * plane[1] + plane[2] * plane[2]);
      if (len > 0) {
        plane[0] /= len;
        plane[1] /= len;
        plane[2] /= len;
        plane[3] /= len;
      }
      planes.push(plane);
    }
    this.frustumPlanes = planes;
  }

  getViewMatrix(): Float32Array {
    return this.viewMatrix;
  }

  getProjectionMatrix(): Float32Array {
    return this.projectionMatrix;
  }

  getViewProjectionMatrix(): Float32Array {
    return this.vpMatrix;
  }

  getFrustumPlanes(): Float32Array[] {
    return this.frustumPlanes;
  }

  getForward(): [number, number, number] {
    return [
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch),
    ];
  }

  getRight(): [number, number, number] {
    return [
      Math.cos(this.yaw),
      0,
      -Math.sin(this.yaw),
    ];
  }
}
