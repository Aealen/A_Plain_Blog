'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function VisitTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // Skip admin and API routes
    if (pathname.startsWith('/admin') || pathname.startsWith('/api')) return

    const track = async () => {
      try {
        await fetch('/api/visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: pathname,
            referrer: document.referrer || undefined,
          }),
        })
      } catch {
        // Silently fail — tracking shouldn't break the page
      }
    }

    track()
  }, [pathname])

  return null
}
