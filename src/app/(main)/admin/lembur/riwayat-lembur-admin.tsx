'use client'

import { useState, useTransition } from 'react'
import { ambilRiwayatLemburAdmin, type RiwayatLemburAdminItem } from '@/app/(main)/lembur/actions'

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

type Props = {
  karyawanAktif: { id: string; nama: string }[]
  riwayatAwal: RiwayatLemburAdminItem[]
}

export default function RiwayatLemburAdmin({ karyawanAktif, riwayatAwal }: Props) {
  const [riwayat, setRiwayat] = useState<RiwayatLemburAdminItem[]>(riwayatAwal)
  const [filterStaff, setFilterStaff] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isPending, startTransition] = useTransition()

  function handleFilterChange(staffId: string, status: string) {
    setFilterStaff(staffId)
    setFilterStatus(status)

    startTransition(async () => {
      const data = await ambilRiwayatLemburAdmin({ staffId, status })
      setRiwayat(data)
    })
  }

  return (
    <div className="space-y-4">
      {/* Filter Section */}
      <div className="flex flex-wrap gap-2.5 rounded-2xl border border-cream-200 bg-white/80 p-3 shadow-sm">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1 px-1">
            Filter Staff
          </label>
          <select
            value={filterStaff}
            onChange={(e) => handleFilterChange(e.target.value, filterStatus)}
            className="w-full rounded-xl border border-cream-200 bg-white px-3 py-2 text-xs font-bold text-ink outline-none focus:border-maroon-800 transition cursor-pointer"
          >
            <option value="all">Semua Staff</option>
            {karyawanAktif.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </select>
        </div>

        <div className="w-[150px]">
          <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1 px-1">
            Filter Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => handleFilterChange(filterStaff, e.target.value)}
            className="w-full rounded-xl border border-cream-200 bg-white px-3 py-2 text-xs font-bold text-ink outline-none focus:border-maroon-800 transition cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="menunggu">Menunggu</option>
            <option value="disetujui">Disetujui</option>
            <option value="ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      {/* Loading Indicator */}
      {isPending ? (
        <div className="py-12 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-maroon-800 border-r-transparent align-[-0.125em]" />
          <p className="mt-2 text-xs font-semibold text-muted">Memuat data...</p>
        </div>
      ) : riwayat.length === 0 ? (
        <div className="rounded-2xl border border-cream-200 bg-white p-8 text-center">
          <p className="text-sm text-muted">Tidak ada riwayat lembur yang sesuai filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {riwayat.map((l) => (
            <div
              key={l.id}
              className="rounded-[22px] border border-cream-200 bg-white/95 p-4 shadow-sm transition hover:border-maroon-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-maroon-800">{l.staffNama}</p>
                  <p className="text-[11px] font-semibold text-muted">{l.divisiNama}</p>
                  <p className="mt-1 text-xs text-ink/80 font-medium">
                    {formatTanggal(l.tanggal)} · {l.jamMulai} – {l.jamSelesai}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${BADGE[l.status]}`}>
                  {LABEL[l.status]}
                </span>
              </div>

              <p className="mt-2 text-xs text-muted leading-relaxed">{l.alasan}</p>

              {l.catatanOwner && (
                <div
                  className={`mt-2 rounded-lg border px-3 py-2 text-xs ${
                    l.status === 'ditolak'
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : 'border-cream-200 bg-cream-50 text-muted'
                  }`}
                >
                  <span className="font-semibold">Catatan: </span>
                  {l.catatanOwner}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
