import type { Particle, ParticleConfig, GridParticle } from "./particle-types"

export class ParticleEngine {
  particles: Particle[] = []
  gridParticles: GridParticle[] = []
  config: ParticleConfig
  emissionCounter = 0
  private lastFrameTime = 0
  private fps = 0
  private time = 0
  private useGridMode = false
  private gradientLUT: string[] = [] // Pre-computed gradient lookup table with HSLA
  private solidColorCache = "" // Cached solid color HSLA

  constructor(
    private ctx: CanvasRenderingContext2D,
    private canvas: HTMLCanvasElement,
  ) {
    this.config = {
      size: 2,
      gridDensity: 15,
      waveAmplitude: 0.25,
      waveFrequency: 0.05,
      waveSpeed: 1.2,
      waveCount: 3,
      waveDirection: 0,
      cameraRoll: 0,
      cameraPitch: 0,
      cameraAltitude: 0,
      colorMode: "solid",
      particleColor: "#82ccdd",
      peakColor: "#00ffff",
      troughColor: "#ff00ff",
      backgroundColor: "#0a3d62",
      backgroundGradient: "#3c6382",
    }
    this.initializeGrid()
    this.buildGradientLUT()
  }

  private buildGradientLUT() {
    // Pre-compute 256 gradient colors with HSLA conversion done once
    this.gradientLUT = []
    const steps = 256
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1)
      const hexColor = this.interpolateColors(this.config.troughColor, this.config.peakColor, t)
      this.gradientLUT.push(this.hexToHsla(hexColor, 0.8))
    }
    
    // Also cache solid color
    this.solidColorCache = this.hexToHsla(this.config.particleColor, 0.8)
  }

  private initializeGrid() {
    this.gridParticles = []
    const density = Math.max(3, this.config.gridDensity)
    const cellWidth = this.canvas.width / density
    const cellHeight = this.canvas.height / density

    for (let y = 0; y < density; y++) {
      for (let x = 0; x < density; x++) {
        const baseX = x * cellWidth + cellWidth / 2
        const baseY = y * cellHeight + cellHeight / 2
        const baseZ = 0 // Start at Z=0 plane
        
        this.gridParticles.push({
          baseX,
          baseY,
          baseZ,
          x: baseX,
          y: baseY,
          z: baseZ,
          size: this.config.size,
        })
      }
    }
    this.useGridMode = true
  }

  private project3DTo2D(x: number, y: number, z: number): { x: number; y: number; depth: number } {
    // Convert camera angles to radians
    const rollRad = (this.config.cameraRoll * Math.PI) / 180
    const pitchRad = (this.config.cameraPitch * Math.PI) / 180

    // Center coordinates around canvas center for rotation
    const cx = this.canvas.width / 2
    const cy = this.canvas.height / 2
    const relX = x - cx
    const relY = y - cy
    const relZ = z

    // Apply pitch rotation (rotation around X-axis)
    const cosP = Math.cos(pitchRad)
    const sinP = Math.sin(pitchRad)
    const y1 = relY * cosP - relZ * sinP
    const z1 = relY * sinP + relZ * cosP

    // Apply roll rotation (rotation around Z-axis)
    const cosR = Math.cos(rollRad)
    const sinR = Math.sin(rollRad)
    const x2 = relX * cosR - y1 * sinR
    const y2 = relX * sinR + y1 * cosR
    const z2 = z1

    // Perspective projection
    const perspective = 1000
    const scale = perspective / (perspective + z2)
    
    // Apply camera altitude as viewport offset (after 3D projection)
    // Negative altitude moves camera down, so plane appears to move up
    return {
      x: x2 * scale + cx,
      y: y2 * scale + cy - this.config.cameraAltitude,
      depth: z2 // For depth sorting if needed
    }
  }

  private updateGridParticles() {
    this.time += this.config.waveSpeed * 0.01

    // Convert wave direction to radians
    const directionRad = (this.config.waveDirection * Math.PI) / 180
    const dirX = Math.cos(directionRad)
    const dirY = Math.sin(directionRad)

    for (const p of this.gridParticles) {
      // Calculate wave offset in the Z direction (amplitude moves particles up/down in 3D space)
      let offsetZ = 0

      // Combine multiple sine waves for natural motion
      for (let i = 0; i < this.config.waveCount; i++) {
        const waveLength = (this.canvas.width / (this.config.waveCount - i)) * 0.5
        
        // Calculate position along wave direction
        const posAlongWave = (p.baseX * dirX + p.baseY * dirY) / waveLength
        
        offsetZ +=
          Math.sin((posAlongWave + this.time) * Math.PI * 2) * 
          this.config.waveAmplitude * 
          (1 - i * 0.2)
      }

      // Update 3D position - wave moves particles in Z direction
      p.x = p.baseX
      p.y = p.baseY
      p.z = p.baseZ + offsetZ * 100 // Scale amplitude for visibility in 3D
    }
  }

  update() {
    if (this.useGridMode) {
      this.updateGridParticles()
    }
  }

  private interpolateColors(color1: string, color2: string, t: number): string {
    // Parse hex colors to RGB
    const c1 = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color1)
    const c2 = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color2)
    
    if (!c1 || !c2) return color1

    const r1 = Number.parseInt(c1[1], 16)
    const g1 = Number.parseInt(c1[2], 16)
    const b1 = Number.parseInt(c1[3], 16)

    const r2 = Number.parseInt(c2[1], 16)
    const g2 = Number.parseInt(c2[2], 16)
    const b2 = Number.parseInt(c2[3], 16)

    // Interpolate
    const r = Math.round(r1 + (r2 - r1) * t)
    const g = Math.round(g1 + (g2 - g1) * t)
    const b = Math.round(b1 + (b2 - b1) * t)

    // Convert back to hex
    const toHex = (n: number) => {
      const hex = n.toString(16)
      return hex.length === 1 ? "0" + hex : hex
    }

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }

  private hexToHsla(hex: string, alpha = 1) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return `hsla(0, 100%, 50%, ${alpha})`

    const r = Number.parseInt(result[1], 16) / 255
    const g = Number.parseInt(result[2], 16) / 255
    const b = Number.parseInt(result[3], 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0,
      s = 0
    const l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6
          break
        case g:
          h = ((b - r) / d + 2) / 6
          break
        case b:
          h = ((r - g) / d + 4) / 6
          break
      }
    }

    return `hsla(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%, ${alpha})`
  }

  draw() {
    if (this.useGridMode) {
      // Clear canvas with transparency instead of drawing background
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

      // Draw grid particles with 3D projection
      const particleSize = this.config.size
      const maxAmplitude = this.config.waveAmplitude * 100 // Match the scale in updateGridParticles

      // Project all particles and sort by depth (back to front)
      const projectedParticles = this.gridParticles.map(p => {
        const projected = this.project3DTo2D(p.x, p.y, p.z)
        return { ...p, projected }
      }).sort((a, b) => a.projected.depth - b.projected.depth)

      if (this.config.colorMode === "gradient" && maxAmplitude > 0) {
        // Gradient mode - use Z displacement for color
        for (const item of projectedParticles) {
          const p = item
          const displacement = p.z - p.baseZ
          const normalizedPosition = displacement / maxAmplitude
          const t = Math.max(0, Math.min(1, (normalizedPosition + 1) / 2))
          const index = Math.floor(t * (this.gradientLUT.length - 1))
          const color = this.gradientLUT[index]

          this.ctx.fillStyle = color
          this.ctx.beginPath()
          this.ctx.arc(p.projected.x, p.projected.y, particleSize, 0, Math.PI * 2)
          this.ctx.fill()
        }
      } else {
        // Solid color mode - use cached color
        this.ctx.fillStyle = this.solidColorCache

        for (const item of projectedParticles) {
          const p = item.projected
          this.ctx.beginPath()
          this.ctx.arc(p.x, p.y, particleSize, 0, Math.PI * 2)
          this.ctx.fill()
        }
      }
    }
  }

  setGridMode(enabled: boolean) {
    if (enabled && !this.useGridMode) {
      this.useGridMode = true
      this.initializeGrid()
    } else if (!enabled && this.useGridMode) {
      this.useGridMode = false
      this.particles = []
    }
  }

  updateConfig(newConfig: ParticleConfig) {
    const oldGridDensity = this.config.gridDensity
    const oldPeakColor = this.config.peakColor
    const oldTroughColor = this.config.troughColor
    const oldParticleColor = this.config.particleColor
    const oldColorMode = this.config.colorMode
    
    this.config = newConfig
    
    // Reinitialize grid if density changed and we're in grid mode
    if (this.useGridMode && oldGridDensity !== newConfig.gridDensity) {
      this.initializeGrid()
    }
    
    // Rebuild gradient LUT and color cache if any color changed
    if (oldPeakColor !== newConfig.peakColor || 
        oldTroughColor !== newConfig.troughColor || 
        oldParticleColor !== newConfig.particleColor ||
        oldColorMode !== newConfig.colorMode) {
      this.buildGradientLUT()
    }
  }
}

