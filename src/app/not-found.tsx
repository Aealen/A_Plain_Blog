import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-[8rem] leading-none font-mono font-bold text-foreground tracking-tight">
          404
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          页面未找到
        </p>
        <p className="mt-2 text-sm text-muted-foreground/60">
          你访问的页面不存在或已被移除
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 mt-8 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          ← 返回
          <span className="font-mono font-semibold">plain</span>
          <span className="text-primary font-mono font-semibold">.</span>
        </Link>
      </div>
    </div>
  )
}
