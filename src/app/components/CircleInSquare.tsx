import React from 'react'

interface CircleInSquareProps {
  size?: number
  onClick?: () => void
}

const CircleInSquare: React.FC<CircleInSquareProps> = ({ size = 24, onClick }) => {
  return (
    <div 
      className="border border-blue-200/15 rounded-none flex items-center justify-center cursor-pointer hover:bg-foreground/5 transition-colors"
      style={{ 
        width: size, 
        height: size 
      }}
      onClick={onClick}
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

export default CircleInSquare 