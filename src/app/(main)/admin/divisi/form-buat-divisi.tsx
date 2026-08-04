'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { buatDivisi } from './actions'

const WARNA_PILIHAN = ['#7a2b1c', '#c9711f', '#2f6b4f', '#2f4f6b', '#6b2f5c']

export default function FormBuatDivisi() {
  const router = useRouter()
  const [nama, setNama] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [warna, setWarna] = useState(WARNA_PILIHAN[0])
  const [pesanError, setPesanError] = useState<string | null>(null)
  const [sedangProses, setSedangProses] = useState(false)
  const [errNama, setErrNama] = useState(false)

  async function tanganiSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPesanError(null)

    if (!nama.trim()) {
      setErrNama(true)
      return
    }
    setErrNama(false)

    setSedangProses(true)
    const hasil = await buatDivisi(nama, deskripsi, warna)
    setSedangProses(false)

    if (!hasil.sukses) {
      setPesanError(hasil.pesan)
      return
    }

    setNama('')
    setDeskripsi('')
    router.refresh()
  }

  return (
    <div className="rounded-3xl border border-cream-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-black text-maroon-800 uppercase tracking-wider">Buat Divisi Baru</h2>

      <form onSubmit={tanganiSubmit} className="space-y-3.5" noValidate>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">
              Nama Divisi
            </label>
            <input
              type="text"
              placeholder="Nama divisi, contoh: Kreatif"
              value={nama}
              onChange={(e) => {
                setNama(e.target.value)
                if (e.target.value.trim()) setErrNama(false)
              }}
              className={`w-full rounded-xl border bg-cream-50/40 px-3.5 py-2.5 text-xs font-semibold text-ink placeholder-muted/65 outline-none focus:ring-2 focus:ring-maroon-800/10 transition ${
                errNama ? 'border-red-500 focus:border-red-500 ring-2 ring-red-500/10' : 'border-cream-200 focus:border-maroon-800'
              }`}
            />
            {errNama && (
              <p className="mt-1 text-[11px] font-bold text-red-600">Nama divisi harus diisi!</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">
              Deskripsi
            </label>
            <input
              type="text"
              placeholder="Deskripsi singkat"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              className="w-full rounded-xl border border-cream-200 bg-cream-50/40 px-3.5 py-2.5 text-xs font-semibold text-ink placeholder-muted/65 outline-none focus:border-maroon-800 focus:ring-2 focus:ring-maroon-800/10 transition"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Warna Identitas:</span>
          <div className="flex items-center gap-2">
            {WARNA_PILIHAN.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWarna(w)}
                aria-label={`Pilih warna ${w}`}
                className={`h-6 w-6 rounded-full border border-white transition active:scale-90 shadow-sm cursor-pointer ${
                  warna === w ? 'ring-2 ring-offset-2 ring-orange-500 scale-105' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: w }}
              />
            ))}
          </div>
        </div>

        {pesanError && <p className="text-xs font-bold text-red-600">{pesanError}</p>}

        <button
          type="submit"
          disabled={sedangProses}
          className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/25 transition active:scale-95 disabled:opacity-50 cursor-pointer sm:w-auto"
        >
          {sedangProses ? 'Membuat Divisi...' : 'Buat Divisi'}
        </button>
      </form>
    </div>
  )
}

