'use client'

import { useState } from 'react'
import { eksporRekapCSV } from './actions'

export default function TombolEksporCSV() {
  const [dari, setDari] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().slice(0, 10)
  })
  const [sampai, setSampai] = useState(() => new Date().toISOString().slice(0, 10))
  const [sedang, setSedang] = useState(false)

  async function tanganiEkspor() {
    setSedang(true)
    const hasil = await eksporRekapCSV(dari, sampai)
    setSedang(false)
    if (!hasil.sukses) { alert(hasil.pesan); return }
    const blob = new Blob([hasil.csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rekap-tugas-${sampai}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-[24px] border border-cream-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-maroon-50 text-maroon-700">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
        <p className="text-xs font-bold text-ink">Ekspor Rekap Laporan</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
        <input
          type="date"
          value={dari}
          onChange={(e) => setDari(e.target.value)}
          className="rounded-xl border border-cream-200 bg-cream-50/50 px-3 py-2 text-xs font-bold text-ink outline-none focus:border-maroon-800 focus:bg-white transition-all shadow-inner"
        />
        <span className="text-xs font-bold text-muted">s/d</span>
        <input
          type="date"
          value={sampai}
          onChange={(e) => setSampai(e.target.value)}
          className="rounded-xl border border-cream-200 bg-cream-50/50 px-3 py-2 text-xs font-bold text-ink outline-none focus:border-maroon-800 focus:bg-white transition-all shadow-inner"
        />
        <button
          onClick={tanganiEkspor}
          disabled={sedang}
          className="rounded-xl bg-maroon-800 px-4 py-2 text-xs font-bold text-cream-50 hover:bg-maroon-900 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all shadow-md shadow-maroon-800/10"
        >
          {sedang ? 'Mengekspor...' : 'Unduh CSV'}
        </button>
      </div>
    </div>
  )
}
