import { SaveManager } from './SaveManager'
import type { WorldMetaData } from './SaveManager'
import type { Chunk } from '../world/Chunk'

export class AutoSave {
  private saveManager: SaveManager
  interval: number = 60000
  enabled: boolean = true
  private timerId: number | null = null
  private saving: boolean = false
  private worldName: string = ''
  private getMetadataFn: (() => WorldMetaData) | null = null
  private getChunksFn: (() => Map<string, Chunk>) | null = null

  constructor(saveManager: SaveManager) {
    this.saveManager = saveManager
  }

  start(worldName: string, getMetadata: () => WorldMetaData, getChunks: () => Map<string, Chunk>): void {
    this.stop()
    this.worldName = worldName
    this.getMetadataFn = getMetadata
    this.getChunksFn = getChunks
    this.timerId = window.setInterval(() => {
      if (this.enabled) {
        this.save()
      }
    }, this.interval)
  }

  stop(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId)
      this.timerId = null
    }
  }

  async forceSave(): Promise<void> {
    await this.save()
  }

  private async save(): Promise<void> {
    if (this.saving) return
    if (!this.getMetadataFn || !this.getChunksFn) return
    this.saving = true
    try {
      await this.saveManager.saveWorld(this.worldName, this.getMetadataFn(), this.getChunksFn())
    } finally {
      this.saving = false
    }
  }
}
