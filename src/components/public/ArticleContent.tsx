'use client'

import { useState, useRef, ReactNode, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import themes from '@/lib/code-themes.json'

const LANG_NAMES: Record<string, string> = {
  js: 'JavaScript',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  tsx: 'TSX',
  jsx: 'JSX',
  css: 'CSS',
  html: 'HTML',
  json: 'JSON',
  bash: 'Shell',
  shell: 'Shell',
  python: 'Python',
  sql: 'SQL',
  go: 'Go',
  rust: 'Rust',
  java: 'Java',
  yaml: 'YAML',
  markdown: 'Markdown',
  diff: 'Diff',
}

function useCodeTheme() {
  const [current, setCurrent] = useState(themes.defaultTheme)

  useEffect(() => {
    const stored = localStorage.getItem('code-theme')
    if (stored && themes.themes.some((t) => t.id === stored)) {
      setCurrent(stored)
    }

    function handleStorage(e: StorageEvent) {
      if (e.key === 'code-theme' && e.newValue) {
        setCurrent(e.newValue)
      }
    }
    window.addEventListener('storage', handleStorage)

    // Poll for same-tab changes from other code blocks
    let last = localStorage.getItem('code-theme') || themes.defaultTheme
    const interval = setInterval(() => {
      const now = localStorage.getItem('code-theme') || themes.defaultTheme
      if (now !== last) {
        last = now
        setCurrent(now)
      }
    }, 500)

    return () => {
      window.removeEventListener('storage', handleStorage)
      clearInterval(interval)
    }
  }, [])

  return { current, setTheme: setCurrent }
}

function ThemePicker({ current, onSelect }: { current: string; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

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
    onSelect(id)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="code-block-btn"
        title="切换代码主题"
      >
        <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 z-50 bg-background border border-border rounded-lg shadow-lg py-1 min-w-[160px]">
          {themes.themes.map((t) => (
            <button
              key={t.id}
              onClick={() => select(t.id)}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors ${
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

function CodeBlock({ children, theme, onThemeChange }: {
  children: ReactNode
  theme: string
  onThemeChange: (id: string) => void
}) {
  const preRef = useRef<HTMLPreElement>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [copied, setCopied] = useState(false)

  // Extract language from code element's className
  let lang = ''
  const child = children as React.ReactElement<{ className?: string }> | null
  if (child?.props?.className) {
    const m = child.props.className.match(/language-(\S+)/)
    if (m) lang = m[1]
  }
  const displayLang = LANG_NAMES[lang] || (lang ? lang.charAt(0).toUpperCase() + lang.slice(1) : '')

  const handleCopy = async () => {
    try {
      const text = preRef.current?.textContent || ''
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="code-block-container">
      <div className="code-block-bar">
        <span className="code-block-lang">{displayLang}</span>
        <div className="code-block-actions">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="code-block-btn"
            title={collapsed ? '展开代码' : '收起代码'}
          >
            <svg
              className="w-[14px] h-[14px]"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              style={{ transform: collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.15s' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button onClick={handleCopy} className="code-block-btn" title="复制代码">
            {copied ? (
              <svg className="w-[14px] h-[14px]" fill="none" stroke="#4ade80" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
          </button>
          <ThemePicker current={theme} onSelect={onThemeChange} />
        </div>
      </div>
      <pre ref={preRef} style={{ display: collapsed ? 'none' : undefined }}>
        {children}
      </pre>
    </div>
  )
}

export default function ArticleContent({ content }: { content: string }) {
  const { current, setTheme } = useCodeTheme()

  function selectTheme(id: string) {
    setTheme(id)
    localStorage.setItem('code-theme', id)
    document.documentElement.setAttribute('data-code-theme', id)
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight, rehypeSlug]}
      components={{
        pre({ children }) {
          return <CodeBlock theme={current} onThemeChange={selectTheme}>{children}</CodeBlock>
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
