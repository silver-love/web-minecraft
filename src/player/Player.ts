import { InputManager } from './InputManager'
import type { World } from '../world/World'
import type { BlockRegistry } from '../world/BlockType'
import { CHUNK_HEIGHT } from '../world/Chunk'

export class Player {
  position: [number, number, number] = [0, 80, 0]
  velocity: [number, number, number] = [0, 0, 0]
  yaw = 0
  pitch = 0
  onGround = false
  width = 0.6
  height = 1.8
  eyeHeight = 1.62
  flying = false
  sneak = false
  selectedSlot = 0
  private world: World
  private registry: BlockRegistry
  private sensitivity = 0.002
  private gravity = -32
  private jumpSpeed = 8.5
  private walkSpeed = 4.3
  private flySpeed = 10

  constructor(world: World, registry: BlockRegistry) {
    this.world = world
    this.registry = registry
  }

  update(dt: number, input: InputManager): void {
    if (input.isPointerLocked()) {
      const [dx, dy] = input.getMouseDelta()
      this.yaw -= dx * this.sensitivity
      this.pitch += dy * this.sensitivity
      const halfPi = Math.PI / 2
      this.pitch = Math.max(-halfPi + 0.01, Math.min(halfPi - 0.01, this.pitch))
    }

    let forward = 0
    let strafe = 0
    if (input.isKeyDown('KeyW')) forward += 1
    if (input.isKeyDown('KeyS')) forward -= 1
    if (input.isKeyDown('KeyA')) strafe -= 1
    if (input.isKeyDown('KeyD')) strafe += 1

    const moveX = -Math.sin(this.yaw) * forward - Math.cos(this.yaw) * strafe
    const moveZ = Math.cos(this.yaw) * forward - Math.sin(this.yaw) * strafe
    const len = Math.sqrt(moveX * moveX + moveZ * moveZ)
    const ndx = len > 0 ? moveX / len : 0
    const ndz = len > 0 ? moveZ / len : 0

    if (this.flying) {
      this.velocity[0] = ndx * this.flySpeed
      this.velocity[2] = ndz * this.flySpeed
      if (input.isKeyDown('Space')) {
        this.velocity[1] = this.flySpeed
      } else if (input.isKeyDown('ShiftLeft')) {
        this.velocity[1] = -this.flySpeed
      } else {
        this.velocity[1] = 0
      }
    } else {
      this.velocity[0] = ndx * this.walkSpeed
      this.velocity[2] = ndz * this.walkSpeed
      this.velocity[1] += this.gravity * dt
      if (input.isKeyDown('Space') && this.onGround) {
        this.velocity[1] = this.jumpSpeed
      }
    }

    if (input.isKeyJustPressed('KeyF')) {
      this.flying = !this.flying
    }

    this.sneak = input.isKeyDown('ShiftLeft')

    this.position[0] += this.velocity[0] * dt
    if (this.checkCollision(this.position[0], this.position[1], this.position[2])) {
      this.position[0] -= this.velocity[0] * dt
      this.velocity[0] = 0
    }

    this.position[1] += this.velocity[1] * dt
    if (this.checkCollision(this.position[0], this.position[1], this.position[2])) {
      if (this.velocity[1] < 0) {
        this.onGround = true
      }
      this.position[1] -= this.velocity[1] * dt
      this.velocity[1] = 0
    } else {
      this.onGround = false
    }

    this.position[2] += this.velocity[2] * dt
    if (this.checkCollision(this.position[0], this.position[1], this.position[2])) {
      this.position[2] -= this.velocity[2] * dt
      this.velocity[2] = 0
    }

    for (let i = 1; i <= 9; i++) {
      if (input.isKeyJustPressed(`Digit${i}`)) {
        this.selectedSlot = i - 1
      }
    }
  }

  getEyePosition(): [number, number, number] {
    return [this.position[0], this.position[1] + this.eyeHeight, this.position[2]]
  }

  getLookDirection(): [number, number, number] {
    return [
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch),
    ]
  }

  private checkCollision(x: number, y: number, z: number): boolean {
    const halfW = this.width / 2
    const minX = Math.floor(x - halfW)
    const maxX = Math.floor(x + halfW)
    const minY = Math.floor(y)
    const maxY = Math.floor(y + this.height)
    const minZ = Math.floor(z - halfW)
    const maxZ = Math.floor(z + halfW)

    for (let bx = minX; bx <= maxX; bx++) {
      for (let by = minY; by <= maxY; by++) {
        for (let bz = minZ; bz <= maxZ; bz++) {
          if (by < 0 || by >= CHUNK_HEIGHT) continue
          const blockId = this.world.getBlock(bx, by, bz)
          if (this.registry.isSolid(blockId)) {
            if (
              x + halfW > bx && x - halfW < bx + 1 &&
              y + this.height > by && y < by + 1 &&
              z + halfW > bz && z - halfW < bz + 1
            ) {
              return true
            }
          }
        }
      }
    }
    return false
  }
}
