import type { GameManager } from './GameManager'
import type { World } from '../world/World'
import type { BlockRegistry } from '../world/BlockRegistry'
import type { Player } from '../player/Player'
import type { InputManager } from '../player/InputManager'
import { rayCast } from '../player/RayCast'

export class BlockInteraction {
  private gameManager: GameManager
  private world: World
  private registry: BlockRegistry
  private breakCooldown = 0
  private placeCooldown = 0
  private readonly BREAK_DELAY = 0.25
  private readonly PLACE_DELAY = 0.25
  private readonly REACH = 8

  constructor(gameManager: GameManager, world: World, registry: BlockRegistry) {
    this.gameManager = gameManager
    this.world = world
    this.registry = registry
  }

  handleBreak(player: Player): boolean {
    const target = this.getTargetBlock(player)
    if (!target || !target.hit) return false
    return this.gameManager.breakBlock(this.world, this.registry, target.blockX, target.blockY, target.blockZ)
  }

  handlePlace(player: Player): boolean {
    const target = this.getTargetBlock(player)
    if (!target || !target.hit) return false
    const selectedItem = this.gameManager.inventory.getSelectedItem()
    if (!selectedItem) return false
    return this.gameManager.placeBlock(this.world, this.registry, target.prevX, target.prevY, target.prevZ, selectedItem.id)
  }

  getTargetBlock(player: Player): { hit: boolean; blockX: number; blockY: number; blockZ: number; prevX: number; prevY: number; prevZ: number } | null {
    const eyePos = player.getEyePosition()
    const direction: [number, number, number] = [
      Math.sin(player.yaw) * Math.cos(player.pitch),
      Math.sin(player.pitch),
      -Math.cos(player.yaw) * Math.cos(player.pitch),
    ]
    return rayCast(this.world, this.registry, eyePos, direction, this.REACH)
  }

  update(dt: number, player: Player, input: InputManager): void {
    this.breakCooldown = Math.max(0, this.breakCooldown - dt)
    this.placeCooldown = Math.max(0, this.placeCooldown - dt)

    if (input.isPointerLocked()) {
      if (input.isMouseButtonDown(0) && this.breakCooldown <= 0) {
        if (this.handleBreak(player)) {
          this.breakCooldown = this.BREAK_DELAY
        }
      }

      if (input.isMouseButtonDown(2) && this.placeCooldown <= 0) {
        if (this.handlePlace(player)) {
          this.placeCooldown = this.PLACE_DELAY
        }
      }
    }
  }
}
