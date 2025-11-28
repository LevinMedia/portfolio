'use client'

import React, { useRef, useEffect } from 'react'
import chroma from 'chroma-js'

// Types for our simulation
interface Point {
  x: number
  y: number
  dx: number
  dy: number
}

interface Polygon {
  points: Point[]
  color: string // Current main color
  targetColor: string // Target color to transition to
  colorProgress: number // 0 to 1
}

const NUM_POLYGONS = 2
const POINTS_PER_POLYGON = 4
const HISTORY_SIZE = 15
const SPEED = 3
const COLOR_CHANGE_SPEED = 0.005

export default function Mystify() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = window.innerWidth
    let height = window.innerHeight

    // Helper to get random hex color
    const getRandomColor = () => chroma.random().hex()

    // Initialize state
    const polygons: Polygon[] = []
    const history: Point[][][] = [] // history[polygonIndex][historyIndex][pointIndex]

    // Create initial polygons
    for (let i = 0; i < NUM_POLYGONS; i++) {
      const points: Point[] = []
      for (let j = 0; j < POINTS_PER_POLYGON; j++) {
        points.push({
          x: Math.random() * width,
          y: Math.random() * height,
          dx: (Math.random() * 2 + 1) * (Math.random() < 0.5 ? 1 : -1) * SPEED,
          dy: (Math.random() * 2 + 1) * (Math.random() < 0.5 ? 1 : -1) * SPEED
        })
      }
      polygons.push({
        points,
        color: getRandomColor(),
        targetColor: getRandomColor(),
        colorProgress: 0
      })
      history.push([])
    }

    const handleResize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }

    // Initial size
    handleResize()
    window.addEventListener('resize', handleResize)

    const render = () => {
      // Clear with slight opacity to create a subtle fade trail for everything?
      // No, Mystify uses strict history lines. But user asked for "gradually fade".
      // This usually means the trails fade out (already doing that with alpha).
      // We'll stick to the strict clear to match the clean look, fading is handled by history loop.
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, width, height)

      // Update and draw
      polygons.forEach((poly, polyIndex) => {
        // Update color
        poly.colorProgress += COLOR_CHANGE_SPEED
        if (poly.colorProgress >= 1) {
          poly.color = poly.targetColor
          poly.targetColor = getRandomColor()
          poly.colorProgress = 0
        }
        
        // Interpolate current color
        const currentColor = chroma.mix(poly.color, poly.targetColor, poly.colorProgress).hex()

        // Update points
        poly.points.forEach(p => {
          p.x += p.dx
          p.y += p.dy

          // Bounce off walls
          if (p.x < 0) {
            p.x = 0
            p.dx *= -1
          }
          if (p.x > width) {
            p.x = width
            p.dx *= -1
          }
          if (p.y < 0) {
            p.y = 0
            p.dy *= -1
          }
          if (p.y > height) {
            p.y = height
            p.dy *= -1
          }
        })

        // Store history
        const currentPointsSnapshot = poly.points.map(p => ({ ...p }))
        history[polyIndex].unshift(currentPointsSnapshot)
        if (history[polyIndex].length > HISTORY_SIZE) {
          history[polyIndex].pop()
        }

        // Draw history trails
        // Draw oldest first so they are behind
        for (let h = history[polyIndex].length - 1; h >= 0; h--) {
          const points = history[polyIndex][h]
          ctx.beginPath()
          ctx.moveTo(points[0].x, points[0].y)
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y)
          }
          ctx.closePath() // Connect last to first to close loop
          
          // Fade opacity based on history index
          const alpha = 1 - (h / HISTORY_SIZE)
          
          // Make lines glow a bit by setting shadow? Performance heavy but looks cool.
          // Let's stick to simple lines for speed, but maybe slightly wider?
          ctx.strokeStyle = currentColor
          ctx.globalAlpha = alpha
          ctx.lineWidth = 2
          ctx.stroke()
        }
        
        ctx.globalAlpha = 1.0 // Reset
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full bg-black block"
    />
  )
}
