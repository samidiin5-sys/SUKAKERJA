'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type { DataShell } from '@/lib/shell-data'
import { createClient } from '@/lib/supabase/client'

type ItemNav = {
  href: string
  label: string
  icon: React.ReactNode
  hasDot?: boolean
}



export default function Sidebar({
  data,
  mobileOpen,
  onCloseMobile,
  collapsed,
  onToggleCollapse,
}: {
  data: DataShell
  mobileOpen: boolean
  onCloseMobile: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const isSuperAdmin = data.roleSistem === 'super_admin'
  const isOwner = data.roleSistem === 'owner'

  const [tugasTersediaDot, setTugasTersediaDot] = useState(false)

  useEffect(() => {
    if (!data.latestTugasTersedia) {
      setTugasTersediaDot(false)
      return
    }

    const lastSeenId = localStorage.getItem('last_seen_tugas_tersedia')

    if (pathname === '/tugas-tersedia') {
      localStorage.setItem('last_seen_tugas_tersedia', data.latestTugasTersedia)
      setTugasTersediaDot(false)
    } else {
      setTugasTersediaDot(lastSeenId !== data.latestTugasTersedia)
    }
  }, [pathname, data.latestTugasTersedia])

  async function tanganiLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navUtama: ItemNav[] = [
    { href: '/dashboard', label: 'Dashboard', icon: <IkonRumah /> },
    ...(!isSuperAdmin && !isOwner ? [
      { href: '/tugas-saya', label: 'Tugas Saya', icon: <IkonDaftar /> },
      { href: '/riwayat-bonus', label: 'Riwayat Bonus', icon: <IkonBonus /> },
      { href: '/tugas-tersedia', label: 'Tugas Tersedia', icon: <IkonClipboard />, hasDot: tugasTersediaDot },
      { href: '/lembur', label: 'Lembur', icon: <IkonJam /> },
      { href: '/panduan', label: 'Panduan', icon: <IkonPanduan /> },
      { href: '/notifikasi', label: 'Notifikasi', icon: <IkonLonceng /> },
      { href: '/profil', label: 'Profil', icon: <IkonOrang /> },
    ] : []),
  ]

  const navAdmin: ItemNav[] = [
    { href: '/admin/karyawan', label: 'Kelola Karyawan', icon: <IkonOrang /> },
    { href: '/admin/divisi', label: 'Kelola Divisi', icon: <IkonPapan /> },
    { href: '/admin/data-terhapus', label: 'Data Terhapus', icon: <IkonSampah /> },
    { href: '/admin/log-sistem', label: 'Log Sistem', icon: <IkonLog /> },
    { href: '/lembur', label: 'Tetapkan Lembur', icon: <IkonJam /> },
    { href: '/admin/lembur', label: 'Review Lembur', icon: <IkonJam /> },
    { href: '/admin/tugas-tersedia', label: 'Tugas Terbuka', icon: <IkonClipboard /> },
    { href: '/panduan', label: 'Panduan', icon: <IkonPanduan /> },
  ]

  const navOwner: ItemNav[] = [
    { href: '/admin/karyawan', label: 'Data Karyawan', icon: <IkonOrang /> },
    { href: '/lembur', label: 'Tetapkan Lembur', icon: <IkonJam /> },
    { href: '/admin/lembur', label: 'Review Lembur', icon: <IkonJam /> },
    { href: '/admin/tugas-tersedia', label: 'Tugas Terbuka', icon: <IkonClipboard /> },
    { href: '/admin/log-sistem', label: 'Log Aktivitas', icon: <IkonLog /> },
    { href: '/panduan', label: 'Panduan', icon: <IkonPanduan /> },
  ]

  const isi = (
    <>
      <div className="flex items-center gap-2.5 px-3.5 py-4">
        <div
          title="SukaKerja"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[16px] border border-white/20 bg-white/15 text-cream-50 shadow-[0_8px_20px_rgba(0,0,0,0.16)] backdrop-blur-sm transition-transform hover:scale-105"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            <rect width="20" height="14" x="2" y="6" rx="2" />
            <path d="m9 13 2 2 4-4" />
          </svg>
        </div>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.p
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden whitespace-nowrap text-sm font-black tracking-tight text-cream-50"
            >
              SukaKerja
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto px-2.5 pb-4 custom-scrollbar">
        <SeksiNav judul="Menu" collapsed={collapsed} />
        {navUtama.map((item) => (
          <ItemSidebar key={item.href} item={item} aktif={pathname === item.href} collapsed={collapsed} />
        ))}

        {data.divisiSaya.length > 0 && (
          <>
            <SeksiNav judul="Divisi" collapsed={collapsed} />
            {data.divisiSaya.map((d) => {
              const href = isSuperAdmin ? `/divisi/${d.id}/anggota` : `/divisi/${d.id}`
              return (
                <ItemSidebar
                  key={d.id}
                  item={{ href, label: d.nama, icon: <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.warna }} /> }}
                  aktif={pathname.startsWith(`/divisi/${d.id}`)}
                  collapsed={collapsed}
                />
              )
            })}
          </>
        )}

        {isSuperAdmin && (
          <>
            <SeksiNav judul="Admin" collapsed={collapsed} />
            {navAdmin.map((item) => (
              <ItemSidebar key={item.href} item={item} aktif={pathname === item.href} collapsed={collapsed} />
            ))}
          </>
        )}

        {isOwner && (
          <>
            <SeksiNav judul="Operasional" collapsed={collapsed} />
            {navOwner.map((item) => (
              <ItemSidebar key={item.href} item={item} aktif={pathname === item.href} collapsed={collapsed} />
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-cream-50/10 p-2.5">
        <ItemSidebar
          item={{ href: '/ganti-password', label: 'Ganti Password', icon: <IkonKunci /> }}
          aktif={pathname === '/ganti-password'}
          collapsed={collapsed}
        />
        <button
          onClick={tanganiLogout}
          title={collapsed ? 'Keluar' : undefined}
          className="group relative mt-1 flex w-full items-center gap-3 rounded-[14px] px-2.5 py-2 text-sm font-semibold text-cream-200/70 transition hover:bg-cream-50/10 hover:text-cream-50"
        >
          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
            <IkonKeluar />
          </span>
          {!collapsed && <span className="truncate">Keluar</span>}

          {collapsed && (
            <span className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded-lg bg-maroon-950 px-2.5 py-1.5 text-xs font-semibold text-cream-50 shadow-lg group-hover:block">
              Keluar
            </span>
          )}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="relative hidden flex-col z-30 bg-gradient-to-b from-maroon-950 to-maroon-800 lg:flex lg:sticky lg:top-0 lg:h-screen"
      >
        {isi}

        {/* Floating toggle tab — vertically centered on right edge */}
        <button
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
          className="absolute -right-4 top-1/2 z-20 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-cream-200/80 bg-white/95 text-maroon-700 shadow-[0_10px_24px_rgba(92,31,33,0.16)] outline-none transition-all duration-300 hover:scale-110 hover:bg-maroon-800 hover:text-white active:scale-95 lg:flex"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-300 ease-out ${collapsed ? 'rotate-180' : ''}`}
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gradient-to-b from-maroon-950 to-maroon-800 lg:hidden"
            >
              {isi}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function SeksiNav({ judul, collapsed }: { judul: string; collapsed: boolean }) {
  if (collapsed) return <div className="my-2 border-t border-cream-50/10" />
  return (
    <div className="mb-1 mt-3 flex items-center px-2.5">
      <p className="text-[10px] font-bold tracking-[0.25em] text-cream-200/55">
        {judul.toUpperCase()}
      </p>
    </div>
  )
}



function ItemSidebar({ item, aktif, collapsed }: { item: ItemNav; aktif: boolean; collapsed: boolean }) {
  return (
    <Link
      href={item.href}
      title={item.label}
      className={`group relative flex items-center gap-3 rounded-[14px] px-2.5 py-2 text-sm font-semibold transition ${
        aktif
          ? 'bg-white/15 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]'
          : 'text-cream-200/80 hover:bg-white/10 hover:text-cream-50'
      }`}
    >
      <span className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center">
        {item.icon}
        {item.hasDot && (
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 shadow-[0_0_0_2px_rgba(92,31,33,1)]" />
        )}
      </span>
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  )
}

function IkonRumah() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v10h14V10" />
    </svg>
  )
}
function IkonDaftar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  )
}
function IkonOrang() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 7" />
      <path d="M15.5 13.5c3 .3 5 2.2 5.5 6.5" />
    </svg>
  )
}
function IkonPapan() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M8 4v17M16 4v17M3 10h5M16 10h5" />
    </svg>
  )
}
function IkonTempatSampah() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}
function IkonKunci() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}
function IkonChevronKiri() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}
function IkonChevronKanan() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}
function IkonSampah() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}
function IkonLog() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}
function IkonKeluar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  )
}
function IkonPanduan() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}
function IkonClipboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
      <path d="M9 12h6M9 16h4"/>
    </svg>
  )
}
function IkonJam() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  )
}
function IkonKalender() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}
function IkonLonceng() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 8a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5Z" />
      <path d="M10 18.5a2 2 0 0 0 4 0" />
    </svg>
  )
}
function IkonBonus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
