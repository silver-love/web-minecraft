export function mat4Identity(): Float32Array {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ])
}

export function mat4Perspective(fov: number, aspect: number, near: number, far: number): Float32Array {
  const f = 1.0 / Math.tan(fov / 2)
  const nf = 1 / (near - far)
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0
  ])
}

export function mat4LookAt(
  eye: [number, number, number],
  center: [number, number, number],
  up: [number, number, number]
): Float32Array {
  let fx = center[0] - eye[0]
  let fy = center[1] - eye[1]
  let fz = center[2] - eye[2]

  let fLen = Math.sqrt(fx * fx + fy * fy + fz * fz)
  if (fLen < 1e-6) return mat4Identity()
  fx /= fLen
  fy /= fLen
  fz /= fLen

  let sx = fy * up[2] - fz * up[1]
  let sy = fz * up[0] - fx * up[2]
  let sz = fx * up[1] - fy * up[0]

  let sLen = Math.sqrt(sx * sx + sy * sy + sz * sz)
  if (sLen < 1e-6) {
    sx = fy
    sy = -fx
    sz = 0
    sLen = Math.sqrt(sx * sx + sy * sy + sz * sz)
    if (sLen < 1e-6) return mat4Identity()
  }
  sx /= sLen
  sy /= sLen
  sz /= sLen

  const ux = sy * fz - sz * fy
  const uy = sz * fx - sx * fz
  const uz = sx * fy - sy * fx

  return new Float32Array([
    sx, ux, -fx, 0,
    sy, uy, -fy, 0,
    sz, uz, -fz, 0,
    -(sx * eye[0] + sy * eye[1] + sz * eye[2]),
    -(ux * eye[0] + uy * eye[1] + uz * eye[2]),
    fx * eye[0] + fy * eye[1] + fz * eye[2],
    1
  ])
}

export function mat4Multiply(a: Float32Array, b: Float32Array): Float32Array {
  const out = new Float32Array(16)
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0
      for (let k = 0; k < 4; k++) {
        sum += a[k * 4 + row] * b[col * 4 + k]
      }
      out[col * 4 + row] = sum
    }
  }
  return out
}
