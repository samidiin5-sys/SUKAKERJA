'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { keluarkanAnggota, type AnggotaDivisi } from '../actions'

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
      <div className="rounded-2xl border border-cream-200 bg-white p-6 text-center">
        <p className="text-sm text-muted">Belum ada anggota di divisi ini.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {daftarAwal.map((a) => {
        const inisial = a.nama.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
        const inner = (
          <div className={`flex items-center gap-3 rounded-2xl border border-cream-200 bg-white p-4 shadow-sm transition ${bolehMonitor ? 'hover:border-orange-300 hover:shadow-md cursor-pointer' : ''}`}>
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-maroon-100 text-sm font-black text-maroon-800">
              {a.fotoUrl ? (
                <img src={a.fotoUrl} alt={a.nama} className="h-10 w-10 rounded-full object-cover" />
              ) : inisial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-ink truncate">{a.nama}</p>
              <p className="text-xs text-muted">{a.jabatan ?? 'Staff'}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {bolehMonitor && (
                <span className="text-[10px] font-semibold text-orange-600 flex items-center gap-1">
                  Lihat Ruang Kerja
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </span>
              )}
              {bolehKelola && (
                <button
                  onClick={(e) => tanganiKeluarkan(e, a.id, a.nama)}
                  disabled={sedangProses === a.id}
                  className="rounded-full border border-cream-200 px-3 py-1 text-xs font-semibold text-red-700 transition hover:border-red-300 disabled:opacity-50"
                >
                  {sedangProses === a.id ? '...' : 'Keluarkan'}
                </button>
              )}
            </div>
          </div>
        )

        return bolehMonitor ? (
          <a key={a.id} href={`/divisi/${divisionId}/anggota/${a.id}`}>
            {inner}
          </a>
        ) : (
          <div key={a.id}>{inner}</div>
        )
      })}
    </div>
  )
}
