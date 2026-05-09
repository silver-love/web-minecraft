import type { World } from '../world/World';
import type { BlockRegistry } from '../world/BlockType';
import type { ChunkRenderer } from '../renderer/ChunkRenderer';
import type { Inventory } from './Inventory';
import type { Player } from '../player/Player';
import { SECTION_HEIGHT } from '../world/Chunk';

export interface RaycastHit {
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
  blockId: number;
}

export class BlockInteraction {
  private world: World;
  private registry: BlockRegistry;
  private chunkRenderer: ChunkRenderer;
  private inventory: Inventory;
  private breakCooldown = 0;
  private placeCooldown = 0;
  private reach = 5;
  private lastHit: RaycastHit | null = null;

  constructor(world: World, registry: BlockRegistry, chunkRenderer: ChunkRenderer, inventory: Inventory) {
    this.world = world;
    this.registry = registry;
    this.chunkRenderer = chunkRenderer;
    this.inventory = inventory;
  }

  raycast(origin: [number, number, number], direction: [number, number, number]): RaycastHit | null {
    const len = Math.sqrt(direction[0] * direction[0] + direction[1] * direction[1] + direction[2] * direction[2]);
    if (len === 0) return null;
    const dx = direction[0] / len;
    const dy = direction[1] / len;
    const dz = direction[2] / len;

    let ix = Math.floor(origin[0]);
    let iy = Math.floor(origin[1]);
    let iz = Math.floor(origin[2]);

    const stepX = dx >= 0 ? 1 : -1;
    const stepY = dy >= 0 ? 1 : -1;
    const stepZ = dz >= 0 ? 1 : -1;

    const tDeltaX = dx !== 0 ? Math.abs(1 / dx) : Infinity;
    const tDeltaY = dy !== 0 ? Math.abs(1 / dy) : Infinity;
    const tDeltaZ = dz !== 0 ? Math.abs(1 / dz) : Infinity;

    let tMaxX = dx !== 0
      ? (dx > 0 ? (ix + 1 - origin[0]) / dx : (ix - origin[0]) / dx)
      : Infinity;
    let tMaxY = dy !== 0
      ? (dy > 0 ? (iy + 1 - origin[1]) / dy : (iy - origin[1]) / dy)
      : Infinity;
    let tMaxZ = dz !== 0
      ? (dz > 0 ? (iz + 1 - origin[2]) / dz : (iz - origin[2]) / dz)
      : Infinity;

    let nx = 0;
    let ny = 0;
    let nz = 0;

    for (let i = 0; i < 100; i++) {
      const blockId = this.world.getBlock(ix, iy, iz);
      if (blockId !== 0 && this.registry.isSolid(blockId)) {
        return { x: ix, y: iy, z: iz, nx, ny, nz, blockId };
      }

      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) {
          if (tMaxX > this.reach) return null;
          ix += stepX;
          tMaxX += tDeltaX;
          nx = -stepX;
          ny = 0;
          nz = 0;
        } else {
          if (tMaxZ > this.reach) return null;
          iz += stepZ;
          tMaxZ += tDeltaZ;
          nx = 0;
          ny = 0;
          nz = -stepZ;
        }
      } else {
        if (tMaxY < tMaxZ) {
          if (tMaxY > this.reach) return null;
          iy += stepY;
          tMaxY += tDeltaY;
          nx = 0;
          ny = -stepY;
          nz = 0;
        } else {
          if (tMaxZ > this.reach) return null;
          iz += stepZ;
          tMaxZ += tDeltaZ;
          nx = 0;
          ny = 0;
          nz = -stepZ;
        }
      }
    }

    return null;
  }

  update(dt: number, player: Player, leftClick: boolean, rightClick: boolean): void {
    if (this.breakCooldown > 0) this.breakCooldown -= dt;
    if (this.placeCooldown > 0) this.placeCooldown -= dt;

    const eye = player.getEyePosition();
    const dir = player.getLookDirection();
    this.lastHit = this.raycast(eye, dir);

    if (leftClick && this.breakCooldown <= 0 && this.lastHit) {
      this.world.setBlock(this.lastHit.x, this.lastHit.y, this.lastHit.z, 0);
      this.rebuildSectionsAt(this.lastHit.x, this.lastHit.y, this.lastHit.z);
      this.breakCooldown = 0.25;
    }

    if (rightClick && this.placeCooldown <= 0 && this.lastHit) {
      const px = this.lastHit.x + this.lastHit.nx;
      const py = this.lastHit.y + this.lastHit.ny;
      const pz = this.lastHit.z + this.lastHit.nz;

      if (this.world.getBlock(px, py, pz) !== 0) return;

      const halfW = player.width / 2;
      if (
        player.position[0] - halfW < px + 1 && player.position[0] + halfW > px &&
        player.position[1] < py + 1 && player.position[1] + player.height > py &&
        player.position[2] - halfW < pz + 1 && player.position[2] + halfW > pz
      ) {
        return;
      }

      const selectedItem = this.inventory.getSelectedItem();
      if (selectedItem && selectedItem.id > 0) {
        this.world.setBlock(px, py, pz, selectedItem.id);
        this.rebuildSectionsAt(px, py, pz);
        this.placeCooldown = 0.25;
      }
    }
  }

  getLastHit(): RaycastHit | null {
    return this.lastHit;
  }

  private rebuildSectionsAt(wx: number, wy: number, wz: number): void {
    const [cx, cz] = this.world.worldToChunk(wx, wz);
    const sectionY = Math.floor(wy / SECTION_HEIGHT);
    this.chunkRenderer.buildSection(cx, sectionY, cz);

    const localY = ((wy % SECTION_HEIGHT) + SECTION_HEIGHT) % SECTION_HEIGHT;
    const localX = ((wx % 16) + 16) % 16;
    const localZ = ((wz % 16) + 16) % 16;

    if (localY === 0 && sectionY > 0) {
      this.chunkRenderer.buildSection(cx, sectionY - 1, cz);
    }
    if (localY === SECTION_HEIGHT - 1 && sectionY < 15) {
      this.chunkRenderer.buildSection(cx, sectionY + 1, cz);
    }
    if (localX === 0) {
      this.chunkRenderer.buildSection(cx - 1, sectionY, cz);
    }
    if (localX === 15) {
      this.chunkRenderer.buildSection(cx + 1, sectionY, cz);
    }
    if (localZ === 0) {
      this.chunkRenderer.buildSection(cx, sectionY, cz - 1);
    }
    if (localZ === 15) {
      this.chunkRenderer.buildSection(cx, sectionY, cz + 1);
    }
  }
}
