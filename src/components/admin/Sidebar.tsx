'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

const menuItems = [
  { label: '仪表盘', href: '/admin', icon: '📊' },
  { label: '文章管理', href: '/admin/articles', icon: '📝' },
  { label: '分类管理', href: '/admin/categories', icon: '📁' },
  { label: '标签管理', href: '/admin/tags', icon: '🏷' },
  { label: '友链管理', href: '/admin/friend-links', icon: '🔗' },
  { label: '访问统计', href: '/admin/analytics', icon: '📈' },
  { label: '个人设置', href: '/admin/profile', icon: '⚙️' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold">博客管理</h1>
      </div>
      <nav className="space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              pathname === item.href
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="mt-auto pt-8">
        <form action="/api/auth/signout" method="POST">
          <button type="submit" className="text-sm text-gray-400 hover:text-white w-full text-left px-3 py-2">
            退出登录
          </button>
        </form>
      </div>
    </aside>
  )
}
