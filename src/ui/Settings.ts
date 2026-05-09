const STORAGE_KEY = 'minecraft-clone-settings'

const DEFAULT_KEY_BINDINGS: Record<string, string> = {
  forward: 'KeyW',
  back: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
  jump: 'Space',
  sneak: 'ShiftLeft',
  inventory: 'KeyE',
}

const DEFAULTS = {
  renderDistance: 8,
  fov: 70,
  masterVolume: 0.8,
  musicVolume: 0.5,
  sfxVolume: 0.8,
  mouseSensitivity: 0.002,
  keyBindings: { ...DEFAULT_KEY_BINDINGS },
}

export class Settings {
  renderDistance: number = DEFAULTS.renderDistance
  fov: number = DEFAULTS.fov
  masterVolume: number = DEFAULTS.masterVolume
  musicVolume: number = DEFAULTS.musicVolume
  sfxVolume: number = DEFAULTS.sfxVolume
  mouseSensitivity: number = DEFAULTS.mouseSensitivity
  keyBindings: Record<string, string> = { ...DEFAULTS.keyBindings }

  load(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) return
      const parsed = JSON.parse(data)
      if (parsed.renderDistance !== undefined) this.renderDistance = parsed.renderDistance
      if (parsed.fov !== undefined) this.fov = parsed.fov
      if (parsed.masterVolume !== undefined) this.masterVolume = parsed.masterVolume
      if (parsed.musicVolume !== undefined) this.musicVolume = parsed.musicVolume
      if (parsed.sfxVolume !== undefined) this.sfxVolume = parsed.sfxVolume
      if (parsed.mouseSensitivity !== undefined) this.mouseSensitivity = parsed.mouseSensitivity
      if (parsed.keyBindings) this.keyBindings = parsed.keyBindings
    } catch {
      return
    }
  }

  save(): void {
    try {
      const data = JSON.stringify({
        renderDistance: this.renderDistance,
        fov: this.fov,
        masterVolume: this.masterVolume,
        musicVolume: this.musicVolume,
        sfxVolume: this.sfxVolume,
        mouseSensitivity: this.mouseSensitivity,
        keyBindings: this.keyBindings,
      })
      localStorage.setItem(STORAGE_KEY, data)
    } catch {
      return
    }
  }

  reset(): void {
    this.renderDistance = DEFAULTS.renderDistance
    this.fov = DEFAULTS.fov
    this.masterVolume = DEFAULTS.masterVolume
    this.musicVolume = DEFAULTS.musicVolume
    this.sfxVolume = DEFAULTS.sfxVolume
    this.mouseSensitivity = DEFAULTS.mouseSensitivity
    this.keyBindings = { ...DEFAULTS.keyBindings }
  }
}
