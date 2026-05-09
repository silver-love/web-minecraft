export interface WorldMetaData {
  seed: number;
  playerPosition: [number, number, number];
  playerYaw: number;
  playerPitch: number;
  gameMode: number;
  gameTime: number;
  health: number;
  hunger: number;
  inventoryData: string;
}

export class SaveManager {
  private dbName = 'minecraft_saves';
  private storeName = 'worlds';
  private db: IDBDatabase | null = null;

  private openDatabase(): Promise<IDBDatabase> {
    if (this.db) {
      return Promise.resolve(this.db);
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(this.storeName)) {
          database.createObjectStore(this.storeName);
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async saveWorld(name: string, metadata: WorldMetaData, chunks: Map<string, any>): Promise<void> {
    const db = await this.openDatabase();
    const transaction = db.transaction(this.storeName, 'readwrite');
    const store = transaction.objectStore(this.storeName);

    store.put({ type: 'metadata', data: metadata }, `${name}:metadata`);

    const chunkEntries = Array.from(chunks.entries());
    for (const [key, value] of chunkEntries) {
      store.put({ type: 'chunk', key, data: value }, `${name}:chunk:${key}`);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async loadWorld(name: string): Promise<{ metadata: WorldMetaData; chunks: any[] }> {
    const db = await this.openDatabase();
    const transaction = db.transaction(this.storeName, 'readonly');
    const store = transaction.objectStore(this.storeName);

    const metadataRequest = store.get(`${name}:metadata`);
    const metadata = await new Promise<WorldMetaData>((resolve, reject) => {
      metadataRequest.onsuccess = () => resolve(metadataRequest.result.data);
      metadataRequest.onerror = () => reject(metadataRequest.error);
    });

    const range = IDBKeyRange.lowerBound(`${name}:chunk:`);
    const cursorRequest = store.openCursor(range);
    const chunks: any[] = [];

    await new Promise<void>((resolve, reject) => {
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (cursor) {
          if (cursor.key.toString().startsWith(`${name}:chunk:`)) {
            chunks.push(cursor.value.data);
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      cursorRequest.onerror = () => reject(cursorRequest.error);
    });

    return { metadata, chunks };
  }

  async listWorlds(): Promise<string[]> {
    const db = await this.openDatabase();
    const transaction = db.transaction(this.storeName, 'readonly');
    const store = transaction.objectStore(this.storeName);

    const allKeysRequest = store.getAllKeys();

    return new Promise((resolve, reject) => {
      allKeysRequest.onsuccess = () => {
        const keys = allKeysRequest.result as IDBValidKey[];
        const worldNames = new Set<string>();
        for (const key of keys) {
          const keyStr = key.toString();
          if (keyStr.endsWith(':metadata')) {
            worldNames.add(keyStr.slice(0, -(':metadata'.length)));
          }
        }
        resolve(Array.from(worldNames));
      };
      allKeysRequest.onerror = () => reject(allKeysRequest.error);
    });
  }

  async deleteWorld(name: string): Promise<void> {
    const db = await this.openDatabase();
    const transaction = db.transaction(this.storeName, 'readwrite');
    const store = transaction.objectStore(this.storeName);

    const range = IDBKeyRange.lowerBound(name);
    const cursorRequest = store.openCursor(range);

    await new Promise<void>((resolve, reject) => {
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (cursor) {
          const keyStr = cursor.key.toString();
          if (keyStr === `${name}:metadata` || keyStr.startsWith(`${name}:chunk:`)) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      cursorRequest.onerror = () => reject(cursorRequest.error);
    });
  }
}
