import '@/styles/globals.css'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/common/Footer'
import AuthProvider from '@/components/AuthProvider'
import ThemeProvider from '@/components/common/ThemeProvider'
import ScrollToTop from '@/components/common/ScrollToTop'

export const metadata: Metadata = {
  title: 'Contribase',
  description: 'GitHub 활동을 분석하여 전문적인 개발자 포트폴리오를 자동으로 생성합니다',
  metadataBase: new URL(process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    other: [
      { url: '/icons/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Contribase',
    description: 'GitHub 활동을 분석하여 개발자 포트폴리오를 자동으로 생성합니다',
    images: [
      {
        url: '/images/Contribase_main.webp',
        width: 1200,
        height: 630,
        alt: 'Contribase - 개발자 포트폴리오 생성 서비스'
      }
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contribase',
    description: 'GitHub 활동을 분석하여 개발자 포트폴리오를 자동으로 생성합니다',
    images: ['/images/Contribase_main.webp'],
    creator: '@contribase'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icons/favicon.ico" sizes="any" />
        <link rel="icon" href="/icons/favicon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/icons/site.webmanifest" />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <div className="flex flex-col min-h-screen bg-primary-50">
              <Navbar />
              <main className="flex-grow pt-16">{children}</main>
              <Footer />
            </div>
            <ScrollToTop />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
} 