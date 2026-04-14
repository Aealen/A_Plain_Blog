import Header from '@/components/public/Header'
import Footer from '@/components/public/Footer'
import VisitTracker from '@/components/public/VisitTracker'
import { getSiteName } from '@/actions/public/site'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const siteName = await getSiteName()

  return (
    <div className="min-h-screen flex flex-col max-w-[1440px] mx-auto w-full">
      <Header siteName={siteName} />
      <main className="flex-1">{children}</main>
      <Footer siteName={siteName} />
      <VisitTracker />
    </div>
  )
}
