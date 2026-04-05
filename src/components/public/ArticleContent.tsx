'use client'

import { useState, useRef, ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'

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

function CodeBlock({ children }: { children: ReactNode }) {
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
        </div>
      </div>
      <pre ref={preRef} style={{ display: collapsed ? 'none' : undefined }}>
        {children}
      </pre>
    </div>
  )
}

export default function ArticleContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight, rehypeSlug]}
      components={{
        pre({ children }) {
          return <CodeBlock>{children}</CodeBlock>
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
