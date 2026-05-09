export function frustumAABBIntersect(
  planes: Float32Array[],
  minX: number,
  minY: number,
  minZ: number,
  maxX: number,
  maxY: number,
  maxZ: number
): boolean {
  for (let i = 0; i < 6; i++) {
    const plane = planes[i]
    const a = plane[0]
    const b = plane[1]
    const c = plane[2]
    const d = plane[3]

    const px = a >= 0 ? maxX : minX
    const py = b >= 0 ? maxY : minY
    const pz = c >= 0 ? maxZ : minZ

    if (a * px + b * py + c * pz + d < 0) {
      return false
    }
  }
  return true
}
