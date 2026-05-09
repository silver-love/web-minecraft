export class InputManager {
  private keysDown: Set<string> = new Set()
  private keysJustPressed: Set<string> = new Set()
  private keysJustReleased: Set<string> = new Set()
  private mouseDeltaX = 0
  private mouseDeltaY = 0
  private scrollDelta = 0
  private pointerLocked = false
  private canvas: HTMLCanvasElement
  private mouseButtonsDown: Set<number> = new Set()
  private mouseButtonsJustPressed: Set<number> = new Set()
  disabled = false

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas

    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (this.disabled) return
      if (!this.keysDown.has(e.code)) {
        this.keysJustPressed.add(e.code)
      }
      this.keysDown.add(e.code)
    })

    document.addEventListener('keyup', (e: KeyboardEvent) => {
      if (this.disabled) return
      this.keysDown.delete(e.code)
      this.keysJustReleased.add(e.code)
    })

    document.addEventListener('mousemove', (e: MouseEvent) => {
      if (this.disabled) return
      if (this.pointerLocked) {
        this.mouseDeltaX += e.movementX
        this.mouseDeltaY += e.movementY
      }
    })

    document.addEventListener('mousedown', (e: MouseEvent) => {
      if (this.disabled) return
      if (!this.mouseButtonsDown.has(e.button)) {
        this.mouseButtonsJustPressed.add(e.button)
      }
      this.mouseButtonsDown.add(e.button)
    })

    document.addEventListener('mouseup', (e: MouseEvent) => {
      if (this.disabled) return
      this.mouseButtonsDown.delete(e.button)
    })

    document.addEventListener('wheel', (e: WheelEvent) => {
      if (this.disabled) return
      this.scrollDelta += e.deltaY
    })

    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.canvas
    })
  }

  isKeyDown(code: string): boolean {
    return this.keysDown.has(code)
  }

  isKeyJustPressed(code: string): boolean {
    return this.keysJustPressed.has(code)
  }

  isMouseButtonDown(button: number): boolean {
    return this.mouseButtonsDown.has(button)
  }

  isMouseButtonJustPressed(button: number): boolean {
    return this.mouseButtonsJustPressed.has(button)
  }

  getMouseDelta(): [number, number] {
    return [this.mouseDeltaX, this.mouseDeltaY]
  }

  getScrollDelta(): number {
    return this.scrollDelta
  }

  isPointerLocked(): boolean {
    return this.pointerLocked
  }

  update(): void {
    this.keysJustPressed.clear()
    this.keysJustReleased.clear()
    this.mouseDeltaX = 0
    this.mouseDeltaY = 0
    this.scrollDelta = 0
    this.mouseButtonsJustPressed.clear()
  }

  reset(): void {
    this.keysDown.clear()
    this.keysJustPressed.clear()
    this.keysJustReleased.clear()
    this.mouseDeltaX = 0
    this.mouseDeltaY = 0
    this.scrollDelta = 0
    this.mouseButtonsDown.clear()
    this.mouseButtonsJustPressed.clear()
  }

  requestPointerLock(): void {
    this.canvas.requestPointerLock()
  }
}
