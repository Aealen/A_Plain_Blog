import Sidebar from '@/components/admin/Sidebar'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

import { SignOutButton } from '@/components/admin/SignOutButton'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/admin/login')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1">
        <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-medium">管理后台</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session?.user?.nickname || session?.user?.username}</span>
            <SignOutButton />
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
