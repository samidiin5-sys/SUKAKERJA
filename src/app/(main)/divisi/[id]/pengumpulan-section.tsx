'use client'

import { useEffect, useState } from 'react'
import { ambilPengumpulan, kirimPengumpulan, hapusPengumpulan, type Pengumpulan } from './actions'

function formatWaktu(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function PengumpulanSection({
  divisionId,
  taskId,
  currentUserId,
}: {
  divisionId: string
  taskId: string
  currentUserId: string
}) {
  const [daftar, setDaftar] = useState<Pengumpulan[]>([])
  const [sedangMuat, setSedangMuat] = useState(true)
  const [link, setLink] = useState('')
  const [keterangan, setKeterangan] = useState('')
  const [sedangKirim, setSedangKirim] = useState(false)
  const [pesan, setPesan] = useState<{ sukses: boolean; teks: string } | null>(null)

  function muatDaftar() {
    ambilPengumpulan(divisionId, taskId).then((data) => {
      setDaftar(data)
      setSedangMuat(false)
    })
  }

  useEffect(() => { muatDaftar() }, [divisionId, taskId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function tanganiKirim(e: React.FormEvent) {
    e.preventDefault()
    setSedangKirim(true)
    setPesan(null)
    const hasil = await kirimPengumpulan(divisionId, taskId, link, keterangan)
    setSedangKirim(false)
    if (!hasil.sukses) { setPesan({ sukses: false, teks: hasil.pesan }); return }
    setPesan({ sukses: true, teks: 'Berhasil dikirim!' })
    setLink('')
    setKeterangan('')
    muatDaftar()
  }

  async function tanganiHapus(id: string) {
    if (!confirm('Hapus pengumpulan ini?')) return
    await hapusPengumpulan(divisionId, id)
    setDaftar(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div>
      <h4 className="mb-3 text-xs font-bold tracking-widest text-muted">PENGUMPULAN TUGAS</h4>

      <form onSubmit={tanganiKirim} className="mb-4 space-y-2">
        <input
          type="url"
          placeholder="Link Google Drive / hasil kerja (https://...)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          required
          className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
        />
        <input
          type="text"
          placeholder="Keterangan (opsional)"
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
        />
        {pesan && (
          <p className={`text-xs ${pesan.sukses ? 'text-green-700' : 'text-red-600'}`}>{pesan.teks}</p>
        )}
        <button
          type="submit"
          disabled={sedangKirim}
          className="rounded-lg bg-orange-500 px-4 py-2 text-xs font-bold text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {sedangKirim ? 'Mengirim...' : 'Kirim Pengumpulan'}
        </button>
      </form>

      {sedangMuat ? (
        <p className="text-xs text-muted">Memuat...</p>
      ) : daftar.length === 0 ? (
        <p className="text-xs text-muted">Belum ada pengumpulan.</p>
      ) : (
        <div className="space-y-2">
          {daftar.map((p) => (
            <div key={p.id} className="rounded-xl border border-cream-200 bg-cream-50 px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <a
                    href={p.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-sm font-semibold text-maroon-700 hover:underline"
                  >
                    🔗 {p.linkUrl}
                  </a>
                  {p.keterangan && <p className="mt-0.5 text-xs text-muted">{p.keterangan}</p>}
                  <p className="mt-1 text-[10px] text-muted">{p.pengirimNama} · {formatWaktu(p.createdAt)}</p>
                </div>
                {p.pengirimId === currentUserId && (
                  <button onClick={() => tanganiHapus(p.id)} className="flex-shrink-0 text-[10px] text-muted hover:text-red-600">
                    Hapus
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
