'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { keluarkanAnggota, type AnggotaDivisi } from '../actions'

const LABEL_ROLE: Record<string, string> = {
  staff: 'Staff',
}

export default function DaftarAnggota({
  divisionId,
  daftarAwal,
  bolehKelola,
}: {
  divisionId: string
  daftarAwal: AnggotaDivisi[]
  bolehKelola: boolean
}) {
  const router = useRouter()
  const [sedangProses, setSedangProses] = useState<string | null>(null)

  async function tanganiKeluarkan(userId: string, nama: string) {
    if (!confirm(`Keluarkan ${nama} dari divisi ini?`)) return

    setSedangProses(userId)
    const hasil = await keluarkanAnggota(divisionId, userId)
    setSedangProses(null)

    if (!hasil.sukses) {
      alert(hasil.pesan)
      return
    }
    router.refresh()
  }

  if (daftarAwal.length === 0) {
    return <p className="text-sm text-muted">Belum ada anggota.</p>
  }

  return (
    <ul className="divide-y divide-cream-200 overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm">
      {daftarAwal.map((a) => (
        <li key={a.id} className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-bold text-ink">{a.nama}</p>
            <p className="text-xs text-muted">
              {a.jabatan ?? '-'} &middot; {LABEL_ROLE[a.role] ?? a.role}
            </p>
          </div>
          {bolehKelola && (
            <button
              onClick={() => tanganiKeluarkan(a.id, a.nama)}
              disabled={sedangProses === a.id}
              className="rounded-full border border-cream-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:border-red-300 disabled:opacity-50"
            >
              {sedangProses === a.id ? 'Memproses...' : 'Keluarkan'}
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
