'use client'
import { useState, useCallback } from 'react'
import { extractTOC } from '@/lib/markdown'
interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
}
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
export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false)
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
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-50 border-b px-3 py-2 flex items-center gap-1 flex-wrap">
        {toolbarButtons.map((btn) => (
          <button key={btn.label} type="button" title={btn.title} onClick={() => insertMarkdown(btn.prefix, btn.suffix)} className="px-2 py-1 text-sm font-mono hover:bg-gray-200 rounded">{btn.label}</button>
        ))}
        <div className="flex-1" />
        <button type="button" onClick={() => setIsPreview(!isPreview)} className={`px-3 py-1 text-sm rounded ${isPreview ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'}`}>{isPreview ? '编辑' : '预览'}</button>
      </div>
      <div className="flex">
        <div className="flex-1">
          {isPreview ? (
            <div className="p-4 min-h-[500px] prose max-w-none text-gray-400 text-center py-20">预览功能将在前台展示时实现</div>
          ) : (
            <textarea data-editor="markdown" value={value} onChange={(e) => onChange(e.target.value)} placeholder="在这里编写 Markdown 内容..." className="w-full p-4 min-h-[500px] font-mono text-sm resize-none focus:outline-none" />
          )}
        </div>
        {toc.length > 0 && (
          <div className="w-48 border-l bg-gray-50 p-3">
            <h4 className="text-xs font-medium text-gray-500 mb-2">目录</h4>
            <nav className="space-y-1">
              {toc.map((item) => (
                <div key={item.id} className="text-xs text-gray-600 hover:text-blue-600 truncate" style={{ paddingLeft: `${(item.level - 1) * 8}px` }}>{item.text}</div>
              ))}
            </nav>
          </div>
        )}
      </div>
      <div className="bg-gray-50 border-t px-3 py-1 flex items-center gap-4 text-xs text-gray-500">
        <span>{value.length} 字符</span>
        <span>{value.split(/\n/).length} 行</span>
      </div>
    </div>
  )
}
