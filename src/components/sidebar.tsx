'use client'

import { useState, Suspense } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type { DataShell } from '@/lib/shell-data'
import { createClient } from '@/lib/supabase/client'

type ItemNav = {
  href: string
  label: string
  icon: React.ReactNode
}

type ItemNavGrup = {
  href: string
  label: string
  icon: React.ReactNode
  children: { href: string; label: string }[]
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

  async function tanganiLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navUtama: ItemNav[] = [
    { href: '/dashboard', label: 'Dashboard', icon: <IkonRumah /> },
    ...(!isSuperAdmin && !isOwner ? [
      { href: '/tugas-tersedia', label: 'Tugas Tersedia', icon: <IkonClipboard /> },
      { href: '/lembur', label: 'Lembur', icon: <IkonJam /> },
      { href: '/panduan', label: 'Panduan', icon: <IkonPanduan /> },
    ] : []),
  ]

  const tugasSayaGrup: ItemNavGrup | null = !isSuperAdmin && !isOwner ? {
    href: '/tugas-saya',
    label: 'Tugas Saya',
    icon: <IkonDaftar />,
    children: [
      { href: '/tugas-saya', label: 'Daftar' },
      { href: '/tugas-saya?view=kalender', label: 'Kalender' },
    ],
  } : null

  const navAdmin: ItemNav[] = [
    { href: '/admin/karyawan', label: 'Kelola Karyawan', icon: <IkonOrang /> },
    { href: '/admin/divisi', label: 'Kelola Divisi', icon: <IkonPapan /> },
    { href: '/admin/data-terhapus', label: 'Data Terhapus', icon: <IkonSampah /> },
    { href: '/admin/log-sistem', label: 'Log Sistem', icon: <IkonLog /> },
    { href: '/lembur', label: 'Tetapkan Lembur', icon: <IkonJam /> },
    { href: '/admin/lembur', label: 'Review Lembur', icon: <IkonJam /> },
    { href: '/admin/tugas-tersedia', label: 'Tugas Terbuka', icon: <IkonClipboard /> },
  ]

  const navOwner: ItemNav[] = [
    { href: '/admin/karyawan', label: 'Data Karyawan', icon: <IkonOrang /> },
    { href: '/lembur', label: 'Tetapkan Lembur', icon: <IkonJam /> },
    { href: '/admin/lembur', label: 'Review Lembur', icon: <IkonJam /> },
    { href: '/admin/tugas-tersedia', label: 'Tugas Terbuka', icon: <IkonClipboard /> },
    { href: '/admin/log-sistem', label: 'Log Aktivitas', icon: <IkonLog /> },
  ]

  const isi = (
    <>
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div
          title="SukaKerja"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-cream-100 to-white text-maroon-800 shadow-inner border border-cream-200/40 transition-transform hover:scale-105"
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

      <nav className="flex-1 space-y-1 overflow-y-auto px-2.5 pb-4">
        <SeksiNav judul="Menu" collapsed={collapsed} />
        {navUtama.slice(0, 1).map((item) => (
          <ItemSidebar key={item.href} item={item} aktif={pathname === item.href} collapsed={collapsed} />
        ))}
        {tugasSayaGrup && (
          <Suspense fallback={
            <a href={tugasSayaGrup.href} className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-semibold text-cream-200/80 hover:bg-cream-50/10 hover:text-cream-50">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">{tugasSayaGrup.icon}</span>
              {!collapsed && <span className="truncate">{tugasSayaGrup.label}</span>}
            </a>
          }>
            <ItemSidebarGrup grup={tugasSayaGrup} pathname={pathname} collapsed={collapsed} />
          </Suspense>
        )}
        {navUtama.slice(1).map((item) => (
          <ItemSidebar key={item.href} item={item} aktif={pathname === item.href} collapsed={collapsed} />
        ))}

        {data.divisiSaya.length > 0 && (
          <>
            <SeksiNav judul="Divisi" collapsed={collapsed} />
            {data.divisiSaya.map((d) => {
              const href = (isSuperAdmin || isOwner) ? `/divisi/${d.id}/anggota` : `/divisi/${d.id}`
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
          className="group relative mt-1 flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-semibold text-cream-200/70 transition hover:bg-cream-50/10 hover:text-cream-50"
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
        className="relative hidden flex-col bg-gradient-to-b from-maroon-950 to-maroon-800 lg:flex lg:sticky lg:top-0 lg:h-screen"
      >
        {isi}

        {/* Floating toggle tab — vertically centered on right edge */}
        <button
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
          className="absolute -right-4 top-1/2 z-20 hidden -translate-y-1/2 lg:flex h-8 w-8 items-center justify-center rounded-full border border-cream-200/80 bg-white/95 backdrop-blur-sm shadow-md text-maroon-700 hover:bg-maroon-800 hover:text-white transition-all duration-300 hover:scale-110 active:scale-95 outline-none cursor-pointer"
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
    <p className="mb-1 mt-3 px-2.5 text-[10px] font-bold tracking-widest text-cream-200/40">
      {judul.toUpperCase()}
    </p>
  )
}

function ItemSidebarGrup({ grup, pathname, collapsed }: { grup: ItemNavGrup; pathname: string; collapsed: boolean }) {
  const params = useSearchParams()
  const viewParam = params.get('view') ?? ''
  const isAktif = pathname.startsWith(grup.href)
  const [buka, setBuka] = useState(isAktif)

  function isChildAktif(childHref: string) {
    if (childHref.includes('view=kalender')) return pathname === grup.href && viewParam === 'kalender'
    return pathname === grup.href && viewParam !== 'kalender'
  }

  return (
    <div>
      <button
        onClick={() => setBuka((b) => !b)}
        title={collapsed ? grup.label : undefined}
        className={`group relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-semibold transition ${
          isAktif
            ? 'bg-orange-500 text-white'
            : 'text-cream-200/80 hover:bg-cream-50/10 hover:text-cream-50'
        }`}
      >
        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">{grup.icon}</span>
        {!collapsed && (
          <>
            <span className="flex-1 truncate text-left">{grup.label}</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className={`flex-shrink-0 transition-transform duration-200 ${buka ? 'rotate-180' : ''}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </>
        )}
        {collapsed && (
          <span className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded-lg bg-maroon-950 px-2.5 py-1.5 text-xs font-semibold text-cream-50 shadow-lg group-hover:block">
            {grup.label}
          </span>
        )}
      </button>

      {!collapsed && buka && (
        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-cream-50/20 pl-3">
          {grup.children.map((child) => (
            <a
              key={child.href}
              href={child.href}
              className={`flex items-center rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                isChildAktif(child.href)
                  ? 'text-orange-300'
                  : 'text-cream-200/60 hover:bg-cream-50/10 hover:text-cream-50'
              }`}
            >
              {child.label}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

function ItemSidebar({ item, aktif, collapsed }: { item: ItemNav; aktif: boolean; collapsed: boolean }) {
  return (
    <a
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={`group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-semibold transition ${
        aktif
          ? 'bg-orange-500 text-white'
          : 'text-cream-200/80 hover:bg-cream-50/10 hover:text-cream-50'
      }`}
    >
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">{item.icon}</span>
      {!collapsed && <span className="truncate">{item.label}</span>}

      {collapsed && (
        <span className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded-lg bg-maroon-950 px-2.5 py-1.5 text-xs font-semibold text-cream-50 shadow-lg group-hover:block">
          {item.label}
        </span>
      )}
    </a>
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
