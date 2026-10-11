'use client'

import { useEffect, useState, type CSSProperties } from 'react'

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

/**
 * Odometer-style figure: every digit is a 0–9 strip that slides to its value, so a change rolls
 * rather than swaps. Slots are counted from the right, which keeps the ones place anchored while
 * leading digits (and separators) open and close as the figure grows or shrinks.
 */
export default function RollingNumber({ text, slots = 9 }: { text: string; slots?: number }) {
  // First paint is a lone zero, so the figure rolls up into place when it arrives
  const [shown, setShown] = useState('0')

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(text))
    return () => cancelAnimationFrame(id)
  }, [text])

  const chars = shown.split('').reverse()
  const count = Math.max(slots, chars.length)

  return (
    <>
      <span className="sr-only">{text}</span>
      <span className="stats-roll" aria-hidden>
        {Array.from({ length: count }, (_, n) => {
          const i = count - 1 - n
          const char = chars[i]
          const digit = char === undefined ? 0 : DIGITS.indexOf(char)
          return (
            <span
              key={i}
              className="stats-roll__slot"
              data-on={char !== undefined ? 'true' : undefined}
              style={{ '--i': i } as CSSProperties}
            >
              {digit >= 0 ? (
                <span className="stats-roll__strip" style={{ transform: `translateY(${-digit * 10}%)` }}>
                  {DIGITS.map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </span>
              ) : (
                char
              )}
            </span>
          )
        })}
      </span>
    </>
  )
}
