'use client'

import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const STAR_COUNT = 2000
const STAR_SPEED = 2.5

function StarfieldImpl() {
  const pointsRef = useRef<THREE.Points>(null!)
  
  // Generate initial positions
  const positions = useMemo(() => {
    const pos = new Float32Array(STAR_COUNT * 3)
    for (let i = 0; i < STAR_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100 // x
      pos[i * 3 + 1] = (Math.random() - 0.5) * 100 // y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100 // z
    }
    return pos
  }, [])

  useFrame((state, delta) => {
    if (!pointsRef.current) return

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
    
    for (let i = 0; i < STAR_COUNT; i++) {
      let z = positions[i * 3 + 2]
      z += delta * 20 * STAR_SPEED 
      
      // Reset if passed camera
      if (z > 50) {
        z = -50
        positions[i * 3] = (Math.random() - 0.5) * 100
        positions[i * 3 + 1] = (Math.random() - 0.5) * 100
      }
      
      positions[i * 3 + 2] = z
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={STAR_COUNT}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.2}
        color="white"
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  )
}

export default function Starfield() {
  return (
    <div className="w-full h-full bg-black">
      <Canvas camera={{ position: [0, 0, 50], fov: 60 }}>
        <color attach="background" args={['black']} />
        <StarfieldImpl />
      </Canvas>
    </div>
  )
}

