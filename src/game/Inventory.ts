export interface ItemStack {
  id: number
  count: number
}

export class Inventory {
  slots: (ItemStack | null)[] = new Array(36).fill(null)
  selectedSlot: number = 0

  getSelectedItem(): ItemStack | null {
    return this.slots[this.selectedSlot]
  }

  addItem(id: number, count: number): number {
    let remaining = count

    for (let i = 0; i < this.slots.length && remaining > 0; i++) {
      const slot = this.slots[i]
      if (slot && slot.id === id && slot.count < this.getMaxStack(id)) {
        const canAdd = this.getMaxStack(id) - slot.count
        const toAdd = Math.min(remaining, canAdd)
        slot.count += toAdd
        remaining -= toAdd
      }
    }

    for (let i = 0; i < this.slots.length && remaining > 0; i++) {
      if (!this.slots[i]) {
        const toAdd = Math.min(remaining, this.getMaxStack(id))
        this.slots[i] = { id, count: toAdd }
        remaining -= toAdd
      }
    }

    return remaining
  }

  removeItem(slot: number, count: number): boolean {
    const item = this.slots[slot]
    if (!item || item.count < count) return false
    item.count -= count
    if (item.count === 0) {
      this.slots[slot] = null
    }
    return true
  }

  swapSlots(a: number, b: number): void {
    const temp = this.slots[a]
    this.slots[a] = this.slots[b]
    this.slots[b] = temp
  }

  canStack(id: number): number {
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i]
      if (slot && slot.id === id && slot.count < this.getMaxStack(id)) {
        return i
      }
    }
    return -1
  }

  getMaxStack(_id: number): number {
    return 64
  }

  clear(): void {
    for (let i = 0; i < this.slots.length; i++) {
      this.slots[i] = null
    }
  }

  serialize(): string {
    return JSON.stringify({
      slots: this.slots,
      selectedSlot: this.selectedSlot,
    })
  }

  deserialize(data: string): void {
    const parsed = JSON.parse(data)
    this.slots = parsed.slots
    this.selectedSlot = parsed.selectedSlot
  }
}
