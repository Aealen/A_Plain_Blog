'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getItemColor } from '@/lib/colors'

interface ArticleData {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  coverImage?: string | null
  publishedAt: Date | null
  viewCount: number
  categories: { category: { name: string; slug: string } }[]
  tags: { tag: { name: string; slug: string } }[]
}

interface HeroCarouselProps {
  articles: ArticleData[]
}

export default function HeroCarousel({ articles }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const [visible, setVisible] = useState(true)
  const switchingRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const total = articles.length

  const goTo = useCallback((index: number) => {
    if (switchingRef.current) return
    switchingRef.current = true
    const target = (index + total) % total
    setVisible(false)
    setTimeout(() => {
      setCurrent(target)
      setVisible(true)
      switchingRef.current = false
    }, 600)
  }, [total])

  const next = useCallback(() => goTo(current + 1), [current, goTo])
  const prev = useCallback(() => goTo(current - 1), [current, goTo])

  // Auto-play
  useEffect(() => {
    if (total <= 1 || paused) return
    timerRef.current = setInterval(() => {
      if (switchingRef.current) return
      switchingRef.current = true
      setVisible(false)
      setTimeout(() => {
        setCurrent(prev => (prev + 1) % total)
        setVisible(true)
        switchingRef.current = false
      }, 600)
    }, 5000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [total, paused])

  if (total === 0) return null

  const article = articles[current]
  const isSingle = total === 1

  return (
    <section
      className="group/carousel relative flex flex-col md:flex-row items-center gap-[40px] md:gap-[60px] pt-[60px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Left: Text Content */}
      <div className={`w-full flex flex-col justify-center transition-all duration-[600ms] ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'} ${article.coverImage ? 'md:w-[740px]' : 'md:w-full'}`} style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}>
        {article.categories.length > 0 && (
          <span className="inline-block text-[12px] text-tertiary tracking-widest mb-6">
            ✦ {article.categories.map(c => c.category.name).join(' / ')}
          </span>
        )}
        <h1 className="font-display text-[32px] md:text-[44px] font-bold leading-[1.2] tracking-tight mb-6">
          <Link
            href={`/articles/${article.slug}`}
            className="hover:opacity-80 transition-opacity"
          >
            {article.title}
          </Link>
        </h1>
        {article.excerpt && (
          <p className="text-[15px] text-muted-foreground leading-[1.6] mb-6">
            {article.excerpt}
          </p>
        )}
        <div className="flex items-center gap-4">
          <Link
            href={`/articles/${article.slug}`}
            className="text-[13px] font-medium hover:underline"
          >
            阅读全文
          </Link>
        </div>
      </div>

      {/* Right: Image */}
      {article.coverImage && (
        <div className={`w-full md:w-[480px] h-[300px] md:h-[400px] rounded-lg overflow-hidden shrink-0 relative transition-all duration-[600ms] ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'}`} style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}>
          <Image
            src={article.coverImage}
            alt={article.title}
            key={article.id}
            fill
            sizes="480px"
            className="object-cover"
          />
        </div>
      )}

      {/* Navigation Controls */}
      {!isSingle && (
        <>
          {/* Arrows */}
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/60 backdrop-blur-sm border border-border/50 flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-card/90 transition-all duration-200 opacity-0 group-hover/carousel:opacity-100"
            aria-label="上一篇"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/60 backdrop-blur-sm border border-border/50 flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-card/90 transition-all duration-200 opacity-0 group-hover/carousel:opacity-100"
            aria-label="下一篇"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>

          {/* Dots */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-2">
            {articles.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === current
                    ? 'bg-foreground w-6'
                    : 'bg-muted-foreground/40 hover:bg-muted-foreground/70'
                }`}
                aria-label={`跳转到第 ${i + 1} 篇`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
