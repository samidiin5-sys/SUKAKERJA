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
    <div className="mx-auto max-w-2xl">
      {tugasAwal.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-cream-200 bg-white p-3 shadow-sm">
          <input
            type="text"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari task..."
            className="min-w-0 flex-1 rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-orange-500"
          />
          <select
            value={filterPrioritas}
            onChange={(e) => setFilterPrioritas(e.target.value)}
            className="rounded-lg border border-cream-200 bg-cream-50 px-2 py-2 text-xs outline-none focus:border-orange-500"
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
              className="rounded-lg border border-cream-200 bg-cream-50 px-2 py-2 text-xs outline-none focus:border-orange-500"
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
              className="rounded-lg px-3 py-2 text-xs font-semibold text-muted hover:bg-cream-100"
            >
              Reset
            </button>
          )}
        </div>
      )}

      {tugasAwal.length === 0 && (
        <div className="rounded-2xl border border-dashed border-cream-200 bg-white p-8 text-center">
          <p className="text-sm text-muted">
            Belum ada tugas yang ditugaskan kepada Anda. Buka papan divisi untuk membuat task baru.
          </p>
        </div>
      )}

      {tugasAwal.length > 0 && tugasTersaring.length === 0 && (
        <div className="rounded-2xl border border-dashed border-cream-200 bg-white p-8 text-center">
          <p className="text-sm text-muted">Tidak ada task yang cocok dengan pencarian/filter.</p>
        </div>
      )}

      <div className="space-y-6">
        {seksi.map(
          (s) =>
            kelompok[s.kunci].length > 0 && (
              <div key={s.kunci}>
                <h2 className={`mb-2 text-xs font-bold tracking-widest ${s.warna}`}>
                  {s.judul.toUpperCase()} ({kelompok[s.kunci].length})
                </h2>
                <ul className="space-y-2">
                  {kelompok[s.kunci].map((t) => (
                    <li key={t.id}>
                      <a
                        href={`/divisi/${t.divisiId}`}
                        className="flex items-center justify-between rounded-xl border border-cream-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div>
                          <p className="text-sm font-bold text-ink">{t.judul}</p>
                          <p className="text-xs text-muted">
                            {t.divisiNama} &middot; {t.boardNama}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-maroon-700">
                            Ditugaskan oleh {t.ditugaskanOleh}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="rounded-full bg-orange-400/20 px-2 py-0.5 text-[10px] font-bold text-orange-800">
                            {LABEL_PRIORITAS[t.prioritas] ?? t.prioritas}
                          </span>
                          {t.dueDate && (
                            <p className="mt-1 text-xs text-muted">
                              {new Date(t.dueDate).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </p>
                          )}
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )
        )}
      </div>
    </div>
  )
}
