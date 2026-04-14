'use client'
import { signIn } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { getSiteName } from '@/actions/public/site'
import { DEFAULT_SITE_NAME } from '@/lib/constants'
export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [siteName, setSiteName] = useState(DEFAULT_SITE_NAME)

  useEffect(() => {
    getSiteName().then(setSiteName)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
      callbackUrl: '/admin',
    })
    if (result?.error) {
      setError('用户名/邮箱或密码错误')
    } else {
      window.location.href = '/admin'
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-card p-8 rounded-[var(--radius-lg)] border border-border shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-1 mb-2">
            <span className="text-3xl font-bold font-mono tracking-tight text-foreground">{siteName}</span>
          </div>
          <p className="text-sm text-muted-foreground font-mono">博客管理后台</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-[var(--radius-sm)] text-sm">{error}</div>
          )}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-muted-foreground mb-1">用户名或邮箱</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名或邮箱"
              required
              className="w-full px-3 py-2 border border-border rounded-[var(--radius-sm)] bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-1">密码</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border rounded-[var(--radius-sm)] bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-[var(--radius-sm)] hover:bg-primary/90 font-medium transition-colors"
          >
            登录
          </button>
        </form>
      </div>
    </div>
  )
}
