import Link from 'next/link'

export default function Footer({ siteName }: { siteName: string }) {
  return (
    <footer className="h-[80px] flex items-center justify-between px-5 md:px-[80px] border-t border-white/10 mt-auto">
      <span className="font-mono text-[11px] text-tertiary uppercase tracking-[1.5px]">
        &copy; {new Date().getFullYear()} {siteName}
      </span>
      <nav className="flex items-center gap-6">
        <Link
          href="/about"
          className="font-mono text-[12px] text-muted-foreground hover:text-link-hover uppercase tracking-[1.5px] transition-colors duration-200"
        >
          关于
        </Link>
        <Link
          href="/links"
          className="font-mono text-[12px] text-muted-foreground hover:text-link-hover uppercase tracking-[1.5px] transition-colors duration-200"
        >
          友链
        </Link>
      </nav>
    </footer>
  )
}
