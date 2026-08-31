import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kelana Nova — Jalan Nyaman, Sampai Tenang',
  description: 'Pemesanan tiket shuttle eksekutif antarkota Jakarta, Bandung, Bekasi, Bogor. Perjalanan tepat waktu dan nyaman.',
  keywords: ['kelana nova', 'shuttle jakarta bandung', 'travel bandung', 'executive shuttle', 'tiket travel'],
  authors: [{ name: 'Kelana Nova' }],
}

export const viewport: Viewport = {
  themeColor: '#a6192e',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  )
}
