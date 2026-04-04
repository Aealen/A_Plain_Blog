import Link from 'next/link'

const navLinks = [
  { href: '/', label: '首页' },
  { href: '/categories', label: '分类' },
  { href: '/tags', label: '标签' },
  { href: '/archives', label: '归档' },
  { href: '/about', label: '关于' },
  { href: '/links', label: '友链' },
]

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
          My Blog
        </Link>
        <nav className="flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
