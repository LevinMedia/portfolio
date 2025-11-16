export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  trail: Array<{ x: number; y: number }>
  hue: number
}

export interface GridParticle {
  baseX: number
  baseY: number
  baseZ: number
  x: number
  y: number
  z: number
  size: number
}

export interface ParticleConfig {
  size: number
  gridDensity: number
  waveAmplitude: number
  waveFrequency: number
  waveSpeed: number
  waveCount: number
  waveDirection: number // angle in degrees for wave propagation direction in 3D space
  cameraRoll: number // camera rotation around Z-axis (degrees)
  cameraPitch: number // camera rotation around X-axis (degrees)
  cameraAltitude: number // camera distance from the plane (Z-axis offset)
  colorMode: "solid" | "gradient"
  particleColor: string
  peakColor: string // color at wave peak
  troughColor: string // color at wave trough
  backgroundColor: string
  backgroundGradient: string // color2 for gradient
}

