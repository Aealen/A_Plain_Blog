import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import '@/app/globals.css'
import { getSiteFavicon } from '@/actions/public/site'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: "Maxon's Blog",
    template: "%s | Maxon's Blog",
  },
  description: '一个简洁的博客',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const faviconUrl = await getSiteFavicon()

  return (
    <html lang="zh-CN" data-code-theme="github-dark-dimmed" className={`${inter.variable} ${outfit.variable}`}>
      <head>
        {faviconUrl && <link rel="icon" href={faviconUrl} />}
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        {children}
      </body>
    </html>
  )
}
