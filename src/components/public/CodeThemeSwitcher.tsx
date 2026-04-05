'use client'

import { useState, useEffect, useRef } from 'react'
import themes from '@/lib/code-themes.json'

export default function CodeThemeSwitcher() {
  const [current, setCurrent] = useState(themes.defaultTheme)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem('code-theme')
    if (stored && themes.themes.some((t) => t.id === stored)) {
      setCurrent(stored)
      document.documentElement.setAttribute('data-code-theme', stored)
    } else {
      document.documentElement.setAttribute('data-code-theme', themes.defaultTheme)
    }
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function select(id: string) {
    setCurrent(id)
    localStorage.setItem('code-theme', id)
    document.documentElement.setAttribute('data-code-theme', id)
    setOpen(false)
  }

  const currentLabel = themes.themes.find((t) => t.id === current)?.label || current

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono bg-muted/60 hover:bg-muted px-2.5 py-1.5 rounded-md border border-border"
        title="切换代码主题"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
        {currentLabel}
      </button>
      {open && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 bg-background border border-border rounded-lg shadow-lg py-1 min-w-[180px]">
          {themes.themes.map((t) => (
            <button
              key={t.id}
              onClick={() => select(t.id)}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors ${
                t.id === current ? 'text-foreground font-medium bg-accent/50' : 'text-muted-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
