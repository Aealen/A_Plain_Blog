import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import '@/app/globals.css'

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${outfit.variable}`}>
      <body className="min-h-screen flex flex-col antialiased">
        {children}
      </body>
    </html>
  )
}
