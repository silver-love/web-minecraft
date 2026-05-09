import './style.css'
import { Renderer } from './renderer/Renderer'
import { createProceduralTextureAtlas } from './renderer/TextureAtlas'
import { World } from './world/World'
import { BlockRegistry } from './world/BlockRegistry'
import { ChunkMesher } from './world/ChunkMesher'
import { ChunkManager } from './world/ChunkManager'
import { WorldGenerator } from './world/WorldGenerator'
import { BiomeManager } from './world/Biome'
import { LightingEngine } from './world/Lighting'
import { InputManager } from './player/InputManager'
import { Player } from './player/Player'
import { GameManager } from './game/GameManager'
import { GameMode } from './game/GameMode'
import { BlockInteraction } from './game/BlockInteraction'
import { SaveManager } from './game/SaveManager'
import { AutoSave } from './game/AutoSave'
import { Chunk } from './world/Chunk'
import type { WorldMetaData } from './game/SaveManager'
import { TickSystem } from './game/TickSystem'
import { HUD } from './ui/HUD'
import { DebugOverlay } from './ui/DebugOverlay'
import { CommandSystem } from './game/CommandSystem'

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement

if (!canvas) {
  throw new Error('Canvas element #game-canvas not found')
}

const gl: WebGL2RenderingContext | null = canvas.getContext('webgl2', {
  antialias: false,
  alpha: false,
})

if (!gl) {
  const errorDiv = document.createElement('div')
  errorDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:white;font-family:monospace;background:#111;flex-direction:column;gap:16px;'
  const title = document.createElement('div')
  title.textContent = 'WebGL 2.0 Not Available'
  title.style.cssText = 'font-size:32px;'
  const sub = document.createElement('div')
  sub.textContent = 'This game requires a browser with WebGL 2.0 support and a GPU.'
  sub.style.cssText = 'font-size:16px;opacity:0.7;'
  errorDiv.appendChild(title)
  errorDiv.appendChild(sub)
  document.body.appendChild(errorDiv)
  throw new Error('WebGL2 not supported')
}

const glCtx = gl

const DEFAULT_SEED = 12345
const WORLD_NAME = 'world'

const saveManager = new SaveManager()
const autoSave = new AutoSave(saveManager)

const registry = new BlockRegistry()
const mesher = new ChunkMesher(registry)
const renderer = new Renderer(glCtx)

const texture = createProceduralTextureAtlas(glCtx)
renderer.setTextureAtlas(texture)

const input = new InputManager(canvas)
const tickSystem = new TickSystem()

const hudCanvas = document.getElementById('hud-canvas') as HTMLCanvasElement
const hud = new HUD(hudCanvas)
const debugOverlay = new DebugOverlay(hudCanvas)

const fov = Math.PI / 3
let lastTime = performance.now()
let gameStarted = false
let loading = false
let currentSeed = DEFAULT_SEED
let chatOpen = false
let fpsAccum = 0
let fpsFrames = 0
let currentFps = 0

let world!: World
let player!: Player
let gameManager!: GameManager
let chunkManager!: ChunkManager
let blockInteraction!: BlockInteraction
let commandSystem!: CommandSystem

const overlay = document.createElement('div')
overlay.style.cssText = [
  'position: fixed',
  'top: 0',
  'left: 0',
  'width: 100%',
  'height: 100%',
  'display: flex',
  'flex-direction: column',
  'align-items: center',
  'justify-content: center',
  'color: white',
  'font-family: monospace',
  'background: rgba(0, 0, 0, 0.85)',
  'cursor: pointer',
  'z-index: 10',
].join('; ')

const titleText = document.createElement('div')
titleText.textContent = 'Web Minecraft'
titleText.style.cssText = 'font-size: 64px; margin-bottom: 24px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);'
overlay.appendChild(titleText)

const playText = document.createElement('div')
playText.textContent = 'Click to Play'
playText.style.cssText = 'font-size: 24px; opacity: 0.8; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);'
overlay.appendChild(playText)

document.body.appendChild(overlay)

const chatContainer = document.createElement('div')
chatContainer.style.cssText = [
  'position: fixed',
  'bottom: 0',
  'left: 0',
  'width: 40%',
  'z-index: 5',
  'pointer-events: none',
  'display: flex',
  'flex-direction: column',
  'justify-content: flex-end',
  'padding: 8px',
].join('; ')
document.body.appendChild(chatContainer)

const chatMessages = document.createElement('div')
chatContainer.appendChild(chatMessages)

const chatInput = document.createElement('input')
chatInput.type = 'text'
chatInput.style.cssText = [
  'width: 100%',
  'padding: 4px 8px',
  'font-family: monospace',
  'font-size: 14px',
  'background: rgba(0, 0, 0, 0.6)',
  'color: white',
  'border: 2px solid rgba(255, 255, 255, 0.3)',
  'outline: none',
  'display: none',
  'pointer-events: auto',
].join('; ')
chatContainer.appendChild(chatInput)

chatInput.addEventListener('keydown', (e: KeyboardEvent) => {
  e.stopPropagation()
  if (e.key === 'Enter') {
    const text = chatInput.value.trim()
    if (text.length > 0) {
      if (text.startsWith('/')) {
        const output = commandSystem.execute(text)
        addChatMessage(output)
      } else {
        addChatMessage(text)
      }
    }
    closeChat()
  } else if (e.key === 'Escape') {
    closeChat()
  }
})

chatInput.addEventListener('blur', () => {
  if (chatOpen) {
    closeChat()
  }
})

function openChat(prefix: string): void {
  chatOpen = true
  input.disabled = true
  input.reset()
  document.exitPointerLock()
  chatInput.style.display = 'block'
  chatInput.value = prefix
  chatInput.focus()
}

function closeChat(): void {
  chatOpen = false
  chatInput.style.display = 'none'
  chatInput.value = ''
  input.disabled = false
  input.reset()
}

function addChatMessage(text: string): void {
  const msg = document.createElement('div')
  msg.textContent = text
  msg.style.cssText = 'color: white; font-family: monospace; font-size: 13px; padding: 2px 4px; text-shadow: 1px 1px 1px rgba(0,0,0,0.8);'
  chatMessages.appendChild(msg)
  while (chatMessages.children.length > 20) {
    chatMessages.removeChild(chatMessages.firstChild!)
  }
  setTimeout(() => {
    if (msg.parentNode) {
      msg.style.transition = 'opacity 1s'
      msg.style.opacity = '0'
      setTimeout(() => {
        if (msg.parentNode) msg.parentNode.removeChild(msg)
      }, 1000)
    }
  }, 8000)
}

function resize(): void {
  const dpr = window.devicePixelRatio || 1
  canvas.width = window.innerWidth * dpr
  canvas.height = window.innerHeight * dpr
  hudCanvas.width = window.innerWidth * dpr
  hudCanvas.height = window.innerHeight * dpr
  glCtx.viewport(0, 0, canvas.width, canvas.height)
}

window.addEventListener('resize', resize)
resize()

function getMetadata(): WorldMetaData {
  return {
    seed: currentSeed,
    gameMode: gameManager.gameMode as number,
    gameTime: gameManager.gameTime,
    playerPosition: [...player.position] as [number, number, number],
    playerYaw: player.yaw,
    playerPitch: player.pitch,
    inventoryData: gameManager.inventory.serialize(),
    health: gameManager.health,
    hunger: gameManager.hunger,
  }
}

async function startGame(): Promise<void> {
  if (loading) return
  loading = true

  let seed = DEFAULT_SEED
  let loadedChunks: Map<string, Chunk> | null = null
  let metadata: WorldMetaData | null = null

  const lastWorld = localStorage.getItem('minecraft_lastworld')
  if (lastWorld) {
    try {
      const loaded = await saveManager.loadWorld(lastWorld)
      seed = loaded.metadata.seed
      metadata = loaded.metadata
      loadedChunks = new Map()
      for (const c of loaded.chunks) {
        const parts = c.key.split(',')
        const cx = Number(parts[0])
        const cz = Number(parts[1])
        loadedChunks.set(c.key, Chunk.fromData(cx, cz, c.data, c.skyLight, c.blockLight))
      }
    } catch {
      loadedChunks = null
      metadata = null
    }
  }

  currentSeed = seed
  world = new World()
  if (loadedChunks) {
    world.chunks = loadedChunks
  }

  const biomeManager = new BiomeManager(seed)
  const worldGen = new WorldGenerator(seed, registry, biomeManager)
  const lighting = new LightingEngine(world, registry)
  chunkManager = new ChunkManager(world, mesher, glCtx, renderer, worldGen, lighting)

  player = new Player()
  gameManager = new GameManager()
  gameManager.chunkManager = chunkManager
  blockInteraction = new BlockInteraction(gameManager, world, registry)
  commandSystem = new CommandSystem(world, player, gameManager, registry, currentSeed)

  if (metadata) {
    player.position = [...metadata.playerPosition] as [number, number, number]
    player.yaw = metadata.playerYaw
    player.pitch = metadata.playerPitch
    gameManager.gameMode = metadata.gameMode as GameMode
    gameManager.gameTime = metadata.gameTime
    gameManager.health = metadata.health
    gameManager.hunger = metadata.hunger
    gameManager.inventory.deserialize(metadata.inventoryData)
  } else {
    player.position = [8, 40, 80]
    gameManager.inventory.slots[0] = { id: 1, count: 64 }
    gameManager.inventory.slots[1] = { id: 2, count: 64 }
    gameManager.inventory.slots[2] = { id: 3, count: 64 }
    gameManager.inventory.slots[3] = { id: 4, count: 64 }
    gameManager.inventory.slots[4] = { id: 5, count: 64 }
    gameManager.inventory.slots[5] = { id: 9, count: 64 }
    gameManager.inventory.slots[6] = { id: 8, count: 64 }
    gameManager.inventory.slots[7] = { id: 6, count: 64 }
    gameManager.inventory.slots[8] = { id: 17, count: 64 }
  }

  localStorage.setItem('minecraft_lastworld', WORLD_NAME)
  autoSave.start(WORLD_NAME, getMetadata, () => world.chunks)

  overlay.style.display = 'none'
  gameStarted = true
  lastTime = performance.now()
  requestAnimationFrame(gameLoop)
}

overlay.addEventListener('click', () => {
  if (!gameStarted && !loading) {
    startGame()
  }
})

canvas.addEventListener('click', () => {
  if (gameStarted) {
    if (chatOpen) {
      closeChat()
    } else {
      input.requestPointerLock()
    }
  }
})

window.addEventListener('beforeunload', () => {
  if (gameStarted) {
    saveManager.saveWorld(WORLD_NAME, getMetadata(), world.chunks)
  }
})

function gameLoop(): void {
  if (!gameStarted) return

  const now = performance.now()
  const dt = Math.min((now - lastTime) / 1000, 0.1)
  lastTime = now

  if (!chatOpen) {
    if (input.isKeyJustPressed('KeyT')) {
      openChat('')
    } else if (input.isKeyJustPressed('Slash')) {
      openChat('/')
    }
  }

  if (!chatOpen) {
    tickSystem.update(dt, () => {
      gameManager.update(tickSystem.tickTime)
    })

    player.update(dt, input, world, registry)
    blockInteraction.update(dt, player, input)
  }

  renderer.setTimeOfDay(gameManager.getTimeOfDay())

  const eyePos = player.getEyePosition()
  renderer.setCamera(eyePos, player.yaw, player.pitch, fov, canvas.width / canvas.height)

  chunkManager.update(player.position[0], player.position[2])

  renderer.beginFrame()
  renderer.renderChunks()
  renderer.endFrame()

  fpsAccum += dt
  fpsFrames++
  if (fpsAccum >= 1) {
    currentFps = fpsFrames / fpsAccum
    fpsAccum = 0
    fpsFrames = 0
  }

  hud.render(gameManager.inventory, gameManager.health, gameManager.hunger, gameManager.gameMode)

  if (input.isKeyJustPressed('F3')) {
    debugOverlay.visible = !debugOverlay.visible
  }
  debugOverlay.render(player, currentFps, world.chunks.size, player.position, gameManager.gameTime)

  input.update()
  requestAnimationFrame(gameLoop)
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').catch(() => {})
}
