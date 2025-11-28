'use client'

import React, { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as THREE from 'three'

const GRID_SIZE = 20
const PIPE_RADIUS = 0.4
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SEGMENT_LENGTH = 2
const MAX_PIPES = 3
const SPEED = 0.1 // Time between updates

type Direction = [number, number, number]
const DIRECTIONS: Direction[] = [
  [1, 0, 0], [-1, 0, 0],
  [0, 1, 0], [0, -1, 0],
  [0, 0, 1], [0, 0, -1]
]

// Vibrant, classic Windows 3D Pipes palette
const ALL_COLORS = [
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#00FFFF', // Cyan
  '#FF00FF', // Magenta
  '#FFFFFF', // White
  '#FF8000', // Orange
  '#8000FF', // Purple
]

interface PipeSegment {
  position: [number, number, number]
  direction: Direction
  length: number
  color: string
  type: 'straight' | 'joint'
  key: string
}

interface ActivePipe {
  id: number
  position: [number, number, number]
  direction: Direction
  color: string
  lastUpdate: number
}

interface PipesImplProps {
  onReset: () => void
}

function PipesImpl({ onReset }: PipesImplProps) {
  const [segments, setSegments] = useState<PipeSegment[]>([])
  const activePipesRef = useRef<ActivePipe[]>([])
  const gridRef = useRef<Set<string>>(new Set())
  
  // Select a limited palette for this run
  const sessionColors = useMemo(() => {
    const shuffled = [...ALL_COLORS].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, Math.floor(Math.random() * 2) + 2) // 2 to 3 colors
  }, [])

  // Initialize pipes
  useEffect(() => {
    const initialPipes: ActivePipe[] = []
    for (let i = 0; i < MAX_PIPES; i++) {
      initialPipes.push({
        id: i,
        position: [
          Math.floor(Math.random() * GRID_SIZE) - GRID_SIZE / 2,
          Math.floor(Math.random() * GRID_SIZE) - GRID_SIZE / 2,
          Math.floor(Math.random() * GRID_SIZE) - GRID_SIZE / 2
        ],
        direction: DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)],
        color: sessionColors[i % sessionColors.length], // Cycle through session colors
        lastUpdate: 0
      })
    }
    activePipesRef.current = initialPipes
    
    // Add initial joint spheres
    const initialSegments: PipeSegment[] = initialPipes.map(p => ({
      position: p.position,
      direction: p.direction,
      length: 0,
      color: p.color,
      type: 'joint',
      key: `${p.id}-start`
    }))
    setSegments(initialSegments)
    initialPipes.forEach(p => gridRef.current.add(p.position.join(',')))
  }, [sessionColors])

  useFrame((state) => {
    const time = state.clock.elapsedTime
    let needsUpdate = false
    const newSegments: PipeSegment[] = []

    activePipesRef.current.forEach((pipe) => {
      if (time - pipe.lastUpdate > SPEED) {
        needsUpdate = true
        pipe.lastUpdate = time

        // Calculate next potential position
        const nextPos: [number, number, number] = [
          pipe.position[0] + pipe.direction[0],
          pipe.position[1] + pipe.direction[1],
          pipe.position[2] + pipe.direction[2]
        ]

        // Helper to check if a position is valid
        const isValid = (pos: [number, number, number]) => {
          const inBounds = Math.abs(pos[0]) <= GRID_SIZE / 2 && 
                           Math.abs(pos[1]) <= GRID_SIZE / 2 && 
                           Math.abs(pos[2]) <= GRID_SIZE / 2
          const collision = gridRef.current.has(pos.join(','))
          return inBounds && !collision
        }

        let targetPos = nextPos
        let targetDir = pipe.direction
        let turned = false

        // If blocked, try to turn
        if (!isValid(targetPos)) {
          // Find valid orthogonal directions
          const axis = pipe.direction.findIndex(v => v !== 0)
          const possibleDirs = DIRECTIONS.filter((_, i) => i !== axis && i !== (axis % 2 === 0 ? axis + 1 : axis - 1))
          const validDirs = possibleDirs.filter(dir => {
            const testPos: [number, number, number] = [
              pipe.position[0] + dir[0],
              pipe.position[1] + dir[1],
              pipe.position[2] + dir[2]
            ]
            return isValid(testPos)
          })

          if (validDirs.length > 0) {
            // Found a way out!
            targetDir = validDirs[Math.floor(Math.random() * validDirs.length)]
            targetPos = [
              pipe.position[0] + targetDir[0],
              pipe.position[1] + targetDir[1],
              pipe.position[2] + targetDir[2]
            ]
            turned = true
          } else {
            // Truly stuck - reset this pipe
            pipe.position = [
              Math.floor(Math.random() * GRID_SIZE) - GRID_SIZE / 2,
              Math.floor(Math.random() * GRID_SIZE) - GRID_SIZE / 2,
              Math.floor(Math.random() * GRID_SIZE) - GRID_SIZE / 2
            ]
            pipe.direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]
            // Don't draw anything this frame for this pipe
            return
          }
        }

        // Move forward (or turn if we had to)
        if (!turned && Math.random() < 0.2) { // Reduced turn chance from 0.3 to 0.2 for longer segments
           // Random turn opportunity if not already forced to turn
           const axis = pipe.direction.findIndex(v => v !== 0)
           const possibleDirs = DIRECTIONS.filter((_, i) => i !== axis && i !== (axis % 2 === 0 ? axis + 1 : axis - 1))
           const validTurnDirs = possibleDirs.filter(dir => {
             const testPos: [number, number, number] = [
               pipe.position[0] + dir[0],
               pipe.position[1] + dir[1],
               pipe.position[2] + dir[2]
             ]
             return isValid(testPos)
           })
           
           if (validTurnDirs.length > 0) {
             targetDir = validTurnDirs[Math.floor(Math.random() * validTurnDirs.length)]
             targetPos = [
               pipe.position[0] + targetDir[0],
               pipe.position[1] + targetDir[1],
               pipe.position[2] + targetDir[2]
             ]
             turned = true
           }
        }

        // Add joint if we turned
        if (turned) {
          newSegments.push({
            position: pipe.position,
            direction: pipe.direction,
            length: 0,
            color: pipe.color,
            type: 'joint',
            key: `${pipe.id}-${time}-joint`
          })
        }

        // Add straight segment connecting previous position to current (or new turned target)
        // Note: If we turned, we put a joint at current pos, then draw cylinder to new pos
        // The cylinder is placed between current pipe.position and targetPos
        
        const midPoint: [number, number, number] = [
          pipe.position[0] + targetDir[0] * 0.5,
          pipe.position[1] + targetDir[1] * 0.5,
          pipe.position[2] + targetDir[2] * 0.5
        ]

        newSegments.push({
          position: midPoint,
          direction: targetDir,
          length: 1,
          color: pipe.color,
          type: 'straight',
          key: `${pipe.id}-${time}-straight`
        })

        // Check if we are about to move too close to another pipe (simple distance check to "space out" turns)
        // This is a heuristic to prevent the "double backing" look
        // We essentially mark the immediate neighbors of the new head position as "dangerous"
        // for the NEXT turn decision, but simpler: just enforce a minimum run length after a turn?
        // No, the user wants them spaced out.
        
        // Let's try adding the "sides" of the pipe to the gridRef to effectively widen the pipe collision
        // This prevents pipes from running directly parallel touching each other
        // Directions orthogonal to current movement
        // This might be too aggressive and cause them to trap easily.
        // Instead, let's just say we can't turn 180 degrees (already handled by orthogonal filter)
        // and maybe bias against turning back towards where we came from generally?
        
        // Actually, the "double backing" visual often comes from making a U-turn shape:
        // Forward -> Right -> Right (now we are parallel to start, 1 unit away)
        // If we enforce that after a turn, we must go at least X steps?
        // Or just mark the immediate adjacent cells as occupied?
        
        // Let's try marking the "parallel" neighbors as occupied to prevent tight packing
        // For a pipe at pos moving in dir, the "sides" are pos + orthogonal_dirs
        // Marking them prevents OTHER pipes from getting close, and this pipe from turning into them immediately?
        
        // Update pipe state
        pipe.position = targetPos
        pipe.direction = targetDir
        gridRef.current.add(pipe.position.join(','))
      }
    })

    if (needsUpdate && newSegments.length > 0) {
      setSegments(prev => {
        const updated = [...prev, ...newSegments]
        // Limit total segments to prevent memory explosion
        if (updated.length > 1000) {
            // Trigger reset in next tick
            setTimeout(onReset, 0)
            return prev
        }
        return updated
      })
    }
  })

  return (
    <group>
      {segments.map((seg) => {
        if (seg.type === 'joint') {
          return (
            <mesh key={seg.key} position={seg.position}>
              <sphereGeometry args={[PIPE_RADIUS * 1.3, 32, 32]} />
              <meshPhysicalMaterial 
                color={seg.color} 
                roughness={0.1}
                metalness={0.2}
                clearcoat={1}
                clearcoatRoughness={0.1}
              />
            </mesh>
          )
        } else {
          // Straight segment
          let rotation: [number, number, number] = [0, 0, 0]
          if (seg.direction[0] !== 0) rotation = [0, 0, Math.PI / 2] // X-axis
          if (seg.direction[2] !== 0) rotation = [Math.PI / 2, 0, 0] // Z-axis

          return (
            <mesh key={seg.key} position={seg.position} rotation={rotation}>
              <cylinderGeometry args={[PIPE_RADIUS, PIPE_RADIUS, 1, 32]} />
              <meshPhysicalMaterial 
                color={seg.color} 
                roughness={0.1}
                metalness={0.2}
                clearcoat={1}
                clearcoatRoughness={0.1}
              />
            </mesh>
          )
        }
      })}
    </group>
  )
}

function CameraRig({ resetKey }: { resetKey: number }) {
  const { camera } = useThree()
  
  useEffect(() => {
    // Randomize camera angle on each reset
    const distance = 26
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(Math.random() * 2 - 1)
    
    const x = distance * Math.sin(phi) * Math.cos(theta)
    const y = distance * Math.sin(phi) * Math.sin(theta)
    const z = distance * Math.cos(phi)
    
    camera.position.set(x, y, z)
    
    // Randomize up vector for roll
    camera.up.set(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    ).normalize()
    
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }, [resetKey, camera])
  
  return null
}

export default function Pipes() {
  const [resetKey, setResetKey] = useState(0)

  return (
    <div className="w-full h-full bg-black">
      <Canvas camera={{ fov: 50 }}>
        <color attach="background" args={['black']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        <pointLight position={[-10, 10, -10]} intensity={2} />
        <Environment preset="city" />
        
        <CameraRig resetKey={resetKey} />
        <PipesImpl key={resetKey} onReset={() => setResetKey(k => k + 1)} />
      </Canvas>
    </div>
  )
}
