import type { Chunk } from '../world/Chunk'

export interface WorldMetaData {
  seed: number
  gameMode: number
  gameTime: number
  playerPosition: [number, number, number]
  playerYaw: number
  playerPitch: number
  inventoryData: string
  health: number
  hunger: number
}

export class SaveManager {
  private openDatabase(worldName: string): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(`minecraft_${worldName}`, 1)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('chunks')) {
          db.createObjectStore('chunks', { keyPath: 'key' })
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async saveWorld(worldName: string, metadata: WorldMetaData, chunks: Map<string, Chunk>): Promise<void> {
    const db = await this.openDatabase(worldName)
    const tx = db.transaction(['metadata', 'chunks'], 'readwrite')
    const metadataStore = tx.objectStore('metadata')
    const chunksStore = tx.objectStore('chunks')

    metadataStore.put({ id: 'main', data: metadata })

    for (const [key, chunk] of chunks) {
      const blocks = chunk.blocks
      chunksStore.put({
        key,
        blocks: blocks.buffer.slice(blocks.byteOffset, blocks.byteOffset + blocks.byteLength),
        skyLight: chunk.skyLight.buffer.slice(chunk.skyLight.byteOffset, chunk.skyLight.byteOffset + chunk.skyLight.byteLength),
        blockLight: chunk.blockLight.buffer.slice(chunk.blockLight.byteOffset, chunk.blockLight.byteOffset + chunk.blockLight.byteLength),
      })
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => { db.close(); resolve() }
      tx.onerror = () => { db.close(); reject(tx.error) }
    })
  }

  async loadWorld(worldName: string): Promise<{
    metadata: WorldMetaData
    chunks: Array<{ key: string; data: Uint16Array; skyLight: Uint8Array; blockLight: Uint8Array }>
  }> {
    const db = await this.openDatabase(worldName)
    const tx = db.transaction(['metadata', 'chunks'], 'readonly')
    const metadataStore = tx.objectStore('metadata')
    const chunksStore = tx.objectStore('chunks')

    const metadataRequest = metadataStore.get('main')
    const chunksRequest = chunksStore.getAll()

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        db.close()
        const metadata: WorldMetaData = metadataRequest.result.data
        const chunksResult: Array<{ key: string; data: Uint16Array; skyLight: Uint8Array; blockLight: Uint8Array }> = chunksRequest.result.map(
          (row: { key: string; blocks: ArrayBuffer; skyLight: ArrayBuffer; blockLight: ArrayBuffer }) => ({
            key: row.key,
            data: new Uint16Array(row.blocks),
            skyLight: new Uint8Array(row.skyLight),
            blockLight: new Uint8Array(row.blockLight),
          }),
        )
        resolve({ metadata, chunks: chunksResult })
      }
      tx.onerror = () => { db.close(); reject(tx.error) }
    })
  }

  async listWorlds(): Promise<string[]> {
    const databases = await indexedDB.databases()
    return databases
      .filter(db => db.name?.startsWith('minecraft_'))
      .map(db => db.name!.substring('minecraft_'.length))
  }

  async deleteWorld(worldName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(`minecraft_${worldName}`)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async exportWorld(worldName: string): Promise<Blob> {
    const { metadata, chunks } = await this.loadWorld(worldName)
    const parts: ArrayBuffer[] = []

    const magic = new TextEncoder().encode('MCWS')
    parts.push(magic.buffer as ArrayBuffer)

    const version = new Uint32Array([1])
    parts.push(version.buffer as ArrayBuffer)

    const metadataJson = new TextEncoder().encode(JSON.stringify(metadata))
    const metadataLen = new Uint32Array([metadataJson.length])
    parts.push(metadataLen.buffer as ArrayBuffer)
    parts.push(metadataJson.buffer as ArrayBuffer)

    const numChunks = new Uint32Array([chunks.length])
    parts.push(numChunks.buffer as ArrayBuffer)

    for (const chunk of chunks) {
      const keyBytes = new TextEncoder().encode(chunk.key)
      const keyLen = new Uint32Array([keyBytes.length])
      parts.push(keyLen.buffer as ArrayBuffer)
      parts.push(keyBytes.buffer as ArrayBuffer)

      const blocksLen = new Uint32Array([chunk.data.byteLength])
      parts.push(blocksLen.buffer as ArrayBuffer)
      parts.push(chunk.data.buffer.slice(chunk.data.byteOffset, chunk.data.byteOffset + chunk.data.byteLength) as ArrayBuffer)

      const skyLightLen = new Uint32Array([chunk.skyLight.byteLength])
      parts.push(skyLightLen.buffer as ArrayBuffer)
      parts.push(chunk.skyLight.buffer.slice(chunk.skyLight.byteOffset, chunk.skyLight.byteOffset + chunk.skyLight.byteLength) as ArrayBuffer)

      const blockLightLen = new Uint32Array([chunk.blockLight.byteLength])
      parts.push(blockLightLen.buffer as ArrayBuffer)
      parts.push(chunk.blockLight.buffer.slice(chunk.blockLight.byteOffset, chunk.blockLight.byteOffset + chunk.blockLight.byteLength) as ArrayBuffer)
    }

    return new Blob(parts, { type: 'application/octet-stream' })
  }

  async importWorld(file: File): Promise<string> {
    const buffer = await file.arrayBuffer()
    const view = new DataView(buffer)
    let offset = 0

    const magic = new TextDecoder().decode(new Uint8Array(buffer, offset, 4))
    offset += 4
    if (magic !== 'MCWS') throw new Error('Invalid save file')

    const version = view.getUint32(offset, true)
    offset += 4
    if (version !== 1) throw new Error('Unsupported save version')

    const metadataLen = view.getUint32(offset, true)
    offset += 4
    const metadataJson = new TextDecoder().decode(new Uint8Array(buffer, offset, metadataLen))
    offset += metadataLen
    const metadata: WorldMetaData = JSON.parse(metadataJson)

    const numChunks = view.getUint32(offset, true)
    offset += 4

    const chunks: Array<{ key: string; data: Uint16Array; skyLight: Uint8Array; blockLight: Uint8Array }> = []
    for (let i = 0; i < numChunks; i++) {
      const keyLen = view.getUint32(offset, true)
      offset += 4
      const key = new TextDecoder().decode(new Uint8Array(buffer, offset, keyLen))
      offset += keyLen

      const blocksLen = view.getUint32(offset, true)
      offset += 4
      const data = new Uint16Array(buffer.slice(offset, offset + blocksLen))
      offset += blocksLen

      const skyLightLen = view.getUint32(offset, true)
      offset += 4
      const skyLight = new Uint8Array(buffer.slice(offset, offset + skyLightLen))
      offset += skyLightLen

      const blockLightLen = view.getUint32(offset, true)
      offset += 4
      const blockLight = new Uint8Array(buffer.slice(offset, offset + blockLightLen))
      offset += blockLightLen

      chunks.push({ key, data, skyLight, blockLight })
    }

    const worldName = file.name.replace(/\.[^.]+$/, '')
    const db = await this.openDatabase(worldName)
    const tx = db.transaction(['metadata', 'chunks'], 'readwrite')

    tx.objectStore('metadata').put({ id: 'main', data: metadata })

    for (const chunk of chunks) {
      tx.objectStore('chunks').put({
        key: chunk.key,
        blocks: chunk.data.buffer.slice(chunk.data.byteOffset, chunk.data.byteOffset + chunk.data.byteLength),
        skyLight: chunk.skyLight.buffer.slice(chunk.skyLight.byteOffset, chunk.skyLight.byteOffset + chunk.skyLight.byteLength),
        blockLight: chunk.blockLight.buffer.slice(chunk.blockLight.byteOffset, chunk.blockLight.byteOffset + chunk.blockLight.byteLength),
      })
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => { db.close(); resolve(worldName) }
      tx.onerror = () => { db.close(); reject(tx.error) }
    })
  }
}
