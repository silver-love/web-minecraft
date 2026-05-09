export class TickSystem {
  tickRate = 20
  tickTime = 1 / 20
  accumulator = 0

  update(dt: number, tickCallback: () => void): void {
    this.accumulator += dt
    while (this.accumulator >= this.tickTime) {
      tickCallback()
      this.accumulator -= this.tickTime
    }
  }
}
