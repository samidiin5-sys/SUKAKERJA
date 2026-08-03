'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from './sidebar'
import Navbar from './navbar'
import { createClient } from '@/lib/supabase/client'
import { shouldRedirectToLogin } from '@/lib/auth/session'
import type { DataShell } from '@/lib/shell-data'

export default function AppShell({
  data,
  children,
}: {
  data: DataShell
  children: React.ReactNode
}) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const cekSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (shouldRedirectToLogin({ session, user })) {
        router.replace('/login')
      }
    }

    void cekSession()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') return
      void cekSession()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
    }
  }, [router])

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.7),_transparent_42%)] bg-cream-100 lg:items-start">
      <Sidebar
        data={data}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          data={data}
          onOpenMobile={() => setMobileOpen(true)}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
        />
        <main className="flex-1 px-3 py-4 pb-20 sm:px-6 sm:py-6 sm:pb-24">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">{children}</div>
        </main>
      </div>
      {data.roleSistem !== 'super_admin' && <FloatingLaporMasalah nama={data.nama} />}
    </div>
  )
}

function FloatingLaporMasalah({ nama }: { nama: string }) {
  const nomorWa = process.env.NEXT_PUBLIC_SUPERADMIN_WA
  if (!nomorWa) return null

  const pesan = encodeURIComponent(
    `Halo Admin, saya ${nama} ingin melaporkan kendala/bug di aplikasi SukaKerja:\n\n` +
    `• Masalah: [Tuliskan detail kendala di sini]\n` +
    `• Halaman: [Nama/Link Halaman]\n\n` +
    `Mohon bantuannya, terima kasih!`
  )
  const href = `https://wa.me/${nomorWa}?text=${pesan}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 px-3.5 text-white shadow-lg shadow-green-600/20 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-600/30 group outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
      title="Lapor masalah/bug ke Super Admin via WhatsApp"
    >
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:scale-110">
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
          <path d="M12 22a8.3 8.3 0 0 0 5-1.5" />
        </svg>
      </span>
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-[11px] font-extrabold tracking-wide uppercase transition-all duration-300 ease-out group-hover:max-w-xs">
        Lapor Kendala
      </span>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
      </span>
    </a>
  )
}
