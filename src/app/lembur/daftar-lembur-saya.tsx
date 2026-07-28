'use client'

import { useState } from 'react'
import type { LemburSaya } from './actions'

const BADGE: Record<string, string> = {
  menunggu: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  disetujui: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  ditolak: 'bg-red-100 text-red-700 border-red-200',
}
const LABEL: Record<string, string> = {
  menunggu: 'Menunggu',
  disetujui: 'Disetujui',
  ditolak: 'Ditolak',
}

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function DaftarLemburSaya({ daftarAwal }: { daftarAwal: LemburSaya[] }) {
  const [daftar] = useState<LemburSaya[]>(daftarAwal)

  if (daftar.length === 0) {
    return (
      <div className="rounded-2xl border border-cream-200 bg-white p-6 text-center">
        <p className="text-sm text-muted">Belum ada pengajuan lembur.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {daftar.map((l) => (
        <div key={l.id} className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-maroon-800">{l.divisiNama}</p>
              <p className="text-xs text-muted">{formatTanggal(l.tanggal)} · {l.jamMulai} – {l.jamSelesai}</p>
            </div>
            <span className={`flex-shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${BADGE[l.status]}`}>
              {LABEL[l.status]}
            </span>
          </div>

          <p className="mt-2 text-xs text-muted">{l.alasan}</p>

          {l.catatanOwner && (
            <div className={`mt-2 rounded-lg border px-3 py-2 text-xs ${l.status === 'ditolak' ? 'border-red-200 bg-red-50 text-red-700' : 'border-cream-200 bg-cream-50 text-muted'}`}>
              <span className="font-semibold">Catatan: </span>{l.catatanOwner}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
