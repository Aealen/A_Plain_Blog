import { getActiveFriendLinks } from '@/actions/public/friendLink'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '友情链接',
  description: '友情链接',
}

export default async function LinksPage() {
  const links = await getActiveFriendLinks()

  return (
    <div className="max-w-[880px] mx-auto pt-[60px] pb-10 px-5">

      <h1 className="text-3xl font-bold font-display text-foreground mb-8">友情链接</h1>

      {links.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">暂无友情链接</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block bg-card rounded-[var(--radius-lg)] border border-border p-6 hover:border-primary/40 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center gap-4 mb-3">
                {link.avatar ? (
                  <img
                    src={link.avatar}
                    alt={link.name}
                    className="w-12 h-12 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-primary font-bold font-display text-lg">
                    {link.name.charAt(0)}
                  </div>
                )}
                <h2 className="text-lg font-bold font-display text-foreground group-hover:text-primary transition-colors">{link.name}</h2>
              </div>
              {link.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{link.description}</p>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
