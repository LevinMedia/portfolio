'use client'

import { useEffect, useRef, useState } from 'react'
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
  const [error, setError] = useState<string | null>(null)

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
            html5: {
              vhs: {
                overrideNative: true
              },
              nativeVideoTracks: false,
              nativeAudioTracks: false,
              nativeTextTracks: false
            },
            controlBar: {
              volumePanel: {
                inline: false
              }
            }
          })

          // Add error handler
          player.on('error', () => {
            const err = player.error()
            if (err) {
              let errorMessage = 'Unable to play this video.'
              
              switch (err.code) {
                case 1: // MEDIA_ERR_ABORTED
                  errorMessage = 'Video playback was aborted.'
                  break
                case 2: // MEDIA_ERR_NETWORK
                  errorMessage = 'A network error caused the video download to fail.'
                  break
                case 3: // MEDIA_ERR_DECODE
                  errorMessage = 'Video format is not supported by your browser. Try re-encoding to H.264 MP4.'
                  break
                case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
                  errorMessage = 'Video format is not supported or file is corrupted.'
                  break
                default:
                  errorMessage = `Video error: ${err.message || 'Unknown error'}`
              }
              
              console.error('Video.js Error:', {
                code: err.code,
                message: err.message,
                url: src
              })
              
              setError(errorMessage)
            }
          })

          playerRef.current = player
        } catch (error) {
          console.error('Failed to initialize Video.js:', error)
          setError('Failed to initialize video player.')
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
      setError(null) // Reset error when changing source
      playerRef.current.src({ src, type: getVideoType(src) })
      playerRef.current.load()
    }
  }, [src])

  return (
    <div className={`video-player-wrapper ${className} relative`}>
      {error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/95 border border-destructive/50 rounded-md">
          <div className="text-center p-6 max-w-md">
            <div className="text-destructive text-lg font-semibold mb-2">⚠️ Video Error</div>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-mono break-all">{src}</p>
              <p className="mt-3 text-left">
                <strong>Recommended format:</strong><br />
                • Container: MP4<br />
                • Video Codec: H.264 (not H.265/HEVC)<br />
                • Audio Codec: AAC<br />
                • Max Resolution: 1920x1080
              </p>
            </div>
          </div>
        </div>
      )}
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

