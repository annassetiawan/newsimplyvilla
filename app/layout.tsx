import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import './globals.css'
import { Providers } from '@/components/providers'

export const metadata: Metadata = {
  title: 'SimplyVilla',
  description: 'Villa Management Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={GeistSans.variable}>
      <body className={`${GeistSans.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
