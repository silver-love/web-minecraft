export class ObjectPool<T> {
  private pool: T[] = []
  private factory: () => T
  private resetFn: ((obj: T) => void) | null

  constructor(factory: () => T, reset?: (obj: T) => void) {
    this.factory = factory
    this.resetFn = reset ?? null
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!
    }
    return this.factory()
  }

  release(obj: T): void {
    if (this.resetFn) {
      this.resetFn(obj)
    }
    this.pool.push(obj)
  }

  get size(): number {
    return this.pool.length
  }

  prewarm(count: number): void {
    for (let i = 0; i < count; i++) {
      this.pool.push(this.factory())
    }
  }
}
