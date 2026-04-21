import type { Metadata } from 'next'
import { Space_Grotesk, Oswald, JetBrains_Mono } from 'next/font/google'
import '@/app/globals.css'
import { getSiteFavicon, getSiteName } from '@/actions/public/site'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const oswald = Oswald({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await getSiteName()
  return {
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description: '一个简洁的博客',
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const faviconUrl = await getSiteFavicon()

  return (
    <html lang="zh-CN" data-code-theme="github-dark-dimmed" className={`${spaceGrotesk.variable} ${oswald.variable} ${jetbrainsMono.variable}`}>
      <head>
        {faviconUrl && <link rel="icon" href={faviconUrl} />}
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        {children}
      </body>
    </html>
  )
}
