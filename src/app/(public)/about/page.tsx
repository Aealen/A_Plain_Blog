export const dynamic = 'force-dynamic'

export const metadata = {
  title: '关于',
  description: '关于本站',
}

import { getSiteName } from '@/actions/public/site'
import { getSiteConfig } from '@/actions/admin/site'
import Image from 'next/image'

export default async function AboutPage() {
  const siteName = await getSiteName()
  const [avatar, nickname, subtitle, bio, techsStr, contact] = await Promise.all([
    getSiteConfig('about_avatar'),
    getSiteConfig('about_nickname'),
    getSiteConfig('about_subtitle'),
    getSiteConfig('about_bio'),
    getSiteConfig('about_techs'),
    getSiteConfig('about_contact'),
  ])

  const displayName = nickname || siteName
  const displaySubtitle = subtitle || '一个简洁的博客'
  const displayBio = bio || '这是一个基于 Next.js 15 构建的博客系统，使用 TypeScript 和 Tailwind CSS 开发。后端采用 Prisma ORM 连接 PostgreSQL 数据库，支持 Markdown 写作、分类管理、标签管理等功能。'
  const displayTechs = techsStr
    ? techsStr.split(',').map(t => t.trim()).filter(Boolean)
    : ['Next.js 15', 'TypeScript', 'Tailwind CSS', 'Prisma ORM', 'PostgreSQL', 'NextAuth.js', 'React Markdown']

  return (
    <div className="max-w-[880px] mx-auto pt-[60px] pb-10 px-5">

      {/* Centered profile section */}
      <div className="flex flex-col items-center">
        {avatar ? (
          <Image src={avatar} alt={displayName} width={120} height={120} className="w-[120px] h-[120px] rounded-full object-cover mb-10 border-2 border-primary" />
        ) : (
          <div className="w-[120px] h-[120px] rounded-full bg-card border-2 border-primary flex items-center justify-center text-primary text-4xl font-bold font-display mb-10">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}

        <h1 className="font-display text-[44px] font-bold uppercase tracking-[1px]">{displayName}</h1>

        <p className="font-mono text-[12px] text-tertiary mt-4 uppercase tracking-[1.5px]">{displaySubtitle}</p>
      </div>

      {/* Full-width divider */}
      <div className="border-t border-border my-10" />

      {/* Description sections, centered */}
      <div className="max-w-[600px] mx-auto space-y-6">
        <p className="text-muted-foreground leading-relaxed text-center">
          {displayBio}
        </p>

        {displayTechs.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {displayTechs.map((tech) => (
              <span
                key={tech}
                className="font-mono text-[11px] uppercase tracking-[1.1px] px-3 py-1 bg-card border border-border rounded-[20px] text-muted-foreground"
              >
                {tech}
              </span>
            ))}
          </div>
        )}

        {contact && (
          <p className="text-center text-sm text-muted-foreground">
            联系方式：
            <a
              href={`mailto:${contact}`}
              className="text-primary font-mono"
            >
              {contact}
            </a>
          </p>
        )}
      </div>
    </div>
  )
}
