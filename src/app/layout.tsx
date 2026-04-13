import type { Metadata } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'R-Code',
  description: 'A secure, lightweight code editor',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface-200 text-cursor-dark">
        {children}
      </body>
    </html>
  )
}
