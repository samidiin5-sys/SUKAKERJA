'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { DataShell } from '@/lib/shell-data'
import NotifikasiBell from './notifikasi-bell'

function judulHalaman(pathname: string): string {
  if (pathname === '/dashboard') return 'Dashboard'
  if (pathname === '/tugas-saya') return 'Tugas Saya'
  if (pathname === '/ganti-password') return 'Ganti Password'
  if (pathname === '/profil') return 'Profil Saya'
  if (pathname === '/admin/karyawan') return 'Kelola Karyawan'
  if (pathname === '/admin/divisi') return 'Kelola Divisi'
  if (pathname === '/admin/data-terhapus') return 'Data Terhapus'
  if (pathname === '/admin/log-sistem') return 'Log Sistem'
  if (pathname.match(/^\/divisi\/[^/]+\/anggota\/[^/]+$/)) return 'Ruang Kerja Staff'
  if (pathname.match(/^\/divisi\/[^/]+\/anggota$/)) return 'Anggota Divisi'
  if (pathname.match(/^\/divisi\/[^/]+\/tugas-rutin$/)) return 'Tugas Rutin'
  if (pathname.match(/^\/divisi\/[^/]+\/target$/)) return 'Target & Realisasi'
  if (pathname.match(/^\/divisi\/[^/]+$/)) return 'Papan Divisi'
  return 'SukaKerja'
}


function inisial(nama: string) {
  return nama
    .split(' ')
    .map((k) => k[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function Navbar({
  data,
  onOpenMobile,
  collapsed,
  onToggleCollapse,
}: {
  data: DataShell
  onOpenMobile: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  async function tanganiLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-cream-200/80 bg-white/90 px-4 py-3 shadow-[0_1px_0_rgba(15,23,42,0.03),0_18px_40px_rgba(92,31,33,0.05)] backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="flex h-9 w-9 items-center justify-center rounded-[14px] border border-transparent text-maroon-800 transition hover:border-cream-200 hover:bg-cream-50 lg:hidden"
          aria-label="Buka menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {/* Desktop sidebar toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden h-9 w-9 items-center justify-center rounded-[14px] border border-transparent text-maroon-800 transition hover:border-cream-200 hover:bg-cream-50 lg:flex"
          aria-label={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
          title={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M9 3v18"/>
          </svg>
        </button>
        <div className="flex items-center gap-2 rounded-full border border-cream-200 bg-gradient-to-r from-cream-50 to-white px-2.5 py-1 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-orange-500" />
          <h1 className="text-sm font-black text-maroon-800 sm:text-base">{judulHalaman(pathname)}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <NotifikasiBell />
        
        {/* Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(prev => !prev)}
            aria-haspopup="true"
            aria-expanded={profileOpen}
            className="flex items-center gap-2.5 rounded-[18px] border border-transparent px-1.5 py-1.5 transition hover:border-cream-200 hover:bg-cream-50 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <div className="hidden text-right sm:block">
              <p className="text-xs font-bold leading-tight text-ink">{data.nama}</p>
              <p className="text-[10px] leading-tight text-muted">
                {data.roleSistem === 'super_admin'
                  ? 'Super Admin'
                  : data.roleSistem === 'owner'
                  ? 'Owner'
                  : data.jabatan ?? 'Staff'}
              </p>
            </div>
            <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-maroon-800 to-maroon-700 text-xs font-black text-cream-50 shadow-[0_8px_20px_rgba(92,31,33,0.2)]">
              {data.fotoUrl ? (
                <Image
                  src={data.fotoUrl}
                  alt={data.nama}
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              ) : (
                inisial(data.nama)
              )}
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 z-40 mt-2 w-48 overflow-hidden rounded-[20px] border border-cream-200 bg-white shadow-[0_20px_45px_rgba(92,31,33,0.12)] animate-in fade-in slide-in-from-top-1 duration-100">
              <div className="border-b border-cream-100 px-4 py-3 sm:hidden">
                <p className="text-xs font-bold text-ink truncate">{data.nama}</p>
                <p className="text-[10px] text-muted">
                  {data.roleSistem === 'super_admin'
                    ? 'Super Admin'
                    : data.roleSistem === 'owner'
                    ? 'Owner'
                    : data.jabatan ?? 'Staff'}
                </p>
              </div>
              <div className="p-1.5">
                <Link
                  href="/profil"
                  onClick={() => setProfileOpen(false)}
                  className="flex w-full items-center rounded-[12px] px-3 py-2 text-xs font-semibold text-ink transition hover:bg-cream-50"
                >
                  Profil Saya
                </Link>
                <Link
                  href="/ganti-password"
                  onClick={() => setProfileOpen(false)}
                  className="flex w-full items-center rounded-[12px] px-3 py-2 text-xs font-semibold text-ink transition hover:bg-cream-50"
                >
                  Ganti Password
                </Link>
                <div className="my-1 border-t border-cream-100" />
                <button
                  onClick={() => {
                    setProfileOpen(false)
                    tanganiLogout()
                  }}
                  className="flex w-full items-center px-3 py-2 text-xs font-bold text-red-600 rounded-[12px] hover:bg-red-50 transition cursor-pointer text-left"
                >
                  Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
