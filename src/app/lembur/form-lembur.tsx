'use client'

import { useState } from 'react'
import { ajukanLembur } from './actions'

type DivisiSaya = { id: string; nama: string; warna: string; role: string }

export default function FormLembur({ divisiSaya }: { divisiSaya: DivisiSaya[] }) {
  const [divisionId, setDivisionId] = useState(divisiSaya[0]?.id ?? '')
  const [tanggal, setTanggal] = useState('')
  const [jamMulai, setJamMulai] = useState('')
  const [jamSelesai, setJamSelesai] = useState('')
  const [alasan, setAlasan] = useState('')
  const [sedangKirim, setSedangKirim] = useState(false)
  const [pesan, setPesan] = useState<{ sukses: boolean; teks: string } | null>(null)

  async function tanganiKirim(e: React.FormEvent) {
    e.preventDefault()
    setSedangKirim(true)
    setPesan(null)
    const hasil = await ajukanLembur(divisionId, tanggal, jamMulai, jamSelesai, alasan)
    setSedangKirim(false)
    if (!hasil.sukses) {
      setPesan({ sukses: false, teks: hasil.pesan })
      return
    }
    setPesan({ sukses: true, teks: 'Pengajuan lembur berhasil dikirim!' })
    setTanggal('')
    setJamMulai('')
    setJamSelesai('')
    setAlasan('')
  }

  if (divisiSaya.length === 0) {
    return (
      <div className="rounded-2xl border border-cream-200 bg-white p-4 text-center">
        <p className="text-sm text-muted">Kamu belum terdaftar di divisi manapun.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-xs font-bold tracking-widest text-muted">AJUKAN LEMBUR BARU</h3>
      <form onSubmit={tanganiKirim} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Divisi</label>
          <select
            value={divisionId}
            onChange={(e) => setDivisionId(e.target.value)}
            required
            className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-orange-500"
          >
            {divisiSaya.map((d) => (
              <option key={d.id} value={d.id}>{d.nama}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Tanggal Lembur</label>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            required
            className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-orange-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Jam Mulai</label>
            <input
              type="time"
              value={jamMulai}
              onChange={(e) => setJamMulai(e.target.value)}
              required
              className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Jam Selesai</label>
            <input
              type="time"
              value={jamSelesai}
              onChange={(e) => setJamSelesai(e.target.value)}
              required
              className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Alasan Lembur</label>
          <textarea
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            placeholder="Jelaskan alasan lembur (min. 10 karakter)..."
            rows={3}
            required
            className="w-full resize-none rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-orange-500"
          />
        </div>

        {pesan && (
          <p className={`text-xs font-semibold ${pesan.sukses ? 'text-green-700' : 'text-red-600'}`}>
            {pesan.teks}
          </p>
        )}

        <button
          type="submit"
          disabled={sedangKirim}
          className="w-full rounded-xl bg-maroon-800 py-2.5 text-sm font-bold text-white hover:bg-maroon-700 disabled:opacity-50 sm:w-auto sm:px-6"
        >
          {sedangKirim ? 'Mengirim...' : 'Ajukan Lembur'}
        </button>
      </form>
    </div>
  )
}
