import Header from '@/components/public/Header'
import Footer from '@/components/public/Footer'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col max-w-[1440px] mx-auto w-full">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
