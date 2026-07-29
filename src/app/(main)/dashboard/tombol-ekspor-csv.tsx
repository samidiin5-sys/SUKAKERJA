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
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-cream-200 bg-white p-3 shadow-sm">
      <p className="text-xs font-bold text-muted mr-1">Ekspor Rekap:</p>
      <input
        type="date"
        value={dari}
        onChange={(e) => setDari(e.target.value)}
        className="rounded-lg border border-cream-200 bg-cream-50 px-2.5 py-1.5 text-xs outline-none focus:border-orange-500"
      />
      <span className="text-xs text-muted">s/d</span>
      <input
        type="date"
        value={sampai}
        onChange={(e) => setSampai(e.target.value)}
        className="rounded-lg border border-cream-200 bg-cream-50 px-2.5 py-1.5 text-xs outline-none focus:border-orange-500"
      />
      <button
        onClick={tanganiEkspor}
        disabled={sedang}
        className="rounded-lg bg-maroon-800 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-maroon-700 disabled:opacity-50 transition"
      >
        {sedang ? 'Mengekspor...' : '↓ Ekspor CSV'}
      </button>
    </div>
  )
}
