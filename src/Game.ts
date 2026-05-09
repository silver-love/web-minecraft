import { Renderer } from './renderer/Renderer'
import { SkyRenderer } from './renderer/SkyRenderer'
import { ChunkRenderer } from './renderer/ChunkRenderer'
import { createProceduralTextureAtlas } from './renderer/TextureAtlas'
import { World } from './world/World'
import { BlockRegistry } from './world/BlockType'
import { WorldGenerator } from './world/WorldGenerator'
import { BiomeManager } from './world/Biome'
import { LightingEngine } from './world/Lighting'
import { ChunkManager } from './world/ChunkManager'
import { Player } from './player/Player'
import { InputManager } from './player/InputManager'
import { SECTIONS_PER_CHUNK } from './world/Chunk'
import { BlockInteraction } from './game/BlockInteraction'
import { Inventory } from './game/Inventory'

export type GameState = 'LOADING' | 'MENU' | 'PLAYING' | 'PAUSED'

export class Game {
  private canvas: HTMLCanvasElement
  private gl: WebGL2RenderingContext
  private renderer: Renderer
  private skyRenderer: SkyRenderer
  private chunkRenderer: ChunkRenderer
  private world: World
  private registry: BlockRegistry
  private worldGen: WorldGenerator
  private biomeManager: BiomeManager
  private lighting: LightingEngine
  private chunkManager: ChunkManager
  private player: Player
  private input: InputManager
  private state: GameState = 'LOADING'
  private lastTime = 0
  private timeOfDay = 0.25
  private hudCanvas: HTMLCanvasElement
  private hudCtx: CanvasRenderingContext2D
  private fpsAccum = 0
  private fpsFrames = 0
  private currentFps = 0
  private debugVisible = false
  private loadingProgress = 0
  private loadingText = 'Initializing...'
  private _worldName = 'world'
  private _saveManager: any = null
  private autoSaveInterval = 300000
  private lastAutoSave = 0
  private inventory: Inventory
  private blockInteraction: BlockInteraction

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const gl = canvas.getContext('webgl2')
    if (!gl) throw new Error('WebGL2 not supported')
    this.gl = gl

    this.hudCanvas = document.createElement('canvas')
    this.hudCanvas.style.position = 'fixed'
    this.hudCanvas.style.top = '0'
    this.hudCanvas.style.left = '0'
    this.hudCanvas.style.width = '100%'
    this.hudCanvas.style.height = '100%'
    this.hudCanvas.style.pointerEvents = 'none'
    this.hudCanvas.style.zIndex = '1'
    this.hudCtx = this.hudCanvas.getContext('2d')!
    document.body.appendChild(this.hudCanvas)

    this.registry = new BlockRegistry()
    this.world = new World()
    this.biomeManager = new BiomeManager(12345)
    this.worldGen = new WorldGenerator(12345, this.registry, this.biomeManager)
    this.lighting = new LightingEngine(this.world, this.registry)
    this.renderer = new Renderer(gl)
    this.skyRenderer = new SkyRenderer(gl)
    this.chunkRenderer = new ChunkRenderer(gl, this.renderer, this.registry, this.world)
    this.chunkManager = new ChunkManager(this.world, this.worldGen, this.lighting, this.chunkRenderer)
    this.player = new Player(this.world, this.registry)
    this.input = new InputManager(canvas)

    this.inventory = new Inventory()
    this.inventory.addItem(1, 64)
    this.inventory.addItem(2, 64)
    this.inventory.addItem(3, 64)
    this.inventory.addItem(4, 64)
    this.inventory.addItem(5, 64)
    this.inventory.addItem(6, 64)
    this.inventory.addItem(9, 64)
    this.inventory.addItem(10, 64)
    this.inventory.addItem(8, 64)
    this.blockInteraction = new BlockInteraction(this.world, this.registry, this.chunkRenderer, this.inventory)

    const atlas = createProceduralTextureAtlas(gl)
    this.renderer.setTextureAtlas(atlas)

    canvas.addEventListener('click', () => {
      if (this.state === 'MENU') {
        this.startNewGame()
      } else if (this.state === 'PAUSED') {
        this.resumeGame()
      } else if (this.state === 'PLAYING' && !this.input.isPointerLocked()) {
        this.input.requestPointerLock()
      }
    })

    window.addEventListener('resize', () => this.resize())
    this.resize()
  }

  start(): void {
    this.state = 'MENU'
    this.lastTime = performance.now()
    requestAnimationFrame((time) => this.loop(time))
  }

  private loop(time: number): void {
    const dt = Math.min((time - this.lastTime) / 1000, 0.1)
    this.lastTime = time

    this.fpsAccum += dt
    this.fpsFrames++
    if (this.fpsAccum >= 1) {
      this.currentFps = this.fpsFrames / this.fpsAccum
      this.fpsAccum = 0
      this.fpsFrames = 0
    }

    switch (this.state) {
      case 'LOADING':
        this.renderLoadingScreen()
        break
      case 'MENU':
        this.renderMenu()
        break
      case 'PLAYING':
        this.updatePlaying(dt)
        this.renderPlaying()
        break
      case 'PAUSED':
        this.renderPlaying()
        this.renderPauseMenu()
        break
    }

    this.input.update()
    requestAnimationFrame((t) => this.loop(t))
  }

  private startNewGame(): void {
    this.state = 'LOADING'
    this.loadingText = 'Generating world...'
    this.loadingProgress = 0

    const totalChunks = 7 * 7
    let loaded = 0

    for (let cx = -3; cx <= 3; cx++) {
      for (let cz = -3; cz <= 3; cz++) {
        const chunk = this.world.getOrCreateChunk(cx, cz)
        this.worldGen.generateChunk(chunk)
        this.lighting.initializeSkyLight(cx, cz)
        for (let sy = 0; sy < SECTIONS_PER_CHUNK; sy++) {
          this.chunkRenderer.buildSection(cx, sy, cz)
        }
        loaded++
        this.loadingProgress = loaded / totalChunks
      }
    }

    this.player.position = [8, 80, 8]
    this.state = 'PLAYING'
    this.input.requestPointerLock()
  }

  private resumeGame(): void {
    this.state = 'PLAYING'
    this.input.requestPointerLock()
  }

  private pauseGame(): void {
    this.state = 'PAUSED'
    this.input.exitPointerLock()
  }

  private updatePlaying(dt: number): void {
    this.player.update(dt, this.input)
    this.chunkManager.update(this.player.position[0], this.player.position[2])
    this.timeOfDay += dt * 0.001
    if (this.timeOfDay >= 1) this.timeOfDay -= 1
    this.renderer.setTimeOfDay(this.timeOfDay)

    if (this.input.isKeyJustPressed('Escape')) this.pauseGame()
    if (this.input.isKeyJustPressed('F3')) this.debugVisible = !this.debugVisible

    this.blockInteraction.update(
      dt,
      this.player,
      this.input.isMouseButtonDown(0),
      this.input.isMouseButtonDown(2)
    )

    const now = performance.now()
    if (this._saveManager && now - this.lastAutoSave >= this.autoSaveInterval) {
      this.lastAutoSave = now
    }
  }

  private renderPlaying(): void {
    this.renderer.setCamera(
      this.player.position,
      this.player.yaw,
      this.player.pitch,
      Math.PI / 3,
      this.canvas.width / this.canvas.height
    )
    this.renderer.beginFrame()
    this.skyRenderer.render(
      this.renderer.camera.getProjectionMatrix(),
      this.renderer.camera.getViewMatrix(),
      this.timeOfDay
    )
    this.renderer.renderSections()
    this.renderer.endFrame()
    this.renderBlockHighlight()
    this.renderHUD()
  }

  private renderBlockHighlight(): void {
    const hit = this.blockInteraction.getLastHit()
    if (!hit) return

    const ctx = this.hudCtx
    const cam = this.renderer.camera
    const vp = cam.getViewProjectionMatrix()

    const corners: [number, number, number][] = []
    for (let dy = 0; dy <= 1; dy++) {
      for (let dz = 0; dz <= 1; dz++) {
        for (let dx = 0; dx <= 1; dx++) {
          corners.push([hit.x + dx, hit.y + dy, hit.z + dz])
        }
      }
    }

    const screenPoints: [number, number][] = []
    for (const c of corners) {
      const x = c[0] * vp[0] + c[1] * vp[4] + c[2] * vp[8] + vp[12]
      const y = c[0] * vp[1] + c[1] * vp[5] + c[2] * vp[9] + vp[13]
      const w = c[0] * vp[3] + c[1] * vp[7] + c[2] * vp[11] + vp[15]
      if (w <= 0) return
      const sx = (x / w * 0.5 + 0.5) * this.hudCanvas.width
      const sy = (1 - (y / w * 0.5 + 0.5)) * this.hudCanvas.height
      screenPoints.push([sx, sy])
    }

    const edges = [
      [0,1],[1,3],[3,2],[2,0],
      [4,5],[5,7],[7,6],[6,4],
      [0,4],[1,5],[2,6],[3,7],
    ]

    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 3
    ctx.beginPath()
    for (const [a, b] of edges) {
      ctx.moveTo(screenPoints[a][0], screenPoints[a][1])
      ctx.lineTo(screenPoints[b][0], screenPoints[b][1])
    }
    ctx.stroke()

    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (const [a, b] of edges) {
      ctx.moveTo(screenPoints[a][0], screenPoints[a][1])
      ctx.lineTo(screenPoints[b][0], screenPoints[b][1])
    }
    ctx.stroke()
  }

  private renderLoadingScreen(): void {
    const gl = this.gl
    gl.clearColor(0.05, 0.05, 0.1, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    const ctx = this.hudCtx
    const w = this.hudCanvas.width
    const h = this.hudCanvas.height
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#0d0d1a'
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = '#ffffff'
    ctx.font = `bold ${Math.floor(h * 0.08)}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Minecraft', w / 2, h * 0.35)

    ctx.font = `${Math.floor(h * 0.025)}px monospace`
    ctx.fillText(this.loadingText, w / 2, h * 0.5)

    const barW = w * 0.5
    const barH = h * 0.03
    const barX = (w - barW) / 2
    const barY = h * 0.58
    ctx.fillStyle = '#333333'
    ctx.fillRect(barX, barY, barW, barH)
    ctx.fillStyle = '#4caf50'
    ctx.fillRect(barX, barY, barW * this.loadingProgress, barH)
  }

  private renderMenu(): void {
    const gl = this.gl
    gl.clearColor(0.53, 0.81, 0.92, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    const ctx = this.hudCtx
    const w = this.hudCanvas.width
    const h = this.hudCanvas.height
    ctx.clearRect(0, 0, w, h)

    ctx.fillStyle = '#ffffff'
    ctx.font = `bold ${Math.floor(h * 0.1)}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Minecraft', w / 2, h * 0.35)

    ctx.font = `${Math.floor(h * 0.035)}px monospace`
    ctx.fillStyle = '#ffff00'
    ctx.fillText('Click to Play', w / 2, h * 0.55)

    ctx.font = `${Math.floor(h * 0.02)}px monospace`
    ctx.fillStyle = '#aaaaaa'
    ctx.fillText('v0.1.0', w / 2, h * 0.9)
  }

  private renderPauseMenu(): void {
    const ctx = this.hudCtx
    const w = this.hudCanvas.width
    const h = this.hudCanvas.height
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = '#ffffff'
    ctx.font = `bold ${Math.floor(h * 0.06)}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Game Paused', w / 2, h * 0.4)

    ctx.font = `${Math.floor(h * 0.03)}px monospace`
    ctx.fillStyle = '#ffff00'
    ctx.fillText('Click to Resume', w / 2, h * 0.5)
  }

  private renderHUD(): void {
    const ctx = this.hudCtx
    const w = this.hudCanvas.width
    const h = this.hudCanvas.height
    ctx.clearRect(0, 0, w, h)

    const cx = w / 2
    const cy = h / 2
    const size = Math.max(2, Math.floor(h * 0.015))
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cx - size, cy)
    ctx.lineTo(cx + size, cy)
    ctx.moveTo(cx, cy - size)
    ctx.lineTo(cx, cy + size)
    ctx.stroke()

    const slotSize = Math.floor(h * 0.045)
    const hotbarW = slotSize * 9
    const hotbarX = (w - hotbarW) / 2
    const hotbarY = h - slotSize - Math.floor(h * 0.02)
    for (let i = 0; i < 9; i++) {
      const sx = hotbarX + i * slotSize
      ctx.strokeStyle = i === this.player.selectedSlot ? '#ffffff' : '#555555'
      ctx.lineWidth = i === this.player.selectedSlot ? 3 : 1
      ctx.strokeRect(sx, hotbarY, slotSize, slotSize)
    }

    const heartSize = Math.floor(h * 0.02)
    const heartY = hotbarY - heartSize - Math.floor(h * 0.015)
    for (let i = 0; i < 10; i++) {
      const hx = hotbarX + i * (heartSize + 2)
      ctx.fillStyle = '#ff0000'
      ctx.fillRect(hx, heartY, heartSize, heartSize)
    }

    const hungerX = hotbarX + hotbarW - 10 * (heartSize + 2)
    for (let i = 0; i < 10; i++) {
      const hx = hungerX + i * (heartSize + 2)
      ctx.fillStyle = '#cd853f'
      ctx.fillRect(hx, heartY, heartSize, heartSize)
    }

    if (this.debugVisible) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(4, 4, 300, 120)
      ctx.fillStyle = '#ffffff'
      ctx.font = `${Math.floor(h * 0.018)}px monospace`
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      const pos = this.player.position
      ctx.fillText(`FPS: ${this.currentFps.toFixed(1)}`, 10, 10)
      ctx.fillText(`XYZ: ${pos[0].toFixed(1)} / ${pos[1].toFixed(1)} / ${pos[2].toFixed(1)}`, 10, 30)
      ctx.fillText(`Chunks: ${this.chunkManager.getLoadedChunkCount()}`, 10, 50)
      ctx.fillText(`Time: ${(this.timeOfDay * 24).toFixed(1)}`, 10, 70)
      ctx.fillText(`World: ${this._worldName}`, 10, 90)
    }
  }

  private resize(): void {
    const dpr = window.devicePixelRatio || 1
    this.canvas.width = window.innerWidth * dpr
    this.canvas.height = window.innerHeight * dpr
    this.hudCanvas.width = window.innerWidth * dpr
    this.hudCanvas.height = window.innerHeight * dpr
    this.hudCanvas.style.width = window.innerWidth + 'px'
    this.hudCanvas.style.height = window.innerHeight + 'px'
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
  }
}
