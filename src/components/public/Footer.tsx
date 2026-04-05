import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="h-[80px] flex items-center justify-between px-5 md:px-[80px] border-t border-border mt-auto">
      <span className="text-[13px] text-tertiary">
        &copy; {new Date().getFullYear()} plain. All rights reserved.
      </span>
      <nav className="flex items-center gap-6">
        <Link
          href="/about"
          className="text-[13px] text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          关于
        </Link>
        <Link
          href="/links"
          className="text-[13px] text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          友链
        </Link>
      </nav>
    </footer>
  )
}
