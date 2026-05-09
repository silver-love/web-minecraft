import type { World } from '../world/World'
import type { Player } from '../player/Player'
import type { GameManager } from './GameManager'
import type { BlockRegistry } from '../world/BlockRegistry'
import { GameMode } from './GameMode'

export class CommandSystem {
  private player: Player
  private gameManager: GameManager
  private registry: BlockRegistry
  private seed: number

  constructor(_world: World, player: Player, gameManager: GameManager, registry: BlockRegistry, seed: number) {
    this.player = player
    this.gameManager = gameManager
    this.registry = registry
    this.seed = seed
  }

  execute(input: string): string {
    const parts = input.trim().split(/\s+/)
    const command = parts[0]

    switch (command) {
      case '/tp': return this.cmdTp(parts)
      case '/give': return this.cmdGive(parts)
      case '/gamemode': return this.cmdGamemode(parts)
      case '/time': return this.cmdTime(parts)
      case '/seed': return this.cmdSeed()
      case '/help': return this.cmdHelp()
      default: return `Unknown command: ${command}. Type /help for a list of commands.`
    }
  }

  private cmdTp(parts: string[]): string {
    if (parts.length < 4) return 'Usage: /tp <x> <y> <z>'
    const x = parseFloat(parts[1])
    const y = parseFloat(parts[2])
    const z = parseFloat(parts[3])
    if (isNaN(x) || isNaN(y) || isNaN(z)) return 'Invalid coordinates'
    this.player.position = [x, y, z]
    return `Teleported to ${x}, ${y}, ${z}`
  }

  private cmdGive(parts: string[]): string {
    if (parts.length < 2) return 'Usage: /give <blockId> [count]'
    const blockId = parseInt(parts[1])
    const count = parts.length >= 3 ? parseInt(parts[2]) : 64
    if (isNaN(blockId)) return 'Invalid block ID'
    if (isNaN(count) || count < 1) return 'Invalid count'
    try {
      const block = this.registry.get(blockId)
      this.gameManager.inventory.addItem(blockId, count)
      return `Gave ${count}x ${block.name}`
    } catch {
      return `Unknown block ID: ${blockId}`
    }
  }

  private cmdGamemode(parts: string[]): string {
    if (parts.length < 2) return 'Usage: /gamemode <mode>'
    const mode = parts[1].toLowerCase()
    if (mode === 'survival' || mode === 's') {
      this.gameManager.gameMode = GameMode.SURVIVAL
      return 'Game mode set to Survival'
    }
    if (mode === 'creative' || mode === 'c') {
      this.gameManager.gameMode = GameMode.CREATIVE
      return 'Game mode set to Creative'
    }
    return 'Unknown game mode. Use: survival, creative, s, c'
  }

  private cmdTime(parts: string[]): string {
    if (parts.length < 3 || parts[1] !== 'set') return 'Usage: /time set <value>'
    const value = parseInt(parts[2])
    if (isNaN(value)) return 'Invalid time value'
    this.gameManager.gameTime = value
    return `Time set to ${value}`
  }

  private cmdSeed(): string {
    return `Seed: ${this.seed}`
  }

  private cmdHelp(): string {
    return 'Commands: /tp <x> <y> <z>, /give <blockId> [count], /gamemode <mode>, /time set <value>, /seed, /help'
  }
}
