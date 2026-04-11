'use client'

import { useState, useRef, useCallback } from 'react'
import { uploadToOss, type UploadPurpose } from '@/lib/upload-client'

interface FileUploaderProps {
  onUpload: (url: string) => void
  accept?: string
  purpose: UploadPurpose
}

export default function FileUploader({ onUpload, accept, purpose }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const result = await uploadToOss(file, purpose)
      onUpload(result.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploading(false)
    }
  }, [onUpload, purpose])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  return (
    <div>
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        className={`border-2 border-dashed rounded-[var(--radius-lg)] p-8 text-center cursor-pointer transition-all duration-200 ${
          dragOver ? 'border-primary bg-accent' : 'border-border hover:border-primary/40 bg-muted/30'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input ref={fileInputRef} type="file" onChange={handleFileChange} accept={accept} className="hidden" />
        {uploading ? (
          <div className="text-muted-foreground">
            <svg className="animate-spin h-8 w-8 mx-auto mb-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="font-mono text-sm">上传中...</p>
          </div>
        ) : (
          <div className="text-muted-foreground">
            <svg className="h-10 w-10 mx-auto mb-2 text-muted-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16V4m0 0L8 8m4-4l4 4M4 20h16" />
            </svg>
            <p className="font-mono text-sm">点击或拖拽文件到此处上传</p>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  )
}
