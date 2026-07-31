'use client'

import { useMemo, useState } from 'react'
import type { TugasSaya } from './actions'

const LABEL_PRIORITAS: Record<string, string> = {
  rendah: 'Rendah',
  sedang: 'Sedang',
  tinggi: 'Tinggi',
  mendesak: 'Mendesak',
}

function kelompokkan(tugas: TugasSaya[]) {
  const sekarang = new Date()
  const awalHariIni = new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate())
  const akhirHariIni = new Date(awalHariIni.getTime() + 24 * 60 * 60 * 1000)
  const akhirMingguIni = new Date(awalHariIni.getTime() + 7 * 24 * 60 * 60 * 1000)

  const kelompok: Record<'terlambat' | 'hariIni' | 'mingguIni' | 'nanti', TugasSaya[]> = {
    terlambat: [],
    hariIni: [],
    mingguIni: [],
    nanti: [],
  }

  for (const t of tugas) {
    if (!t.dueDate) {
      kelompok.nanti.push(t)
      continue
    }
    const due = new Date(t.dueDate)
    if (due < awalHariIni) kelompok.terlambat.push(t)
    else if (due < akhirHariIni) kelompok.hariIni.push(t)
    else if (due < akhirMingguIni) kelompok.mingguIni.push(t)
    else kelompok.nanti.push(t)
  }

  return kelompok
}

export default function DaftarTugasSaya({ tugasAwal }: { tugasAwal: TugasSaya[] }) {
  const [cari, setCari] = useState('')
  const [filterPrioritas, setFilterPrioritas] = useState('semua')
  const [filterDivisi, setFilterDivisi] = useState('semua')

  const divisiUnik = useMemo(() => {
    const map = new Map<string, string>()
    tugasAwal.forEach((t) => map.set(t.divisiId, t.divisiNama))
    return [...map.entries()]
  }, [tugasAwal])

  const filterAktif = cari.trim() !== '' || filterPrioritas !== 'semua' || filterDivisi !== 'semua'

  const tugasTersaring = useMemo(() => {
    return tugasAwal.filter((t) => {
      if (cari.trim() && !t.judul.toLowerCase().includes(cari.trim().toLowerCase())) return false
      if (filterPrioritas !== 'semua' && t.prioritas !== filterPrioritas) return false
      if (filterDivisi !== 'semua' && t.divisiId !== filterDivisi) return false
      return true
    })
  }, [tugasAwal, cari, filterPrioritas, filterDivisi])

  const kelompok = kelompokkan(tugasTersaring)

  const seksi: { kunci: keyof typeof kelompok; judul: string; warna: string }[] = [
    { kunci: 'terlambat', judul: 'Terlambat', warna: 'text-red-700' },
    { kunci: 'hariIni', judul: 'Hari Ini', warna: 'text-maroon-800' },
    { kunci: 'mingguIni', judul: 'Minggu Ini', warna: 'text-maroon-700' },
    { kunci: 'nanti', judul: 'Nanti', warna: 'text-muted' },
  ]

  return (
    <div className="mx-auto max-w-3xl">
      {tugasAwal.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-[26px] border border-cream-200 bg-gradient-to-r from-white to-cream-50/80 p-3 shadow-[0_12px_40px_rgba(92,31,33,0.05)]">
          <input
            type="text"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari task..."
            className="min-w-0 flex-1 rounded-[16px] border border-cream-200 bg-white px-3 py-2 text-sm text-ink shadow-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />
          <select
            value={filterPrioritas}
            onChange={(e) => setFilterPrioritas(e.target.value)}
            className="rounded-[12px] border border-cream-200 bg-cream-50/80 px-2 py-2 text-xs text-ink shadow-sm outline-none focus:border-orange-500"
          >
            <option value="semua">Semua Prioritas</option>
            {Object.entries(LABEL_PRIORITAS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          {divisiUnik.length > 1 && (
            <select
              value={filterDivisi}
              onChange={(e) => setFilterDivisi(e.target.value)}
              className="rounded-[12px] border border-cream-200 bg-cream-50/80 px-2 py-2 text-xs text-ink shadow-sm outline-none focus:border-orange-500"
            >
              <option value="semua">Semua Divisi</option>
              {divisiUnik.map(([id, nama]) => (
                <option key={id} value={id}>
                  {nama}
                </option>
              ))}
            </select>
          )}
          {filterAktif && (
            <button
              onClick={() => {
                setCari('')
                setFilterPrioritas('semua')
                setFilterDivisi('semua')
              }}
              className="rounded-[12px] px-3 py-2 text-xs font-semibold text-muted transition hover:bg-cream-100"
            >
              Reset
            </button>
          )}
        </div>
      )}

      {tugasAwal.length === 0 && (
        <div className="rounded-[24px] border border-dashed border-cream-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-muted">
            Belum ada tugas yang ditugaskan kepada Anda. Buka papan divisi untuk membuat task baru.
          </p>
        </div>
      )}

      {tugasAwal.length > 0 && tugasTersaring.length === 0 && (
        <div className="rounded-[24px] border border-dashed border-cream-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-muted">Tidak ada task yang cocok dengan pencarian/filter.</p>
        </div>
      )}

      <div className="space-y-5">
        {seksi.map(
          (s) =>
            kelompok[s.kunci].length > 0 && (
              <div key={s.kunci}>
                <h2 className={`mb-2 text-[11px] font-bold tracking-widest uppercase ${s.warna}`}>
                  {s.judul} ({kelompok[s.kunci].length})
                </h2>
                <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm">
                  {kelompok[s.kunci].map((t, i) => {
                    const isLast = i === kelompok[s.kunci].length - 1
                    const warnaPrioritas: Record<string, string> = {
                      mendesak: 'bg-red-100 text-red-700',
                      tinggi: 'bg-orange-100 text-orange-700',
                      sedang: 'bg-yellow-100 text-yellow-700',
                      rendah: 'bg-green-100 text-green-700',
                    }
                    return (
                      <a
                        key={t.id}
                        href={`/divisi/${t.divisiId}?task=${t.id}`}
                        className={`group flex items-center gap-3 px-4 py-3 transition hover:bg-cream-50/80 ${!isLast ? 'border-b border-cream-100' : ''}`}
                      >
                        {/* Dot status */}
                        <span className={`h-2 w-2 shrink-0 rounded-full ${
                          s.kunci === 'terlambat' ? 'bg-red-500' :
                          s.kunci === 'hariIni'   ? 'bg-orange-400' :
                          s.kunci === 'mingguIni' ? 'bg-yellow-400' :
                                                    'bg-slate-300'
                        }`} />

                        {/* Judul + meta */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink group-hover:text-maroon-800">
                            {t.judul}
                          </p>
                          <p className="truncate text-[11px] text-muted">
                            {t.divisiNama} · {t.boardNama}
                          </p>
                        </div>

                        {/* Badge prioritas + deadline */}
                        <div className="flex shrink-0 items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${warnaPrioritas[t.prioritas] ?? 'bg-slate-100 text-slate-600'}`}>
                            {LABEL_PRIORITAS[t.prioritas] ?? t.prioritas}
                          </span>
                          {t.dueDate && (
                            <span className="text-[11px] font-medium text-muted">
                              {new Date(t.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                          {/* Arrow */}
                          <svg className="h-3.5 w-3.5 text-muted/40 group-hover:text-maroon-400 transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </div>
                      </a>
                    )
                  })}
                </div>
              </div>
            )
        )}
      </div>
    </div>
  )
}
