import { Inventory } from './Inventory';

export const GameMode = { SURVIVAL: 0, CREATIVE: 1 } as const;
export type GameModeType = (typeof GameMode)[keyof typeof GameMode];

export class GameManager {
  gameMode: GameModeType = GameMode.CREATIVE;
  gameTime = 0;
  health = 20;
  hunger = 20;
  inventory: Inventory;
  world: any = null;
  chunkManager: any = null;
  chunkRenderer: any = null;
  lighting: any = null;
  registry: any = null;

  constructor() {
    this.inventory = new Inventory();

    if (this.gameMode === GameMode.CREATIVE) {
      const hotbarBlocks = [1, 2, 3, 4, 5, 6, 8, 9, 10];
      for (let i = 0; i < hotbarBlocks.length; i++) {
        this.inventory.slots[i] = { id: hotbarBlocks[i], count: 64 };
      }
    }
  }

  update(dt: number): void {
    this.gameTime += dt;

    if (this.gameMode === GameMode.SURVIVAL) {
      if (this.hunger >= 18 && this.health < 20) {
        this.health = Math.min(20, this.health + dt * 0.5);
      }
      if (this.hunger > 0) {
        this.hunger = Math.max(0, this.hunger - dt * 0.01);
      }
    } else {
      this.health = 20;
      this.hunger = 20;
    }
  }
}
