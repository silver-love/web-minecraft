export class InputManager {
  private keys: Set<string> = new Set()
  private keysJustPressed: Set<string> = new Set()
  private mouseButtons: Set<number> = new Set()
  private _mouseDX = 0
  private _mouseDY = 0
  private _pointerLocked = false
  private canvas: HTMLCanvasElement
  private onMouseMove: ((e: MouseEvent) => void) | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas

    document.addEventListener('keydown', (e: KeyboardEvent) => {
      this.keys.add(e.code)
      this.keysJustPressed.add(e.code)
    })

    document.addEventListener('keyup', (e: KeyboardEvent) => {
      this.keys.delete(e.code)
    })

    canvas.addEventListener('mousedown', (e: MouseEvent) => {
      this.mouseButtons.add(e.button)
    })

    canvas.addEventListener('mouseup', (e: MouseEvent) => {
      this.mouseButtons.delete(e.button)
    })

    this.onMouseMove = (e: MouseEvent) => {
      if (this._pointerLocked) {
        this._mouseDX += e.movementX
        this._mouseDY += e.movementY
      }
    }
    canvas.addEventListener('mousemove', this.onMouseMove)

    document.addEventListener('pointerlockchange', () => {
      this._pointerLocked = document.pointerLockElement === this.canvas
    })
  }

  isKeyDown(key: string): boolean {
    return this.keys.has(key)
  }

  isKeyJustPressed(key: string): boolean {
    return this.keysJustPressed.has(key)
  }

  isMouseButtonDown(button: number): boolean {
    return this.mouseButtons.has(button)
  }

  getMouseDelta(): [number, number] {
    const result: [number, number] = [this._mouseDX, this._mouseDY]
    this._mouseDX = 0
    this._mouseDY = 0
    return result
  }

  isPointerLocked(): boolean {
    return this._pointerLocked
  }

  requestPointerLock(): void {
    this.canvas.requestPointerLock()
  }

  exitPointerLock(): void {
    document.exitPointerLock()
  }

  update(): void {
    this.keysJustPressed.clear()
  }
}
