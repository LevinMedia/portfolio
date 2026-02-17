import React from 'react'
import { clsx } from 'clsx'

interface LevinMediaLogoProps {
  size?: number
  onClick?: () => void
  /** Solid background so content behind (e.g. particles) doesn't show through */
  fillBackground?: boolean
}

const LevinMediaLogo: React.FC<LevinMediaLogoProps> = ({ size = 24, onClick, fillBackground = false }) => {
  const isInteractive = typeof onClick === 'function'
  return (
    <div 
      className={clsx(
        'border border-blue-200/15 rounded-none flex items-center justify-center transition-colors',
        fillBackground && 'bg-background',
        isInteractive && 'cursor-pointer hover:bg-foreground/5'
      )}
      style={{ 
        width: size, 
        height: size 
      }}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? 'button' : undefined}
    >
      <div 
        className="border border-blue-200/15 rounded-full flex items-center justify-center text-foreground font-[family-name:var(--font-geist-mono)] font-medium"
        style={{ 
          width: size, 
          height: size,
          fontSize: size * 0.3
        }}
      >
        LM
      </div>
    </div>
  )
}

export default LevinMediaLogo 