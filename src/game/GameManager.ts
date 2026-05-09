import { Inventory } from './Inventory'
import { GameMode } from './GameMode'
import type { World } from '../world/World'
import type { BlockRegistry } from '../world/BlockRegistry'
import type { ChunkManager } from '../world/ChunkManager'

export class GameManager {
  gameMode: GameMode = GameMode.CREATIVE
  inventory: Inventory = new Inventory()
  health: number = 20
  hunger: number = 20
  gameTime: number = 0
  dayLength: number = 24000
  chunkManager: ChunkManager | null = null

  update(dt: number): void {
    this.gameTime += dt * 20
    if (this.gameTime >= this.dayLength) {
      this.gameTime -= this.dayLength
    }

    if (this.gameMode === GameMode.SURVIVAL) {
      this.hunger = Math.max(0, this.hunger - dt * 0.05)
      if (this.hunger >= 18) {
        this.health = Math.min(20, this.health + dt * 0.5)
      } else if (this.hunger <= 0) {
        this.health = Math.max(0, this.health - dt * 0.5)
      }
    }
  }

  getTimeOfDay(): number {
    return this.gameTime / this.dayLength
  }

  isDaytime(): boolean {
    const tod = this.getTimeOfDay()
    return tod >= 0.0 && tod < 0.5
  }

  breakBlock(world: World, _registry: BlockRegistry, x: number, y: number, z: number): boolean {
    const blockId = world.getBlock(x, y, z)
    if (blockId === 0) return false
    if (blockId === 15 && this.gameMode !== GameMode.CREATIVE) return false

    world.setBlock(x, y, z, 0)

    if (this.gameMode === GameMode.SURVIVAL) {
      this.inventory.addItem(blockId, 1)
    }

    if (this.chunkManager) {
      this.chunkManager.rebuildChunkAt(x, z)
    }

    return true
  }

  placeBlock(world: World, _registry: BlockRegistry, x: number, y: number, z: number, blockId: number): boolean {
    const existing = world.getBlock(x, y, z)
    if (existing !== 0) return false
    if (y < 0 || y >= 384) return false

    if (this.gameMode === GameMode.SURVIVAL) {
      const selectedItem = this.inventory.getSelectedItem()
      if (!selectedItem || selectedItem.id !== blockId) return false
      if (!this.inventory.removeItem(this.inventory.selectedSlot, 1)) return false
    }

    world.setBlock(x, y, z, blockId)

    if (this.chunkManager) {
      this.chunkManager.rebuildChunkAt(x, z)
    }

    return true
  }

  getSpawnPosition(): [number, number, number] {
    return [8, 40, 80]
  }
}
