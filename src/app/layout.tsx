import type { Metadata } from 'next'
import './globals.css'
import SplashWrapper from '@/components/splash-wrapper'

export const metadata: Metadata = {
  title: 'SukaKerja',
  description: 'Portal manajemen tugas internal kantor',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <SplashWrapper>{children}</SplashWrapper>
      </body>
    </html>
  )
}
