import type { Inventory } from '../game/Inventory'

const BLOCK_COLORS: Record<number, string> = {
  1: '#888888',
  2: '#8B6914',
  3: '#5D9B3D',
  4: '#777777',
  5: '#BC9862',
  6: '#E8D68E',
  7: '#3F76E4',
  8: '#C0E0FF',
  9: '#6B4226',
  10: '#4B8F2B',
  11: '#444444',
  12: '#D4B897',
  13: '#FCDB4D',
  14: '#5DECF0',
  15: '#333333',
  16: '#999999',
  17: '#FFAA00',
}

export class HUD {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
  }

  render(inventory: Inventory, health: number, hunger: number, gameMode: number): void {
    const dpr = window.devicePixelRatio || 1
    const w = this.canvas.width / dpr
    const h = this.canvas.height / dpr

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.save()
    this.ctx.scale(dpr, dpr)

    this.drawCrosshair(w, h)
    this.drawHotbar(inventory, w, h)

    if (gameMode === 0) {
      this.drawHealth(health, w, h)
      this.drawHunger(hunger, w, h)
    }

    this.ctx.restore()
  }

  private drawCrosshair(w: number, h: number): void {
    const cx = w / 2
    const cy = h / 2
    const size = 10

    this.ctx.strokeStyle = '#ffffff'
    this.ctx.lineWidth = 2
    this.ctx.beginPath()
    this.ctx.moveTo(cx - size, cy)
    this.ctx.lineTo(cx + size, cy)
    this.ctx.moveTo(cx, cy - size)
    this.ctx.lineTo(cx, cy + size)
    this.ctx.stroke()
  }

  private drawHotbar(inventory: Inventory, w: number, h: number): void {
    const slotSize = 40
    const slotGap = 2
    const hotbarWidth = 9 * slotSize + 8 * slotGap
    const hotbarX = (w - hotbarWidth) / 2
    const hotbarY = h - slotSize - 12

    for (let i = 0; i < 9; i++) {
      const x = hotbarX + i * (slotSize + slotGap)
      const y = hotbarY

      if (i === inventory.selectedSlot) {
        this.ctx.fillStyle = '#aaaaaa'
        this.ctx.fillRect(x - 2, y - 2, slotSize + 4, slotSize + 4)
      }

      this.ctx.fillStyle = '#555555'
      this.ctx.fillRect(x, y, slotSize, slotSize)

      this.ctx.strokeStyle = '#333333'
      this.ctx.lineWidth = 1
      this.ctx.strokeRect(x, y, slotSize, slotSize)

      const item = inventory.slots[i]
      if (item) {
        const color = BLOCK_COLORS[item.id]
        if (color) {
          this.ctx.fillStyle = color
          this.ctx.fillRect(x + 6, y + 6, slotSize - 12, slotSize - 12)

          this.ctx.strokeStyle = '#000000'
          this.ctx.lineWidth = 1
          this.ctx.strokeRect(x + 6, y + 6, slotSize - 12, slotSize - 12)
        }
      }
    }
  }

  private drawHealth(health: number, w: number, h: number): void {
    const slotSize = 40
    const slotGap = 2
    const hotbarWidth = 9 * slotSize + 8 * slotGap
    const hotbarX = (w - hotbarWidth) / 2
    const hotbarY = h - slotSize - 12

    const heartSize = 9
    const heartGap = 1
    const heartY = hotbarY - heartSize - 6

    for (let i = 0; i < 10; i++) {
      const x = hotbarX + i * (heartSize + heartGap)
      const hpForHeart = health - i * 2

      this.ctx.fillStyle = '#333333'
      this.ctx.fillRect(x, heartY, heartSize, heartSize)

      if (hpForHeart >= 2) {
        this.ctx.fillStyle = '#cc0000'
        this.ctx.fillRect(x, heartY, heartSize, heartSize)
      } else if (hpForHeart >= 1) {
        this.ctx.fillStyle = '#cc0000'
        this.ctx.fillRect(x, heartY, heartSize / 2, heartSize)
        this.ctx.fillStyle = '#333333'
        this.ctx.fillRect(x + heartSize / 2, heartY, heartSize / 2, heartSize)
      }
    }
  }

  private drawHunger(hunger: number, w: number, h: number): void {
    const slotSize = 40
    const slotGap = 2
    const hotbarWidth = 9 * slotSize + 8 * slotGap
    const hotbarX = (w - hotbarWidth) / 2
    const hotbarY = h - slotSize - 12

    const drumSize = 9
    const drumGap = 1
    const drumY = hotbarY - drumSize - 6

    for (let i = 0; i < 10; i++) {
      const x = hotbarX + hotbarWidth - (10 - i) * (drumSize + drumGap)
      const hungerForSlot = hunger - i * 2

      this.ctx.fillStyle = '#333333'
      this.ctx.fillRect(x, drumY, drumSize, drumSize)

      if (hungerForSlot >= 2) {
        this.ctx.fillStyle = '#c88030'
        this.ctx.fillRect(x, drumY, drumSize, drumSize)
      } else if (hungerForSlot >= 1) {
        this.ctx.fillStyle = '#c88030'
        this.ctx.fillRect(x, drumY, drumSize / 2, drumSize)
        this.ctx.fillStyle = '#333333'
        this.ctx.fillRect(x + drumSize / 2, drumY, drumSize / 2, drumSize)
      }
    }
  }
}
