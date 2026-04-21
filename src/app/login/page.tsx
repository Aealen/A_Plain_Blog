'use client'
import { loginAction } from './actions'
import { useState, useEffect } from 'react'
import { getSiteName } from '@/actions/public/site'
import { DEFAULT_SITE_NAME } from '@/lib/constants'
export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [siteName, setSiteName] = useState(DEFAULT_SITE_NAME)

  useEffect(() => {
    getSiteName().then(setSiteName)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await loginAction({ username, password })

      if (result?.error) {
        setError('用户名/邮箱或密码错误')
      } else {
        window.location.href = '/admin'
      }
    } catch (err) {
      setError('登录失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-[#2d2d2d] p-8 rounded-[24px] border border-white/10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-1 mb-2">
            <span className="text-3xl font-bold font-display tracking-tight uppercase text-foreground">{siteName}</span>
          </div>
          <p className="font-mono text-[12px] text-muted-foreground uppercase tracking-[1.5px]">博客管理后台</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 text-red-400 p-3 rounded-[4px] text-sm font-mono">{error}</div>
          )}
          <div>
            <label htmlFor="username" className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1.5">用户名或邮箱</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名或邮箱"
              required
              className="w-full px-3 py-2.5 border border-white/10 rounded-[4px] bg-[#131313] text-white focus:outline-none focus:ring-2 focus:ring-mint/50 focus:border-mint transition-colors placeholder:text-muted-foreground/50"
            />
          </div>
          <div>
            <label htmlFor="password" className="block font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground mb-1.5">密码</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-white/10 rounded-[4px] bg-[#131313] text-white focus:outline-none focus:ring-2 focus:ring-mint/50 focus:border-mint transition-colors placeholder:text-muted-foreground/50"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-mint text-black py-2.5 rounded-[24px] font-mono text-[12px] font-semibold uppercase tracking-[1.5px] hover:bg-white/20 hover:text-white transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  )
}
