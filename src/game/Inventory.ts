export interface ItemStack {
  id: number;
  count: number;
}

export class Inventory {
  slots: (ItemStack | null)[] = Array(36).fill(null);
  selectedSlot = 0;

  addItem(id: number, count: number): boolean {
    let remaining = count;

    for (let i = 0; i < this.slots.length && remaining > 0; i++) {
      const slot = this.slots[i];
      if (slot !== null && slot.id === id && slot.count < 64) {
        const canAdd = Math.min(remaining, 64 - slot.count);
        slot.count += canAdd;
        remaining -= canAdd;
      }
    }

    for (let i = 0; i < this.slots.length && remaining > 0; i++) {
      if (this.slots[i] === null) {
        const canAdd = Math.min(remaining, 64);
        this.slots[i] = { id, count: canAdd };
        remaining -= canAdd;
      }
    }

    return remaining === 0;
  }

  removeItem(id: number, count: number): boolean {
    let available = 0;
    for (const slot of this.slots) {
      if (slot !== null && slot.id === id) {
        available += slot.count;
      }
    }

    if (available < count) {
      return false;
    }

    let remaining = count;
    for (let i = 0; i < this.slots.length && remaining > 0; i++) {
      const slot = this.slots[i];
      if (slot !== null && slot.id === id) {
        if (slot.count <= remaining) {
          remaining -= slot.count;
          this.slots[i] = null;
        } else {
          slot.count -= remaining;
          remaining = 0;
        }
      }
    }

    return true;
  }

  getSelectedItem(): ItemStack | null {
    return this.slots[this.selectedSlot];
  }

  setSelectedSlot(slot: number): void {
    this.selectedSlot = Math.max(0, Math.min(35, slot));
  }

  serialize(): string {
    return JSON.stringify(this.slots);
  }

  deserialize(data: string): void {
    const parsed = JSON.parse(data) as (ItemStack | null)[];
    this.slots = parsed;
  }
}
