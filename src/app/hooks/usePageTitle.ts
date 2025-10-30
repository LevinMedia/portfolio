import { useEffect } from 'react'

export function usePageTitle(title: string | null) {
  useEffect(() => {
    if (title) {
      document.title = `LevinMedia / ${title}`
    } else {
      document.title = 'LevinMedia'
    }

    // Cleanup: reset to default on unmount
    return () => {
      document.title = 'LevinMedia'
    }
  }, [title])
}

