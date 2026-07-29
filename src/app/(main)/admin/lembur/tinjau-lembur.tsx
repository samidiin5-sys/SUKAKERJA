'use client'

import { useState } from 'react'
import { tinjauLembur, type LemburMenunggu } from '@/app/(main)/lembur/actions'

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function TinjauLembur({ daftarAwal }: { daftarAwal: LemburMenunggu[] }) {
  const [daftar, setDaftar] = useState<LemburMenunggu[]>(daftarAwal)
  const [catatanMap, setCatatanMap] = useState<Record<string, string>>({})
  const [sedangProses, setSedangProses] = useState<string | null>(null)

  async function proses(id: string, keputusan: 'disetujui' | 'ditolak') {
    setSedangProses(id)
    const hasil = await tinjauLembur(id, keputusan, catatanMap[id] ?? '')
    setSedangProses(null)
    if (hasil.sukses) {
      setDaftar((prev) => prev.filter((l) => l.id !== id))
    }
  }

  if (daftar.length === 0) {
    return (
      <div className="rounded-2xl border border-cream-200 bg-white p-8 text-center">
        <p className="text-sm text-muted">Tidak ada pengajuan lembur yang menunggu persetujuan.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {daftar.map((l) => (
        <div key={l.id} className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-maroon-800">{l.staffNama}</p>
              <p className="text-xs text-muted">{l.divisiNama}</p>
            </div>
            <span className="rounded-full border border-yellow-200 bg-yellow-100 px-2.5 py-0.5 text-[10px] font-bold text-yellow-700">
              Menunggu
            </span>
          </div>

          <div className="mt-2 text-xs text-muted">
            <p className="font-semibold text-ink">{formatTanggal(l.tanggal)}</p>
            <p>{l.jamMulai} – {l.jamSelesai}</p>
          </div>

          <p className="mt-2 text-xs text-muted">{l.alasan}</p>

          <div className="mt-3">
            <input
              type="text"
              placeholder="Catatan (opsional)"
              value={catatanMap[l.id] ?? ''}
              onChange={(e) => setCatatanMap((prev) => ({ ...prev, [l.id]: e.target.value }))}
              className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-xs outline-none focus:border-orange-500"
            />
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => proses(l.id, 'disetujui')}
              disabled={sedangProses === l.id}
              className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {sedangProses === l.id ? '...' : 'Setujui'}
            </button>
            <button
              onClick={() => proses(l.id, 'ditolak')}
              disabled={sedangProses === l.id}
              className="flex-1 rounded-xl bg-red-600 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {sedangProses === l.id ? '...' : 'Tolak'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
