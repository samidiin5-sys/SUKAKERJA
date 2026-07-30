'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { keluarkanAnggota, type AnggotaDivisi } from '../actions'

const WARNA_AVATAR = [
  'bg-gradient-to-br from-maroon-800 to-maroon-700 text-cream-50 shadow-sm ring-1 ring-maroon-800/10',
  'bg-gradient-to-br from-indigo-800 to-indigo-700 text-cream-50 shadow-sm ring-1 ring-indigo-800/10',
  'bg-gradient-to-br from-emerald-800 to-emerald-700 text-cream-50 shadow-sm ring-1 ring-emerald-800/10',
  'bg-gradient-to-br from-amber-600 to-amber-500 text-cream-50 shadow-sm ring-1 ring-amber-600/10',
]

function warnaAvatar(nama: string) {
  let hash = 0
  for (let i = 0; i < nama.length; i++) hash = nama.charCodeAt(i) + ((hash << 5) - hash)
  return WARNA_AVATAR[Math.abs(hash) % WARNA_AVATAR.length]
}

export default function DaftarAnggota({
  divisionId,
  daftarAwal,
  bolehKelola,
  bolehMonitor,
}: {
  divisionId: string
  daftarAwal: AnggotaDivisi[]
  bolehKelola: boolean
  bolehMonitor?: boolean
}) {
  const router = useRouter()
  const [sedangProses, setSedangProses] = useState<string | null>(null)

  async function tanganiKeluarkan(e: React.MouseEvent, userId: string, nama: string) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Keluarkan ${nama} dari divisi ini?`)) return
    setSedangProses(userId)
    const hasil = await keluarkanAnggota(divisionId, userId)
    setSedangProses(null)
    if (!hasil.sukses) { alert(hasil.pesan); return }
    router.refresh()
  }

  if (daftarAwal.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-cream-300 bg-white p-10 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cream-100">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-muted">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-muted">Belum ada anggota di divisi ini.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
      {daftarAwal.map((a) => {
        const inisial = a.nama.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
        const avatarKelas = warnaAvatar(a.nama)

        const inner = (
          <div className={`group flex flex-col gap-4 rounded-[22px] border bg-white p-5 shadow-sm transition-all duration-300 ${
            bolehMonitor
              ? 'border-cream-200 hover:-translate-y-1 hover:border-orange-200 hover:shadow-md cursor-pointer'
              : 'border-cream-200'
          }`}>
            {/* Upper row: avatar + info */}
            <div className="flex items-center gap-3.5">
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-sm font-black overflow-hidden ${avatarKelas}`}>
                {a.fotoUrl ? (
                  <img src={a.fotoUrl} alt={a.nama} className="h-full w-full object-cover" />
                ) : inisial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-ink">{a.nama}</p>
                <p className="text-xs font-semibold text-muted">{a.jabatan ?? 'Staff'}</p>
              </div>
            </div>

            {/* Bottom row: action buttons */}
            <div className="flex items-center justify-between border-t border-cream-100/70 pt-3">
              {bolehMonitor ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-orange-600 transition group-hover:gap-2.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 9h6M9 12h6M9 15h4" />
                  </svg>
                  Lihat Ruang Kerja
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="transition-transform group-hover:translate-x-0.5">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </span>
              ) : (
                <span className="text-xs font-bold text-muted">Staff Divisi</span>
              )}

              {bolehKelola && (
                <button
                  onClick={(e) => tanganiKeluarkan(e, a.id, a.nama)}
                  disabled={sedangProses === a.id}
                  className="rounded-xl border border-cream-200 bg-white px-3 py-1.5 text-[10px] font-black text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:opacity-50 active:scale-95"
                >
                  {sedangProses === a.id ? '...' : 'Keluarkan'}
                </button>
              )}
            </div>
          </div>
        )

        return bolehMonitor ? (
          <a key={a.id} href={`/divisi/${divisionId}/anggota/${a.id}`} className="block">
            {inner}
          </a>
        ) : (
          <div key={a.id}>{inner}</div>
        )
      })}
    </div>
  )
}
