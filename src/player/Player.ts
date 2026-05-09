import type { InputManager } from './InputManager'
import type { World } from '../world/World'
import type { BlockRegistry } from '../world/BlockRegistry'

export class Player {
  position: [number, number, number] = [0, 30, 0]
  velocity: [number, number, number] = [0, 0, 0]
  yaw = 0
  pitch = 0
  onGround = false
  flying = false
  selectedSlot = 0
  width = 0.6
  height = 1.8
  eyeHeight = 1.62
  walkSpeed = 4.317
  sprintSpeed = 5.612
  flySpeed = 10
  jumpVelocity = 8.0
  gravity = -24.0
  sneakEnabled = false

  private lastSpaceTime = 0

  update(dt: number, input: InputManager, world: World, registry: BlockRegistry): void {
    if (input.isPointerLocked()) {
      const [mdx, mdy] = input.getMouseDelta()
      this.yaw += mdx * 0.002
      this.pitch -= mdy * 0.002
      this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch))
    }

    const forward = Math.sin(this.yaw)
    const right = Math.cos(this.yaw)

    let moveX = 0
    let moveZ = 0
    if (input.isKeyDown('KeyW')) { moveX += forward; moveZ += right }
    if (input.isKeyDown('KeyS')) { moveX -= forward; moveZ -= right }
    if (input.isKeyDown('KeyA')) { moveX -= right; moveZ += forward }
    if (input.isKeyDown('KeyD')) { moveX += right; moveZ -= forward }

    const moveLen = Math.sqrt(moveX * moveX + moveZ * moveZ)
    if (moveLen > 0) {
      moveX /= moveLen
      moveZ /= moveLen
    }

    this.sneakEnabled = input.isKeyDown('ShiftLeft')
    const speed = this.flying ? this.flySpeed : (this.sneakEnabled ? this.walkSpeed * 0.3 : this.walkSpeed)

    if (this.flying) {
      this.velocity[0] = moveX * speed
      this.velocity[2] = moveZ * speed
      this.velocity[1] = 0
      if (input.isKeyDown('Space')) this.velocity[1] = speed
      if (input.isKeyDown('ShiftLeft')) this.velocity[1] = -speed
    } else {
      this.velocity[0] = moveX * speed
      this.velocity[2] = moveZ * speed
      this.velocity[1] += this.gravity * dt

      if (input.isKeyJustPressed('Space')) {
        const now = performance.now()
        if (now - this.lastSpaceTime < 300) {
          this.flying = true
          this.velocity[1] = 0
        }
        this.lastSpaceTime = now
      }

      if (input.isKeyDown('Space') && this.onGround && !this.flying) {
        this.velocity[1] = this.jumpVelocity
        this.onGround = false
      }
    }

    this.moveWithCollision(dt, world, registry)

    const scrollDelta = input.getScrollDelta()
    if (scrollDelta > 0) this.selectedSlot = (this.selectedSlot + 1) % 9
    else if (scrollDelta < 0) this.selectedSlot = (this.selectedSlot + 8) % 9

    for (let i = 1; i <= 9; i++) {
      if (input.isKeyJustPressed(`Digit${i}`)) {
        this.selectedSlot = i - 1
      }
    }
  }

  getEyePosition(): [number, number, number] {
    return [this.position[0], this.position[1] + this.eyeHeight, this.position[2]]
  }

  getAABB(): { minX: number; minY: number; minZ: number; maxX: number; maxY: number; maxZ: number } {
    const hw = this.width / 2
    return {
      minX: this.position[0] - hw,
      minY: this.position[1],
      minZ: this.position[2] - hw,
      maxX: this.position[0] + hw,
      maxY: this.position[1] + this.height,
      maxZ: this.position[2] + hw,
    }
  }

  private moveWithCollision(dt: number, world: World, registry: BlockRegistry): void {
    this.position[1] += this.velocity[1] * dt
    this.resolveCollisionY(world, registry)

    this.position[0] += this.velocity[0] * dt
    this.resolveCollisionX(world, registry)

    this.position[2] += this.velocity[2] * dt
    this.resolveCollisionZ(world, registry)

    if (this.sneakEnabled && this.onGround && !this.flying) {
      this.preventEdgeFall(world, registry)
    }
  }

  private resolveCollisionY(world: World, registry: BlockRegistry): void {
    const aabb = this.getAABB()
    const minX = Math.floor(aabb.minX)
    const maxX = Math.floor(aabb.maxX)
    const minZ = Math.floor(aabb.minZ)
    const maxZ = Math.floor(aabb.maxZ)

    if (this.velocity[1] < 0) {
      const y = Math.floor(aabb.minY)
      for (let bx = minX; bx <= maxX; bx++) {
        for (let bz = minZ; bz <= maxZ; bz++) {
          if (registry.isSolid(world.getBlock(bx, y, bz))) {
            this.position[1] = y + 1
            this.velocity[1] = 0
            this.onGround = true
            return
          }
        }
      }
      this.onGround = false
    } else if (this.velocity[1] > 0) {
      const y = Math.floor(aabb.maxY)
      for (let bx = minX; bx <= maxX; bx++) {
        for (let bz = minZ; bz <= maxZ; bz++) {
          if (registry.isSolid(world.getBlock(bx, y, bz))) {
            this.position[1] = y - this.height
            this.velocity[1] = 0
            return
          }
        }
      }
    }
  }

  private resolveCollisionX(world: World, registry: BlockRegistry): void {
    const aabb = this.getAABB()
    const minY = Math.floor(aabb.minY)
    const maxY = Math.floor(aabb.maxY)
    const minZ = Math.floor(aabb.minZ)
    const maxZ = Math.floor(aabb.maxZ)

    if (this.velocity[0] > 0) {
      const x = Math.floor(aabb.maxX)
      for (let by = minY; by <= maxY; by++) {
        for (let bz = minZ; bz <= maxZ; bz++) {
          if (registry.isSolid(world.getBlock(x, by, bz))) {
            this.position[0] = x - this.width / 2
            this.velocity[0] = 0
            return
          }
        }
      }
    } else if (this.velocity[0] < 0) {
      const x = Math.floor(aabb.minX)
      for (let by = minY; by <= maxY; by++) {
        for (let bz = minZ; bz <= maxZ; bz++) {
          if (registry.isSolid(world.getBlock(x, by, bz))) {
            this.position[0] = x + 1 + this.width / 2
            this.velocity[0] = 0
            return
          }
        }
      }
    }
  }

  private resolveCollisionZ(world: World, registry: BlockRegistry): void {
    const aabb = this.getAABB()
    const minX = Math.floor(aabb.minX)
    const maxX = Math.floor(aabb.maxX)
    const minY = Math.floor(aabb.minY)
    const maxY = Math.floor(aabb.maxY)

    if (this.velocity[2] > 0) {
      const z = Math.floor(aabb.maxZ)
      for (let bx = minX; bx <= maxX; bx++) {
        for (let by = minY; by <= maxY; by++) {
          if (registry.isSolid(world.getBlock(bx, by, z))) {
            this.position[2] = z - this.width / 2
            this.velocity[2] = 0
            return
          }
        }
      }
    } else if (this.velocity[2] < 0) {
      const z = Math.floor(aabb.minZ)
      for (let bx = minX; bx <= maxX; bx++) {
        for (let by = minY; by <= maxY; by++) {
          if (registry.isSolid(world.getBlock(bx, by, z))) {
            this.position[2] = z + 1 + this.width / 2
            this.velocity[2] = 0
            return
          }
        }
      }
    }
  }

  private preventEdgeFall(world: World, registry: BlockRegistry): void {
    const aabb = this.getAABB()
    const y = Math.floor(aabb.minY) - 1
    const hw = this.width / 2 + 0.01

    const checkPoints: [number, number][] = [
      [this.position[0] - hw, this.position[2] - hw],
      [this.position[0] + hw, this.position[2] - hw],
      [this.position[0] - hw, this.position[2] + hw],
      [this.position[0] + hw, this.position[2] + hw],
    ]

    let supported = false
    for (const [px, pz] of checkPoints) {
      if (registry.isSolid(world.getBlock(Math.floor(px), y, Math.floor(pz)))) {
        supported = true
        break
      }
    }

    if (!supported) {
      this.position[0] -= this.velocity[0] * 0.016
      this.position[2] -= this.velocity[2] * 0.016
      this.velocity[0] = 0
      this.velocity[2] = 0
    }
  }
}
