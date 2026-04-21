import type { Metadata } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'R-Code',
  description: 'A secure, lightweight code editor',
}

export function Head() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Circular:wght@400;500&family=Source+Code+Pro:wght@400;500&display=swap" rel="stylesheet" />
    </>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="dark">
      <body className="min-h-screen bg-surface-200 text-cursor-dark">
        {children}
      </body>
    </html>
  )
}
