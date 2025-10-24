'use client'

import { useEffect, useRef } from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import Player from 'video.js/dist/types/player'

interface VideoPlayerProps {
  src: string
  className?: string
  poster?: string
}

export default function VideoPlayer({ src, className = '', poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<Player | null>(null)

  useEffect(() => {
    // Wait for next tick to ensure DOM is ready
    const timer = setTimeout(() => {
      // Make sure Video.js player is only initialized once and DOM element exists
      if (!playerRef.current && videoRef.current && document.contains(videoRef.current)) {
        const videoElement = videoRef.current

        try {
          // Initialize Video.js player
          const player = videojs(videoElement, {
            controls: true,
            responsive: true,
            fluid: true,
            preload: 'metadata',
            playsinline: true,
            controlBar: {
              volumePanel: {
                inline: false
              }
            }
          })

          playerRef.current = player
        } catch (error) {
          console.error('Failed to initialize Video.js:', error)
        }
      }
    }, 0)

    // Cleanup on unmount
    return () => {
      clearTimeout(timer)
      if (playerRef.current) {
        try {
          playerRef.current.dispose()
          playerRef.current = null
        } catch (error) {
          console.error('Error disposing player:', error)
        }
      }
    }
  }, [])

  // Update source when src changes
  useEffect(() => {
    if (playerRef.current && src) {
      playerRef.current.src({ src, type: getVideoType(src) })
      playerRef.current.load()
    }
  }, [src])

  return (
    <div className={`video-player-wrapper ${className}`}>
      <div data-vjs-player>
        <video
          ref={videoRef}
          className="video-js vjs-big-play-centered"
          poster={poster}
        >
          <source src={src} type={getVideoType(src)} />
        </video>
      </div>
    </div>
  )
}

// Helper to determine video MIME type from URL
function getVideoType(url: string): string {
  const extension = url.split('.').pop()?.toLowerCase()
  
  const typeMap: Record<string, string> = {
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'ogg': 'video/ogg',
    'ogv': 'video/ogg',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    'mkv': 'video/x-matroska',
    'mpeg': 'video/mpeg',
    'mpg': 'video/mpeg',
    '3gp': 'video/3gpp',
    'flv': 'video/x-flv',
  }
  
  return typeMap[extension || ''] || 'video/mp4'
}

