'use client'

import { useState, useEffect } from 'react'
import { ajukanLembur, ambilAnggotaUntukLembur, type AnggotaLembur } from './actions'

type DivisiSaya = { id: string; nama: string; warna: string; role: string }

export default function FormLembur({
  divisiSaya,
  sesiId,
  sesiNama,
}: {
  divisiSaya: DivisiSaya[]
  sesiId: string
  sesiNama: string
}) {
  const [divisionId, setDivisionId] = useState(divisiSaya[0]?.id ?? '')
  const [tanggal, setTanggal] = useState('')
  const [jamMulai, setJamMulai] = useState('')
  const [jamSelesai, setJamSelesai] = useState('')
  const [alasan, setAlasan] = useState('')
  const [sedangKirim, setSedangKirim] = useState(false)
  const [pesan, setPesan] = useState<{ sukses: boolean; teks: string } | null>(null)
  const [anggota, setAnggota] = useState<AnggotaLembur[]>([])
  const [peserta, setPeserta] = useState<Set<string>>(new Set([sesiId]))
  const [muatAnggota, setMuatAnggota] = useState(false)

  useEffect(() => {
    if (!divisionId) return
    setMuatAnggota(true)
    ambilAnggotaUntukLembur(divisionId).then((data) => {
      setAnggota(data)
      setPeserta(new Set([sesiId]))
      setMuatAnggota(false)
    })
  }, [divisionId, sesiId])

  function togglePeserta(id: string) {
    if (id === sesiId) return
    setPeserta((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function tanganiKirim(e: React.FormEvent) {
    e.preventDefault()
    setSedangKirim(true)
    setPesan(null)
    const hasil = await ajukanLembur(divisionId, tanggal, jamMulai, jamSelesai, alasan, Array.from(peserta))
    setSedangKirim(false)
    if (!hasil.sukses) {
      setPesan({ sukses: false, teks: hasil.pesan })
      return
    }
    const jumlah = peserta.size
    setPesan({
      sukses: true,
      teks: jumlah > 1 ? `Pengajuan lembur untuk ${jumlah} orang berhasil dikirim!` : 'Pengajuan lembur berhasil dikirim!',
    })
    setTanggal('')
    setJamMulai('')
    setJamSelesai('')
    setAlasan('')
    setPeserta(new Set([sesiId]))
  }

  if (divisiSaya.length === 0) {
    return (
      <div className="rounded-2xl border border-cream-200 bg-white p-4 text-center">
        <p className="text-sm text-muted">Kamu belum terdaftar di divisi manapun.</p>
      </div>
    )
  }

  const anggotaLainnya = anggota.filter((a) => a.id !== sesiId)

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

        {/* Siapa yang lembur */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted">Siapa yang Lembur</label>
          {muatAnggota ? (
            <p className="text-xs text-muted animate-pulse">Memuat anggota...</p>
          ) : (
            <div className="space-y-0.5 rounded-lg border border-cream-200 bg-cream-50 p-2">
              {/* Current user — always selected */}
              <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
                <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 border-maroon-800 bg-maroon-800">
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-sm font-semibold text-ink">{sesiNama}</span>
                <span className="ml-auto rounded bg-maroon-100 px-1.5 py-0.5 text-[10px] font-bold text-maroon-700">Kamu</span>
              </div>

              {anggotaLainnya.length > 0 && (
                <div className="border-t border-cream-200 pt-0.5">
                  {anggotaLainnya.map((a) => (
                    <label key={a.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-cream-100 transition">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={peserta.has(a.id)}
                        onChange={() => togglePeserta(a.id)}
                      />
                      <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 transition ${peserta.has(a.id) ? 'border-maroon-800 bg-maroon-800' : 'border-cream-300 bg-white'}`}>
                        {peserta.has(a.id) && (
                          <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <span className="text-sm text-ink">{a.nama}</span>
                    </label>
                  ))}
                </div>
              )}

              {anggotaLainnya.length === 0 && (
                <p className="px-2 pt-0.5 text-xs text-muted">Tidak ada anggota lain di divisi ini.</p>
              )}
            </div>
          )}
          {peserta.size > 1 && (
            <p className="mt-1 text-xs font-semibold text-orange-700">
              Lembur untuk {peserta.size} orang — pengajuan akan dibuat untuk masing-masing.
            </p>
          )}
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
