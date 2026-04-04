import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-[1280px] mx-auto px-5 h-[72px] flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()}{' '}
          <Link href="/" className="font-semibold text-foreground hover:text-primary transition-colors font-mono">
            plain<span className="text-primary">.</span>
          </Link>
          {' '}All rights reserved.
        </span>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/about" className="hover:text-primary transition-colors">
            关于
          </Link>
          <span className="text-border">|</span>
          <Link href="/links" className="hover:text-primary transition-colors">
            友链
          </Link>
        </nav>
      </div>
    </footer>
  )
}
