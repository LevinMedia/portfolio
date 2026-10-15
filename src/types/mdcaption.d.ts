import type { HTMLAttributes } from 'react'

/** Caption paragraphs from the `{.caption}` marker. react-markdown only accepts tags in JSX.IntrinsicElements. */
declare global {
  namespace JSX {
    interface IntrinsicElements {
      mdcaption: HTMLAttributes<HTMLElement>
    }
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      mdcaption: HTMLAttributes<HTMLElement>
    }
  }
}

export {}
