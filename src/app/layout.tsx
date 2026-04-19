import type { Metadata, Viewport } from 'next'
import { Assistant } from 'next/font/google'
import './globals.css'

const assistant = Assistant({ subsets: ['latin', 'hebrew'], weight: ['400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: 'ValueWise | ערך חכם לכיס שלך',
  description: 'מקסם כל הטבה מכל כרטיס ומועדון. בדיוק ברגע הקנייה.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ValueWise',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0f3b2e',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={assistant.className}>
        {children}
      </body>
    </html>
  )
}
