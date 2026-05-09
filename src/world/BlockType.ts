export interface BlockType {
  id: number;
  name: string;
  transparent: boolean;
  solid: boolean;
  lightEmission: number;
  textureIndex: number;
  textureIndices?: number[];
}

export class BlockRegistry {
  private blocks: Map<number, BlockType> = new Map();

  constructor() {
    this.registerDefaults();
  }

  register(block: BlockType): void {
    this.blocks.set(block.id, block);
  }

  get(id: number): BlockType {
    const block = this.blocks.get(id);
    if (!block) {
      throw new Error(`Block with id ${id} not found`);
    }
    return block;
  }

  isTransparent(id: number): boolean {
    if (id === 0) return true;
    const block = this.blocks.get(id);
    return block ? block.transparent : false;
  }

  isSolid(id: number): boolean {
    if (id === 0) return false;
    const block = this.blocks.get(id);
    return block ? block.solid : false;
  }

  getLightEmission(id: number): number {
    const block = this.blocks.get(id);
    return block ? block.lightEmission : 0;
  }

  private registerDefaults(): void {
    this.register({ id: 0, name: "air", transparent: true, solid: false, lightEmission: 0, textureIndex: 0 });
    this.register({ id: 1, name: "stone", transparent: false, solid: true, lightEmission: 0, textureIndex: 0 });
    this.register({ id: 2, name: "dirt", transparent: false, solid: true, lightEmission: 0, textureIndex: 1 });
    this.register({ id: 3, name: "grass_block", transparent: false, solid: true, lightEmission: 0, textureIndex: 2, textureIndices: [2, 3, 3, 3, 3, 3] });
    this.register({ id: 4, name: "cobblestone", transparent: false, solid: true, lightEmission: 0, textureIndex: 4 });
    this.register({ id: 5, name: "planks", transparent: false, solid: true, lightEmission: 0, textureIndex: 5 });
    this.register({ id: 6, name: "sand", transparent: false, solid: true, lightEmission: 0, textureIndex: 6 });
    this.register({ id: 7, name: "water", transparent: true, solid: false, lightEmission: 0, textureIndex: 7 });
    this.register({ id: 8, name: "glass", transparent: true, solid: true, lightEmission: 0, textureIndex: 8 });
    this.register({ id: 9, name: "oak_log", transparent: false, solid: true, lightEmission: 0, textureIndex: 9, textureIndices: [9, 9, 10, 10, 10, 10] });
    this.register({ id: 10, name: "oak_leaves", transparent: true, solid: true, lightEmission: 0, textureIndex: 11 });
    this.register({ id: 11, name: "coal_ore", transparent: false, solid: true, lightEmission: 0, textureIndex: 12 });
    this.register({ id: 12, name: "iron_ore", transparent: false, solid: true, lightEmission: 0, textureIndex: 13 });
    this.register({ id: 13, name: "gold_ore", transparent: false, solid: true, lightEmission: 0, textureIndex: 14 });
    this.register({ id: 14, name: "diamond_ore", transparent: false, solid: true, lightEmission: 0, textureIndex: 15 });
    this.register({ id: 15, name: "bedrock", transparent: false, solid: true, lightEmission: 0, textureIndex: 16 });
    this.register({ id: 16, name: "gravel", transparent: false, solid: true, lightEmission: 0, textureIndex: 17 });
    this.register({ id: 17, name: "torch", transparent: true, solid: false, lightEmission: 14, textureIndex: 18 });
  }
}
