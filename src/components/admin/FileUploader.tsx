'use client'

import { useState, useRef, useCallback } from 'react'

interface FileUploaderProps {
  onUpload: (url: string) => void
  accept?: string
}

export default function FileUploader({ onUpload, accept }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true)
    setError(null)

    try {
      const res = await fetch('/api/upload/sts')
      if (!res.ok) throw new Error('获取上传凭证失败')
      const sts = await res.json()

      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const ext = file.name.split('.').pop()
      const key = `uploads/${year}/${month}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`

      const formData = new FormData()
      formData.append('key', key)
      formData.append('OSSAccessKeyId', sts.accessKeyId)
      if (sts.securityToken) formData.append('x-oss-security-token', sts.securityToken)
      formData.append('file', file)

      const uploadUrl = `https://${sts.bucket}.${sts.region}.aliyuncs.com`
      const uploadRes = await fetch(uploadUrl, { method: 'POST', body: formData })
      if (!uploadRes.ok) throw new Error('上传失败')

      const fileUrl = `${uploadUrl}/${key}`
      onUpload(fileUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploading(false)
    }
  }, [onUpload])

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
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input ref={fileInputRef} type="file" onChange={handleFileChange} accept={accept} className="hidden" />
        {uploading ? (
          <div className="text-gray-500">
            <svg className="animate-spin h-8 w-8 mx-auto mb-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p>上传中...</p>
          </div>
        ) : (
          <div className="text-gray-500">
            <svg className="h-10 w-10 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16V4m0 0L8 8m4-4l4 4M4 20h16" />
            </svg>
            <p>点击或拖拽文件到此处上传</p>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
