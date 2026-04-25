import type { Metadata } from 'next'
import localFont from 'next/font/local'
import '@/app/globals.css'
import { getSiteFavicon, getSiteName } from '@/actions/public/site'

const spaceGrotesk = localFont({
  src: [
    { path: '../../public/fonts/space-grotesk-latin-400-normal.woff2', weight: '400' },
    { path: '../../public/fonts/space-grotesk-latin-500-normal.woff2', weight: '500' },
    { path: '../../public/fonts/space-grotesk-latin-600-normal.woff2', weight: '600' },
    { path: '../../public/fonts/space-grotesk-latin-700-normal.woff2', weight: '700' },
  ],
  variable: '--font-sans',
  display: 'swap',
})

const oswald = localFont({
  src: [
    { path: '../../public/fonts/oswald-latin-400-normal.woff2', weight: '400' },
    { path: '../../public/fonts/oswald-latin-500-normal.woff2', weight: '500' },
    { path: '../../public/fonts/oswald-latin-600-normal.woff2', weight: '600' },
    { path: '../../public/fonts/oswald-latin-700-normal.woff2', weight: '700' },
  ],
  variable: '--font-display',
  display: 'swap',
})

const jetbrainsMono = localFont({
  src: [
    { path: '../../public/fonts/jetbrains-mono-latin-400-normal.woff2', weight: '400' },
    { path: '../../public/fonts/jetbrains-mono-latin-500-normal.woff2', weight: '500' },
    { path: '../../public/fonts/jetbrains-mono-latin-600-normal.woff2', weight: '600' },
    { path: '../../public/fonts/jetbrains-mono-latin-700-normal.woff2', weight: '700' },
  ],
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
