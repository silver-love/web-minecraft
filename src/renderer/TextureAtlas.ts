const ATLAS_SIZE = 256
const TILE_SIZE = 16
const GRID_SIZE = 16

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function drawStone(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  const rand = seededRandom(42)
  ctx.fillStyle = '#808080'
  ctx.fillRect(ox, oy, 16, 16)
  for (let i = 0; i < 30; i++) {
    const px = Math.floor(rand() * 16)
    const py = Math.floor(rand() * 16)
    const v = Math.floor(100 + rand() * 56)
    ctx.fillStyle = `rgb(${v},${v},${v})`
    ctx.fillRect(ox + px, oy + py, 1, 1)
  }
}

function drawDirt(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  const rand = seededRandom(101)
  ctx.fillStyle = '#8B6914'
  ctx.fillRect(ox, oy, 16, 16)
  for (let i = 0; i < 25; i++) {
    const px = Math.floor(rand() * 16)
    const py = Math.floor(rand() * 16)
    const v = Math.floor(90 + rand() * 40)
    ctx.fillStyle = `rgb(${v + 40},${v + 20},${v - 30})`
    ctx.fillRect(ox + px, oy + py, 1, 1)
  }
}

function drawGrassTop(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  const rand = seededRandom(202)
  ctx.fillStyle = '#4CAF50'
  ctx.fillRect(ox, oy, 16, 16)
  for (let i = 0; i < 20; i++) {
    const px = Math.floor(rand() * 16)
    const py = Math.floor(rand() * 16)
    const v = Math.floor(60 + rand() * 40)
    ctx.fillStyle = `rgb(${v - 20},${v + 40},${v - 20})`
    ctx.fillRect(ox + px, oy + py, 1, 1)
  }
}

function drawCobblestone(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  const rand = seededRandom(303)
  ctx.fillStyle = '#707070'
  ctx.fillRect(ox, oy, 16, 16)
  for (let i = 0; i < 8; i++) {
    const px = Math.floor(rand() * 12)
    const py = Math.floor(rand() * 12)
    const w = 2 + Math.floor(rand() * 4)
    const h = 2 + Math.floor(rand() * 4)
    const v = Math.floor(130 + rand() * 60)
    ctx.fillStyle = `rgb(${v},${v},${v})`
    ctx.fillRect(ox + px, oy + py, w, h)
  }
}

function drawPlanks(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  ctx.fillStyle = '#C19A6B'
  ctx.fillRect(ox, oy, 16, 16)
  ctx.fillStyle = '#A0784B'
  for (let row = 0; row < 4; row++) {
    ctx.fillRect(ox, oy + row * 4, 16, 1)
  }
  const rand = seededRandom(404)
  for (let i = 0; i < 10; i++) {
    const px = Math.floor(rand() * 16)
    const py = Math.floor(rand() * 16)
    const v = Math.floor(150 + rand() * 40)
    ctx.fillStyle = `rgb(${v},${v - 30},${v - 60})`
    ctx.fillRect(ox + px, oy + py, 1, 1)
  }
}

function drawSand(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  const rand = seededRandom(505)
  ctx.fillStyle = '#E8D68E'
  ctx.fillRect(ox, oy, 16, 16)
  for (let i = 0; i < 25; i++) {
    const px = Math.floor(rand() * 16)
    const py = Math.floor(rand() * 16)
    const v = Math.floor(200 + rand() * 40)
    ctx.fillStyle = `rgb(${v},${v - 15},${v - 50})`
    ctx.fillRect(ox + px, oy + py, 1, 1)
  }
}

function drawWater(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  const rand = seededRandom(606)
  ctx.fillStyle = '#3066BE'
  ctx.fillRect(ox, oy, 16, 16)
  for (let i = 0; i < 20; i++) {
    const px = Math.floor(rand() * 16)
    const py = Math.floor(rand() * 16)
    const v = Math.floor(40 + rand() * 30)
    ctx.fillStyle = `rgb(${v},${v + 50},${v + 140})`
    ctx.fillRect(ox + px, oy + py, 1, 1)
  }
}

function drawGlass(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  ctx.fillStyle = '#C8E8FF'
  ctx.fillRect(ox, oy, 16, 16)
  ctx.fillStyle = '#A0D0F0'
  ctx.fillRect(ox, oy, 16, 1)
  ctx.fillRect(ox, oy + 15, 16, 1)
  ctx.fillRect(ox, oy, 1, 16)
  ctx.fillRect(ox + 15, oy, 1, 16)
  ctx.fillStyle = '#E0F0FF'
  ctx.fillRect(ox + 2, oy + 2, 4, 4)
}

function drawOakLogTop(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  ctx.fillStyle = '#6B4226'
  ctx.fillRect(ox, oy, 16, 16)
  ctx.fillStyle = '#C8A96E'
  ctx.beginPath()
  ctx.arc(ox + 8, oy + 8, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#A08050'
  ctx.beginPath()
  ctx.arc(ox + 8, oy + 8, 3, 0, Math.PI * 2)
  ctx.fill()
}

function drawOakLogSide(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  ctx.fillStyle = '#6B4226'
  ctx.fillRect(ox, oy, 16, 16)
  ctx.fillStyle = '#5A3520'
  for (let col = 2; col < 16; col += 4) {
    ctx.fillRect(ox + col, oy, 1, 16)
  }
  const rand = seededRandom(909)
  for (let i = 0; i < 8; i++) {
    const px = Math.floor(rand() * 16)
    const py = Math.floor(rand() * 16)
    ctx.fillStyle = `rgb(${80 + Math.floor(rand() * 30)},${50 + Math.floor(rand() * 20)},${20 + Math.floor(rand() * 15)})`
    ctx.fillRect(ox + px, oy + py, 1, 1)
  }
}

function drawOakLeaves(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  const rand = seededRandom(1010)
  ctx.fillStyle = '#2E7D32'
  ctx.fillRect(ox, oy, 16, 16)
  for (let i = 0; i < 20; i++) {
    const px = Math.floor(rand() * 16)
    const py = Math.floor(rand() * 16)
    if (rand() > 0.5) {
      ctx.fillStyle = '#1B5E20'
    } else {
      ctx.fillStyle = '#000000'
    }
    ctx.fillRect(ox + px, oy + py, 1, 1)
  }
}

function drawOre(ctx: CanvasRenderingContext2D, ox: number, oy: number, oreR: number, oreG: number, oreB: number, seed: number): void {
  drawStone(ctx, ox, oy)
  const rand = seededRandom(seed)
  for (let i = 0; i < 6; i++) {
    const px = 2 + Math.floor(rand() * 12)
    const py = 2 + Math.floor(rand() * 12)
    ctx.fillStyle = `rgb(${oreR},${oreG},${oreB})`
    ctx.fillRect(ox + px, oy + py, 2, 2)
  }
}

function drawBedrock(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  const rand = seededRandom(1515)
  ctx.fillStyle = '#333333'
  ctx.fillRect(ox, oy, 16, 16)
  for (let i = 0; i < 25; i++) {
    const px = Math.floor(rand() * 16)
    const py = Math.floor(rand() * 16)
    const v = Math.floor(30 + rand() * 30)
    ctx.fillStyle = `rgb(${v},${v},${v})`
    ctx.fillRect(ox + px, oy + py, 1, 1)
  }
}

function drawGravel(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  const rand = seededRandom(1616)
  ctx.fillStyle = '#888888'
  ctx.fillRect(ox, oy, 16, 16)
  for (let i = 0; i < 20; i++) {
    const px = Math.floor(rand() * 16)
    const py = Math.floor(rand() * 16)
    if (rand() > 0.5) {
      ctx.fillStyle = '#CCCCCC'
    } else {
      ctx.fillStyle = '#666666'
    }
    ctx.fillRect(ox + px, oy + py, 1, 1)
  }
}

function drawTorch(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  ctx.fillStyle = '#000000'
  ctx.fillRect(ox, oy, 16, 16)
  ctx.fillStyle = '#8B6914'
  ctx.fillRect(ox + 7, oy + 4, 2, 10)
  ctx.fillStyle = '#FF8800'
  ctx.fillRect(ox + 6, oy + 2, 4, 3)
  ctx.fillStyle = '#FFCC00'
  ctx.fillRect(ox + 7, oy + 1, 2, 2)
}

export function createProceduralTextureAtlas(gl: WebGL2RenderingContext): WebGLTexture {
  const canvas = document.createElement('canvas')
  canvas.width = ATLAS_SIZE
  canvas.height = ATLAS_SIZE
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, ATLAS_SIZE, ATLAS_SIZE)

  const drawFns: ((ctx: CanvasRenderingContext2D, ox: number, oy: number) => void)[] = [
    drawStone,
    drawDirt,
    drawGrassTop,
    drawCobblestone,
    drawPlanks,
    drawSand,
    drawWater,
    drawGlass,
    drawOakLogTop,
    drawOakLogSide,
    drawOakLeaves,
    (c, ox, oy) => drawOre(c, ox, oy, 30, 30, 30, 1111),
    (c, ox, oy) => drawOre(c, ox, oy, 200, 180, 150, 1212),
    (c, ox, oy) => drawOre(c, ox, oy, 255, 220, 50, 1313),
    (c, ox, oy) => drawOre(c, ox, oy, 80, 230, 230, 1414),
    drawBedrock,
    drawGravel,
    drawTorch,
  ]

  for (let i = 0; i < drawFns.length; i++) {
    const col = i % GRID_SIZE
    const row = Math.floor(i / GRID_SIZE)
    const ox = col * TILE_SIZE
    const oy = row * TILE_SIZE
    drawFns[i](ctx, ox, oy)
  }

  const texture = gl.createTexture()!
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.bindTexture(gl.TEXTURE_2D, null)

  return texture
}
