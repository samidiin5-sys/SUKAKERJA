'use client'

import { useMemo, useState } from 'react'
import type { TaskHistori } from '../../actions'

const LABEL_PRIORITAS: Record<string, string> = {
  rendah: 'Rendah',
  sedang: 'Sedang',
  tinggi: 'Tinggi',
  mendesak: 'Mendesak',
}

const KELAS_PRIORITAS: Record<string, string> = {
  rendah: 'bg-slate-100 text-slate-700 border-slate-200',
  sedang: 'bg-blue-50 text-blue-700 border-blue-200/60',
  tinggi: 'bg-amber-50 text-amber-700 border-amber-200/60',
  mendesak: 'bg-red-50 text-red-700 border-red-200/60',
}

function formatTanggal(isoString: string): string {
  const d = new Date(isoString)
  const tgl = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  const jam = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':')
  return `${tgl} · ${jam}`
}

function formatTenggat(isoString: string | null): string {
  if (!isoString) return 'Tidak ada'
  const d = new Date(isoString)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function HistoriTugasView({
  historiAwal,
}: {
  historiAwal: TaskHistori[]
}) {
  const [cari, setCari] = useState('')
  const [filterStatus, setFilterStatus] = useState<'semua' | 'tepat' | 'terlambat'>('semua')

  // Olah data tugas & status ketepatan
  const dataTugas = useMemo(() => {
    return historiAwal.map((t) => {
      const terlambat = t.dueDate
        ? new Date(t.completedAt).getTime() > new Date(t.dueDate).getTime()
        : false
      return {
        ...t,
        terlambat,
      }
    })
  }, [historiAwal])

  // Hitung Statistik
  const stats = useMemo(() => {
    const total = dataTugas.length
    const terlambat = dataTugas.filter((t) => t.terlambat).length
    const tepatWaktu = total - terlambat
    const persentaseTepat = total > 0 ? Math.round((tepatWaktu / total) * 100) : 100

    return {
      total,
      terlambat,
      tepatWaktu,
      persentaseTepat,
    }
  }, [dataTugas])

  // Filter tugas
  const tugasTersaring = useMemo(() => {
    return dataTugas.filter((t) => {
      const cocokCari = t.judul.toLowerCase().includes(cari.trim().toLowerCase())
      const cocokStatus =
        filterStatus === 'semua' ||
        (filterStatus === 'tepat' && !t.terlambat) ||
        (filterStatus === 'terlambat' && t.terlambat)
      return cocokCari && cocokStatus
    })
  }, [dataTugas, cari, filterStatus])

  const filterAktif = cari.trim() !== '' || filterStatus !== 'semua'

  return (
    <div className="space-y-6">
      {/* Kartu Ringkasan Statistik */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Total Selesai */}
        <div className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition duration-300">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-maroon-700 text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <p className="text-2xl font-black text-maroon-800">{stats.total}</p>
          <p className="mt-1 text-xs font-semibold text-muted">Total Selesai</p>
        </div>

        {/* Selesai Tepat Waktu */}
        <div className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition duration-300">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <p className="text-2xl font-black text-emerald-600">{stats.tepatWaktu}</p>
          <p className="mt-1 text-xs font-semibold text-muted">Tepat Waktu</p>
        </div>

        {/* Selesai Terlambat */}
        <div className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition duration-300">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-2xl font-black text-rose-600">{stats.terlambat}</p>
          <p className="mt-1 text-xs font-semibold text-muted">Terlambat</p>
        </div>

        {/* Tingkat Ketepatan Waktu */}
        <div className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition duration-300">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <p className="text-2xl font-black text-amber-600">{stats.persentaseTepat}%</p>
          <p className="mt-1 text-xs font-semibold text-muted">Ketepatan Waktu</p>
        </div>
      </div>

      {/* Bar Pencarian & Filter */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-cream-200 bg-white p-3 shadow-sm">
        <input
          type="text"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="Cari tugas berdasarkan judul..."
          className="min-w-0 flex-1 rounded-xl border border-cream-200 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
        />

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="rounded-xl border border-cream-200 bg-cream-50/80 px-3 py-2 text-xs font-bold text-ink outline-none focus:border-orange-500"
        >
          <option value="semua">Semua Status Ketepatan</option>
          <option value="tepat">Tepat Waktu</option>
          <option value="terlambat">Terlambat</option>
        </select>

        {filterAktif && (
          <button
            onClick={() => {
              setCari('')
              setFilterStatus('semua')
            }}
            className="rounded-xl px-3 py-2 text-xs font-bold text-muted transition hover:bg-cream-100"
          >
            Reset
          </button>
        )}
      </div>

      {/* Daftar Tugas Selesai */}
      {tugasTersaring.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cream-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-full bg-cream-100">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <p className="text-sm font-bold text-muted">
            {filterAktif ? 'Tidak ada tugas yang cocok dengan filter pencarian.' : 'Belum ada riwayat tugas selesai.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-cream-100 bg-cream-50/50 text-xs font-bold text-muted">
                  <th className="px-4 py-3.5">Judul Tugas</th>
                  <th className="px-4 py-3.5">Kolom Asal</th>
                  <th className="px-4 py-3.5">Prioritas</th>
                  <th className="px-4 py-3.5">Tenggat Waktu</th>
                  <th className="px-4 py-3.5">Selesai Pada</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Bonus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100/70">
                {tugasTersaring.map((t) => (
                  <tr key={t.id} className="hover:bg-cream-50/20 transition-all duration-150">
                    {/* Judul */}
                    <td className="px-4 py-3.5 font-bold text-ink">
                      <a href={`?task=${t.id}`} className="hover:text-orange-600 hover:underline transition">
                        {t.judul}
                      </a>
                    </td>

                    {/* Kolom Asal */}
                    <td className="px-4 py-3.5 text-xs font-medium text-muted">
                      {t.boardNama}
                    </td>

                    {/* Prioritas */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${KELAS_PRIORITAS[t.prioritas] || KELAS_PRIORITAS.rendah}`}>
                        {LABEL_PRIORITAS[t.prioritas] || t.prioritas}
                      </span>
                    </td>

                    {/* Tenggat */}
                    <td className="px-4 py-3.5 text-xs text-ink font-semibold">
                      {t.dueDate ? (
                        formatTenggat(t.dueDate)
                      ) : (
                        <span className="text-muted font-normal">-</span>
                      )}
                    </td>

                    {/* Selesai Pada */}
                    <td className="px-4 py-3.5 text-xs text-ink font-semibold">
                      {formatTanggal(t.completedAt)}
                    </td>

                    {/* Status Ketepatan */}
                    <td className="px-4 py-3.5">
                      {t.terlambat ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200/60 px-2 py-0.5 text-[10px] font-extrabold text-rose-700 uppercase">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                          Terlambat
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 uppercase">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                          Tepat Waktu
                        </span>
                      )}
                    </td>

                    {/* Bonus */}
                    <td className="px-4 py-3.5 text-right font-black text-xs text-emerald-600">
                      {t.hasBonus && t.bonusAmount > 0 ? (
                        `+Rp ${t.bonusAmount.toLocaleString('id-ID')}`
                      ) : (
                        <span className="text-muted font-normal">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
