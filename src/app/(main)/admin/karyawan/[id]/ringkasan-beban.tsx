'use client'

import { useEffect, useState } from 'react'
import { ambilRingkasanBebanKerja, type RingkasanBeban } from '../actions'

function awalBulanIni(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

function hariIni(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function RingkasanBebanKerja({ userId }: { userId: string }) {
  const [dari, setDari] = useState(awalBulanIni())
  const [sampai, setSampai] = useState(hariIni())
  const [data, setData] = useState<RingkasanBeban | null>(null)
  const [sedangMuat, setSedangMuat] = useState(true)

  useEffect(() => {
    let batal = false
    setSedangMuat(true)
    ambilRingkasanBebanKerja(userId, dari, sampai).then((hasil) => {
      if (batal) return
      setData(hasil)
      setSedangMuat(false)
    })
    return () => {
      batal = true
    }
  }, [userId, dari, sampai])

  return (
    <div className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-bold tracking-widest text-muted">RINGKASAN BEBAN KERJA</h3>
        <div className="flex items-center gap-2 text-xs">
          <input
            type="date"
            value={dari}
            onChange={(e) => setDari(e.target.value)}
            className="rounded-lg border border-cream-200 bg-cream-50 px-2 py-1.5 outline-none focus:border-orange-500"
          />
          <span className="text-muted">s.d.</span>
          <input
            type="date"
            value={sampai}
            onChange={(e) => setSampai(e.target.value)}
            className="rounded-lg border border-cream-200 bg-cream-50 px-2 py-1.5 outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {sedangMuat || !data ? (
        <p className="text-sm text-muted">Memuat...</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-maroon-50 p-3 text-center">
            <p className="text-2xl font-black text-maroon-800">{data.totalAktif}</p>
            <p className="mt-1 text-[11px] font-semibold text-muted">Task Aktif</p>
          </div>
          <div className="rounded-xl bg-orange-50 p-3 text-center">
            <p className="text-2xl font-black text-orange-600">{data.totalSelesai}</p>
            <p className="mt-1 text-[11px] font-semibold text-muted">Selesai (Periode)</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${data.totalTerlambat > 0 ? 'bg-red-50' : 'bg-cream-100'}`}>
            <p className={`text-2xl font-black ${data.totalTerlambat > 0 ? 'text-red-600' : 'text-maroon-800'}`}>
              {data.totalTerlambat}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-muted">Terlambat</p>
          </div>
        </div>
      )}
    </div>
  )
}
