import Sidebar from '@/components/admin/Sidebar'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { getSiteName } from '@/actions/public/site'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const siteName = await getSiteName()

  const avatarUrl = session?.user?.avatarUrl
  const displayName = session?.user?.nickname || session?.user?.name || 'User'

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar siteName={siteName} />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-[#2d2d2d] border-b border-white/10 px-6 h-14 flex items-center justify-between shrink-0">
          <h2 className="font-mono text-[12px] uppercase tracking-[1.5px] text-muted-foreground">管理后台</h2>
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={displayName} width={28} height={28} className="w-7 h-7 rounded-full object-cover border border-white/10" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-mint/10 border border-white/10 flex items-center justify-center text-xs font-bold text-mint font-mono">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm text-foreground font-medium">{displayName}</span>
          </div>
        </header>
        <div className="flex-1 p-6 overflow-auto">{children}</div>
      </main>
    </div>
  )
}
