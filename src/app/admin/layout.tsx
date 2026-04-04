import Sidebar from '@/components/admin/Sidebar'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-card border-b border-border px-6 h-14 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-mono font-medium text-muted-foreground">管理后台</h2>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary font-mono">
              {(session?.user?.nickname || session?.user?.name || 'A').charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-foreground font-medium">{session?.user?.nickname || session?.user?.name}</span>
          </div>
        </header>
        <div className="flex-1 p-6 overflow-auto">{children}</div>
      </main>
    </div>
  )
}
