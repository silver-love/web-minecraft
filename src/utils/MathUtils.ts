export function mat4Identity(): Float32Array {
  const out = new Float32Array(16);
  out[0] = 1;
  out[5] = 1;
  out[10] = 1;
  out[15] = 1;
  return out;
}

export function mat4Perspective(
  fov: number,
  aspect: number,
  near: number,
  far: number,
): Float32Array {
  const out = new Float32Array(16);
  const f = 1.0 / Math.tan(fov / 2);
  const nf = 1 / (near - far);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[14] = 2 * far * near * nf;
  return out;
}

export function mat4LookAt(
  eye: [number, number, number],
  center: [number, number, number],
  up: [number, number, number],
): Float32Array {
  const out = new Float32Array(16);
  let fx = center[0] - eye[0];
  let fy = center[1] - eye[1];
  let fz = center[2] - eye[2];
  let len = Math.sqrt(fx * fx + fy * fy + fz * fz);
  if (len > 0) {
    len = 1 / len;
    fx *= len;
    fy *= len;
    fz *= len;
  }
  let sx = fy * up[2] - fz * up[1];
  let sy = fz * up[0] - fx * up[2];
  let sz = fx * up[1] - fy * up[0];
  len = Math.sqrt(sx * sx + sy * sy + sz * sz);
  if (len > 0) {
    len = 1 / len;
    sx *= len;
    sy *= len;
    sz *= len;
  }
  const ux = sy * fz - sz * fy;
  const uy = sz * fx - sx * fz;
  const uz = sx * fy - sy * fx;
  out[0] = sx;
  out[1] = ux;
  out[2] = -fx;
  out[3] = 0;
  out[4] = sy;
  out[5] = uy;
  out[6] = -fy;
  out[7] = 0;
  out[8] = sz;
  out[9] = uz;
  out[10] = -fz;
  out[11] = 0;
  out[12] = -(sx * eye[0] + sy * eye[1] + sz * eye[2]);
  out[13] = -(ux * eye[0] + uy * eye[1] + uz * eye[2]);
  out[14] = fx * eye[0] + fy * eye[1] + fz * eye[2];
  out[15] = 1;
  return out;
}

export function mat4Multiply(a: Float32Array, b: Float32Array): Float32Array {
  const out = new Float32Array(16);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[k * 4 + row] * b[col * 4 + k];
      }
      out[col * 4 + row] = sum;
    }
  }
  return out;
}
