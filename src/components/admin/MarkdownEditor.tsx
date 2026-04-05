'use client'
import React, { useState, useCallback, useMemo, useRef, type ReactNode } from 'react'
import { extractTOC } from '@/lib/markdown'
import { generateSlug } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
}

type ViewMode = 'edit' | 'preview' | 'split'

const toolbarButtons = [
  { label: 'B', title: '粗体', prefix: '**', suffix: '**' },
  { label: 'I', title: '斜体', prefix: '*', suffix: '*' },
  { label: 'H1', title: '标题1', prefix: '# ', suffix: '' },
  { label: 'H2', title: '标题2', prefix: '## ', suffix: '' },
  { label: 'H3', title: '标题3', prefix: '### ', suffix: '' },
  { label: '""', title: '引用', prefix: '> ', suffix: '' },
  { label: 'UL', title: '无序列表', prefix: '- ', suffix: '' },
  { label: 'OL', title: '有序列表', prefix: '1. ', suffix: '' },
  { label: '<>', title: '代码块', prefix: '```\n', suffix: '\n```' },
  { label: '---', title: '分隔线', prefix: '\n---\n', suffix: '' },
  { label: '[]', title: '链接', prefix: '[', suffix: '](url)' },
  { label: 'Img', title: '图片', prefix: '![alt](', suffix: ')' },
]

const viewModes: { key: ViewMode; label: string }[] = [
  { key: 'edit', label: '编辑' },
  { key: 'split', label: '分屏' },
  { key: 'preview', label: '预览' },
]

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('edit')
  const previewRef = useRef<HTMLDivElement>(null)
  const insertMarkdown = useCallback(
    (prefix: string, suffix: string) => {
      const textarea = document.querySelector('textarea[data-editor="markdown"]') as HTMLTextAreaElement
      if (!textarea) return
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selected = value.substring(start, end)
      const newValue = value.substring(0, start) + prefix + selected + suffix + value.substring(end)
      onChange(newValue)
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length)
      }, 0)
    },
    [value, onChange]
  )
  const toc = extractTOC(value)

  const showEditor = viewMode === 'edit' || viewMode === 'split'
  const showPreview = viewMode === 'preview' || viewMode === 'split'

  function scrollToHeading(id: string) {
    if (showPreview && previewRef.current) {
      const el = previewRef.current.querySelector(`#${CSS.escape(id)}`)
      if (el) {
        const containerRect = previewRef.current.getBoundingClientRect()
        const elRect = el.getBoundingClientRect()
        previewRef.current.scrollTo({
          top: previewRef.current.scrollTop + elRect.top - containerRect.top - 16,
          behavior: 'smooth',
        })
        return
      }
    }
    // Fallback: scroll textarea to the heading line
    const textarea = document.querySelector('textarea[data-editor="markdown"]') as HTMLTextAreaElement
    if (!textarea) return
    const lines = value.split('\n')
    const headingPrefix = '#'
    const tocItem = toc.find(t => t.id === id)
    if (!tocItem) return
    const targetLevel = tocItem.level
    const prefix = '#'.repeat(targetLevel) + ' '
    let lineIdx = lines.findIndex(l => l.trimStart().startsWith(prefix) && l.trim().slice(prefix.length) === tocItem.text)
    if (lineIdx === -1) lineIdx = lines.findIndex(l => l.trimStart().startsWith(prefix) && l.includes(tocItem.text))
    if (lineIdx === -1) return
    const charsBefore = lines.slice(0, lineIdx).reduce((sum, l) => sum + l.length + 1, 0)
    textarea.focus()
    textarea.setSelectionRange(charsBefore, charsBefore + lines[lineIdx].length)
    // Scroll textarea to show the line
    const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 20
    textarea.scrollTop = Math.max(0, lineIdx * lineHeight - textarea.clientHeight / 3)
  }

  const previewContent = useMemo(() => {
    function extractText(children: ReactNode): string {
      if (typeof children === 'string') return children
      if (typeof children === 'number') return String(children)
      if (Array.isArray(children)) return children.map(extractText).join('')
      if (children && typeof children === 'object' && 'props' in children) return extractText((children as React.ReactElement<{ children?: ReactNode }>).props.children)
      return ''
    }
    function createHeading(level: number) {
      return function Heading({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement> & { children?: ReactNode }) {
        const id = extractText(children) ? generateSlug(extractText(children)) : undefined
        return React.createElement(`h${level}`, { ...props, id }, children)
      }
    }
    return (
      <div ref={previewRef} className="p-4 h-[500px] overflow-y-auto prose" style={{ maxWidth: 'none' }}>
        {value ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{ h1: createHeading(1), h2: createHeading(2), h3: createHeading(3), h4: createHeading(4), h5: createHeading(5), h6: createHeading(6) }}
          >{value}</ReactMarkdown>
        ) : (
          <p className="text-muted-foreground text-center py-20">在编辑区输入内容，这里会实时预览</p>
        )}
      </div>
    )
  }, [value])

  return (
    <div className="border border-border rounded-[var(--radius-lg)] overflow-hidden bg-card">
      <div className="bg-muted/50 border-b border-border px-3 py-2 flex items-center gap-1 flex-wrap">
        {showEditor && toolbarButtons.map((btn) => (
          <button key={btn.label} type="button" title={btn.title} onClick={() => insertMarkdown(btn.prefix, btn.suffix)} className="px-2 py-1 text-sm font-mono text-muted-foreground hover:bg-muted hover:text-foreground rounded-[var(--radius-sm)] transition-colors">{btn.label}</button>
        ))}
        <div className="flex-1" />
        <div className="flex items-center bg-muted rounded-[var(--radius-sm)] p-0.5">
          {viewModes.map((mode) => (
            <button
              key={mode.key}
              type="button"
              onClick={() => setViewMode(mode.key)}
              className={`px-3 py-1 text-xs font-mono font-medium rounded-[var(--radius-sm)] transition-colors ${
                viewMode === mode.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex">
        {showEditor && (
          <div className={showPreview ? 'flex-1 border-r border-border' : 'flex-1'}>
            <textarea
              data-editor="markdown"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="在这里编写 Markdown 内容..."
              className="w-full p-4 min-h-[500px] font-mono text-sm resize-none focus:outline-none bg-card text-foreground"
            />
          </div>
        )}
        {showPreview && (
          <div className="flex-1 min-w-0">
            {previewContent}
          </div>
        )}
        {toc.length > 0 && (
          <div className="w-48 shrink-0 border-l border-border bg-muted/30 p-3">
            <h4 className="text-xs font-medium font-mono text-muted-foreground mb-2">目录</h4>
            <nav className="space-y-1">
              {toc.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToHeading(item.id)}
                  className="block w-full text-left text-xs text-muted-foreground hover:text-primary truncate cursor-pointer transition-colors"
                  style={{ paddingLeft: `${(item.level - 1) * 8}px` }}
                >
                  {item.text}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
      <div className="bg-muted/50 border-t border-border px-3 py-1 flex items-center gap-4 text-xs text-muted-foreground font-mono">
        <span>{value.length} 字符</span>
        <span>{value.split(/\n/).length} 行</span>
      </div>
    </div>
  )
}
