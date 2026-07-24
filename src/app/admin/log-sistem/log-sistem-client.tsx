'use client'

import { useState, useTransition } from 'react'
import { ambilLogSistem, eksporLogCSV, type LogEntry, type FilterLog } from './actions'
import type { Divisi } from '@/app/admin/divisi/actions'

function formatWaktu(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getBadgexAksi(jenis: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    task_dibuat: { bg: 'bg-green-50 text-green-700 border-green-200/40', label: 'Tugas Baru', text: '' },
    task_diubah: { bg: 'bg-blue-50 text-blue-700 border-blue-200/40', label: 'Tugas Diubah', text: '' },
    task_dipindah: { bg: 'bg-orange-50 text-orange-700 border-orange-200/40', label: 'Pindah Board', text: '' },
    task_diurutkan: { bg: 'bg-cream-100 text-muted/80 border-cream-200/20', label: 'Urutkan Task', text: '' },
    task_selesai: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/40', label: 'Selesai', text: '' },
    task_dihapus: { bg: 'bg-red-50 text-red-700 border-red-200/40', label: 'Hapus Task', text: '' },
    komentar_ditambah: { bg: 'bg-purple-50 text-purple-700 border-purple-200/40', label: 'Komentar', text: '' },
    komentar_dihapus: { bg: 'bg-red-50/50 text-red-600/80 border-red-200/20', label: 'Komentar Dihapus', text: '' },
    karyawan_dibuat: { bg: 'bg-maroon-50 text-maroon-800 border-maroon-100/30', label: 'Tambah Karyawan', text: '' },
    karyawan_dinonaktifkan: { bg: 'bg-red-100 text-red-800 border-red-200/30', label: 'Nonaktif Karyawan', text: '' },
    karyawan_diaktifkan: { bg: 'bg-green-100 text-green-800 border-green-200/30', label: 'Aktif Karyawan', text: '' },
    karyawan_dihapus: { bg: 'bg-red-200 text-red-900 border-red-300/40', label: 'Hapus Karyawan', text: '' },
    divisi_dibuat: { bg: 'bg-maroon-50 text-maroon-700 border-maroon-100/30', label: 'Buat Divisi', text: '' },
    lampiran_ditambah: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/40', label: 'Unggah File', text: '' },
    lampiran_dihapus: { bg: 'bg-red-50/70 text-red-700/80 border-red-200/20', label: 'Hapus File', text: '' },
    user_reactivated: { bg: 'bg-green-50 text-green-700 border-green-200/40', label: 'Akun Aktif', text: '' }
  }

  const match = map[jenis]
  if (!match) return <span className="rounded border border-cream-200/30 bg-cream-50 px-2 py-0.5 text-[9px] font-bold text-muted uppercase">{jenis}</span>
  return (
    <span className={`rounded border px-2 py-0.5 text-[9px] font-bold uppercase ${match.bg}`}>
      {match.label}
    </span>
  )
}

export default function LogSistemClient({
  entriesAwal,
  totalAwal,
  divisiList,
}: {
  entriesAwal: LogEntry[]
  totalAwal: number
  divisiList: Divisi[]
}) {
  const [entries, setEntries] = useState(entriesAwal)
  const [total, setTotal] = useState(totalAwal)
  const [halaman, setHalaman] = useState(1)
  const [filter, setFilter] = useState<FilterLog>({})
  const [sedangEkspor, setSedangEkspor] = useState(false)
  const [isPending, startTransition] = useTransition()

  function terapkanFilter(filterBaru: FilterLog) {
    const f = { ...filterBaru, halaman: 1 }
    setFilter(f)
    setHalaman(1)
    startTransition(async () => {
      const hasil = await ambilLogSistem(f)
      setEntries(hasil.entries)
      setTotal(hasil.total)
    })
  }

  function gantiHalaman(h: number) {
    const f = { ...filter, halaman: h }
    setHalaman(h)
    startTransition(async () => {
      const hasil = await ambilLogSistem(f)
      setEntries(hasil.entries)
      setTotal(hasil.total)
    })
  }

  async function tanganiEkspor() {
    setSedangEkspor(true)
    const hasil = await eksporLogCSV(filter)
    setSedangEkspor(false)
    if (!hasil.sukses) { alert(hasil.pesan); return }
    const blob = new Blob([hasil.csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `log-sistem-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalHalaman = Math.ceil(total / 50)

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Filter Panel */}
      <div className="rounded-3xl border border-cream-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari user..."
              className="w-full rounded-xl border border-cream-200 bg-cream-50/40 px-3.5 py-2.5 pl-9 text-xs font-semibold text-ink placeholder-muted/65 outline-none focus:border-maroon-800 focus:ring-2 focus:ring-maroon-800/10 transition"
              onChange={(e) => terapkanFilter({ ...filter, actorNama: e.target.value || undefined })}
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/60" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Jenis aktivitas..."
              className="w-full rounded-xl border border-cream-200 bg-cream-50/40 px-3.5 py-2.5 pl-9 text-xs font-semibold text-ink placeholder-muted/65 outline-none focus:border-maroon-800 focus:ring-2 focus:ring-maroon-800/10 transition"
              onChange={(e) => terapkanFilter({ ...filter, jenisAktivitas: e.target.value || undefined })}
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/60" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </div>

          <select
            className="w-full rounded-xl border border-cream-200 bg-cream-50/40 px-3 py-2.5 text-xs font-bold text-ink outline-none focus:border-maroon-800 cursor-pointer"
            onChange={(e) => terapkanFilter({ ...filter, divisionId: e.target.value || undefined })}
          >
            <option value="">Semua Divisi</option>
            {divisiList.map((d) => (
              <option key={d.id} value={d.id}>{d.nama}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <input
              type="date"
              className="w-full rounded-xl border border-cream-200 bg-cream-50/40 px-3 py-2 text-xs font-bold text-ink outline-none focus:border-maroon-800"
              onChange={(e) => terapkanFilter({ ...filter, dari: e.target.value || undefined })}
            />
            <span className="text-xs font-bold text-muted">s.d.</span>
            <input
              type="date"
              className="w-full rounded-xl border border-cream-200 bg-cream-50/40 px-3 py-2 text-xs font-bold text-ink outline-none focus:border-maroon-800"
              onChange={(e) => terapkanFilter({ ...filter, sampai: e.target.value || undefined })}
            />
          </div>

          <button
            onClick={tanganiEkspor}
            disabled={sedangEkspor}
            className="rounded-xl border border-maroon-200 bg-cream-50/30 px-4 py-2 text-xs font-bold text-maroon-700 hover:border-maroon-800 hover:text-maroon-900 hover:bg-cream-50 transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm flex items-center justify-center gap-1.5 h-full w-full sm:col-span-2 lg:col-span-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>{sedangEkspor ? 'Mengekspor...' : 'Ekspor CSV'}</span>
          </button>
        </div>
      </div>

      {/* Table Panel */}
      <div className="overflow-hidden rounded-3xl border border-cream-200/60 bg-white shadow-sm">
        {isPending ? (
          <div className="p-10 flex flex-col items-center justify-center gap-3">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-maroon-800 border-t-transparent" />
            <p className="text-xs font-bold text-muted">Memproses penyaringan data...</p>
          </div>
        ) : entries.length === 0 ? (
          <p className="p-8 text-center text-sm font-semibold text-muted">Tidak ada log aktivitas sistem.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-cream-100 bg-cream-50/40">
                  <th className="px-4 py-3.5 text-[9px] font-extrabold tracking-wider text-muted uppercase">WAKTU</th>
                  <th className="px-4 py-3.5 text-[9px] font-extrabold tracking-wider text-muted uppercase">USER</th>
                  <th className="px-4 py-3.5 text-[9px] font-extrabold tracking-wider text-muted uppercase">AKSI</th>
                  <th className="px-4 py-3.5 text-[9px] font-extrabold tracking-wider text-muted uppercase">ENTITAS</th>
                  <th className="px-4 py-3.5 text-[9px] font-extrabold tracking-wider text-muted uppercase">DIVISI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100 text-xs">
                {entries.map((e) => (
                  <tr key={e.id} className="hover:bg-cream-50/20 transition duration-150">
                    <td className="px-4 py-3 text-muted/80 font-medium whitespace-nowrap">{formatWaktu(e.createdAt)}</td>
                    <td className="px-4 py-3 font-bold text-ink whitespace-nowrap">{e.actorNama}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{getBadgexAksi(e.jenisAktivitas)}</td>
                    <td className="px-4 py-3 font-medium text-ink/80 max-w-xs truncate">
                      <span className="text-[10px] font-extrabold text-muted uppercase mr-1">{e.objekTipe}:</span>
                      {e.objekNama}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {e.divisiNama ? (
                        <span className="rounded bg-cream-100/70 border border-cream-200/20 px-2 py-0.5 text-[10px] font-bold text-muted">
                          {e.divisiNama}
                        </span>
                      ) : (
                        <span className="text-muted/40 italic">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalHalaman > 1 && (
        <div className="flex items-center justify-between text-xs font-semibold px-1">
          <p className="text-muted">Total {total} entri log</p>
          <div className="flex gap-2">
            <button
              disabled={halaman <= 1}
              onClick={() => gantiHalaman(halaman - 1)}
              className="rounded-xl border border-cream-200 bg-white px-3.5 py-2 font-bold text-maroon-700 transition hover:bg-cream-50 active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              &larr; Prev
            </button>
            <span className="px-3 py-2 text-muted">Hal. {halaman} / {totalHalaman}</span>
            <button
              disabled={halaman >= totalHalaman}
              onClick={() => gantiHalaman(halaman + 1)}
              className="rounded-xl border border-cream-200 bg-white px-3.5 py-2 font-bold text-maroon-700 transition hover:bg-cream-50 active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              Next &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
