import type { Player } from '../player/Player'

export class DebugOverlay {
  private ctx: CanvasRenderingContext2D
  visible: boolean = false

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!
  }

  render(
    player: Player,
    fps: number,
    chunkCount: number,
    position: [number, number, number],
    gameTime: number
  ): void {
    if (!this.visible) return

    const dpr = window.devicePixelRatio || 1
    this.ctx.save()
    this.ctx.scale(dpr, dpr)

    const lines: string[] = []
    lines.push(`FPS: ${fps.toFixed(1)}`)
    lines.push(
      `XYZ: ${position[0].toFixed(1)} / ${position[1].toFixed(1)} / ${position[2].toFixed(1)}`
    )

    const chunkX = Math.floor(position[0] / 16)
    const chunkZ = Math.floor(position[2] / 16)
    lines.push(`Chunk: [${chunkX}, ${chunkZ}]`)
    lines.push(`Facing: ${this.getDirection(player.yaw)}`)
    lines.push(`Chunks loaded: ${chunkCount}`)

    const timeOfDay = gameTime / 24000
    const hours = Math.floor(timeOfDay * 24)
    const minutes = Math.floor((timeOfDay * 24 - hours) * 60)
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    lines.push(`Time: ${timeStr} (${Math.floor(gameTime)})`)

    const lineHeight = 16
    const padding = 6
    const maxWidth = this.getMaxTextWidth(lines)
    const boxWidth = maxWidth + padding * 2
    const boxHeight = lines.length * lineHeight + padding * 2

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    this.ctx.fillRect(4, 4, boxWidth, boxHeight)

    this.ctx.font = '13px monospace'
    this.ctx.fillStyle = '#ffffff'
    for (let i = 0; i < lines.length; i++) {
      this.ctx.fillText(lines[i], 4 + padding, 4 + padding + (i + 1) * lineHeight - 3)
    }

    this.ctx.restore()
  }

  private getDirection(yaw: number): string {
    const normalized = ((yaw % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
    if (normalized < Math.PI / 4 || normalized >= (7 * Math.PI) / 4) return 'North (-Z)'
    if (normalized < (3 * Math.PI) / 4) return 'East (+X)'
    if (normalized < (5 * Math.PI) / 4) return 'South (+Z)'
    return 'West (-X)'
  }

  private getMaxTextWidth(lines: string[]): number {
    this.ctx.font = '13px monospace'
    let max = 0
    for (const line of lines) {
      const w = this.ctx.measureText(line).width
      if (w > max) max = w
    }
    return max
  }
}
