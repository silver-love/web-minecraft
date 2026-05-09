export class AudioManager {
  private audioContext: AudioContext | null = null
  private sounds: Map<string, AudioBuffer> = new Map()
  private currentMusicSource: AudioBufferSourceNode | null = null
  private masterGain: GainNode | null = null
  private musicGain: GainNode | null = null
  private sfxGain: GainNode | null = null
  masterVolume: number = 0.8
  musicVolume: number = 0.5
  sfxVolume: number = 0.8

  constructor() {
    try {
      this.audioContext = new AudioContext()
      this.masterGain = this.audioContext.createGain()
      this.masterGain.connect(this.audioContext.destination)
      this.musicGain = this.audioContext.createGain()
      this.musicGain.connect(this.masterGain)
      this.sfxGain = this.audioContext.createGain()
      this.sfxGain.connect(this.masterGain)
      this.updateVolumes()
    } catch {
      this.audioContext = null
    }
  }

  private updateVolumes(): void {
    if (this.masterGain) this.masterGain.gain.value = this.masterVolume
    if (this.musicGain) this.musicGain.gain.value = this.musicVolume
    if (this.sfxGain) this.sfxGain.gain.value = this.sfxVolume
  }

  async loadSound(name: string, url: string): Promise<void> {
    if (!this.audioContext) return
    try {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
      this.sounds.set(name, audioBuffer)
    } catch {
      return
    }
  }

  playSound(name: string, position?: [number, number, number]): void {
    if (!this.audioContext || !this.sfxGain) return
    const buffer = this.sounds.get(name)
    if (!buffer) return

    const source = this.audioContext.createBufferSource()
    source.buffer = buffer

    if (position) {
      const panner = this.audioContext.createPanner()
      panner.positionX.value = position[0]
      panner.positionY.value = position[1]
      panner.positionZ.value = position[2]
      panner.refDistance = 1
      panner.maxDistance = 64
      panner.rolloffFactor = 1
      panner.connect(this.sfxGain)
      source.connect(panner)
    } else {
      source.connect(this.sfxGain)
    }

    source.start(0)
  }

  playMusic(name: string): void {
    if (!this.audioContext || !this.musicGain) return
    const buffer = this.sounds.get(name)
    if (!buffer) return

    this.stopMusic()

    const source = this.audioContext.createBufferSource()
    source.buffer = buffer
    source.loop = true
    source.connect(this.musicGain)

    this.musicGain.gain.setValueAtTime(0, this.audioContext.currentTime)
    this.musicGain.gain.linearRampToValueAtTime(
      this.musicVolume,
      this.audioContext.currentTime + 2
    )

    source.start(0)
    this.currentMusicSource = source
  }

  stopMusic(): void {
    if (!this.audioContext || !this.musicGain) return

    if (this.currentMusicSource) {
      this.musicGain.gain.linearRampToValueAtTime(
        0,
        this.audioContext.currentTime + 1
      )
      const source = this.currentMusicSource
      this.currentMusicSource = null
      setTimeout(() => {
        try {
          source.stop()
        } catch {
          return
        }
      }, 1100)
    }
  }

  setListenerPosition(
    pos: [number, number, number],
    forward: [number, number, number]
  ): void {
    if (!this.audioContext) return
    const listener = this.audioContext.listener
    if (listener.positionX) {
      listener.positionX.value = pos[0]
      listener.positionY.value = pos[1]
      listener.positionZ.value = pos[2]
    } else {
      listener.setPosition(pos[0], pos[1], pos[2])
    }
    if (listener.forwardX) {
      listener.forwardX.value = forward[0]
      listener.forwardY.value = forward[1]
      listener.forwardZ.value = forward[2]
      listener.upX.value = 0
      listener.upY.value = 1
      listener.upZ.value = 0
    } else {
      listener.setOrientation(forward[0], forward[1], forward[2], 0, 1, 0)
    }
  }
}
