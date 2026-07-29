'use client'

import { useEffect, useRef, useState } from 'react'
import { ambilKomentar, hapusKomentar, tambahKomentar, type AnggotaDivisi, type Komentar } from './actions'

function formatWaktu(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function renderIsiKomentar(isi: string, anggota: AnggotaDivisi[]) {
  const namaSet = new Set(anggota.map((a) => a.nama))
  const bagian = isi.split(/(@[^\s@]+(?:\s[^\s@]+)?)/g)
  return bagian.map((b, i) => {
    const nama = b.startsWith('@') ? b.slice(1) : ''
    if (nama && namaSet.has(nama)) {
      return (
        <span key={i} className="font-bold text-orange-700">
          {b}
        </span>
      )
    }
    return <span key={i}>{b}</span>
  })
}

export default function KomentarSection({
  divisionId,
  taskId,
  anggota,
}: {
  divisionId: string
  taskId: string
  anggota: AnggotaDivisi[]
}) {
  const [daftar, setDaftar] = useState<Komentar[]>([])
  const [sedangMuat, setSedangMuat] = useState(true)
  const [teks, setTeks] = useState('')
  const [sedangKirim, setSedangKirim] = useState(false)
  const [pesanError, setPesanError] = useState<string | null>(null)
  const [saranMention, setSaranMention] = useState<AnggotaDivisi[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  async function muatUlang() {
    const data = await ambilKomentar(divisionId, taskId)
    setDaftar(data)
  }

  useEffect(() => {
    let batal = false
    ambilKomentar(divisionId, taskId).then((data) => {
      if (batal) return
      setDaftar(data)
      setSedangMuat(false)
    })
    return () => {
      batal = true
    }
  }, [divisionId, taskId])

  function tanganiUbahTeks(nilai: string) {
    setTeks(nilai)
    const posisiKursor = inputRef.current?.selectionStart ?? nilai.length
    const sebelumKursor = nilai.slice(0, posisiKursor)
    const cocok = sebelumKursor.match(/@([^\s@]*)$/)
    if (cocok) {
      const query = cocok[1].toLowerCase()
      setSaranMention(anggota.filter((a) => a.nama.toLowerCase().includes(query)).slice(0, 5))
    } else {
      setSaranMention([])
    }
  }

  function pilihMention(nama: string) {
    const posisiKursor = inputRef.current?.selectionStart ?? teks.length
    const sebelumKursor = teks.slice(0, posisiKursor)
    const sesudahKursor = teks.slice(posisiKursor)
    const teksBaru = sebelumKursor.replace(/@([^\s@]*)$/, `@${nama} `) + sesudahKursor
    setTeks(teksBaru)
    setSaranMention([])
    inputRef.current?.focus()
  }

  async function tanganiKirim(e: React.FormEvent) {
    e.preventDefault()
    if (!teks.trim()) return

    setSedangKirim(true)
    setPesanError(null)
    setSaranMention([])
    const hasil = await tambahKomentar(divisionId, taskId, teks)
    setSedangKirim(false)

    if (!hasil.sukses) {
      setPesanError(hasil.pesan)
      return
    }

    setTeks('')
    await muatUlang()
  }

  async function tanganiHapus(commentId: string) {
    if (!confirm('Hapus komentar ini?')) return
    const hasil = await hapusKomentar(divisionId, commentId)
    if (!hasil.sukses) {
      alert(hasil.pesan)
      return
    }
    await muatUlang()
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-muted">
        Komentar {daftar.length > 0 && `(${daftar.length})`}
      </label>

      {sedangMuat ? (
        <p className="text-xs text-muted">Memuat komentar...</p>
      ) : (
        <div className="mb-2 max-h-52 space-y-2 overflow-y-auto">
          {daftar.length === 0 && (
            <p className="text-xs text-muted">Belum ada komentar. Mulai diskusi di bawah.</p>
          )}
          {daftar.map((k) => (
            <div key={k.id} className="rounded-lg bg-cream-50 p-2.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-ink">{k.penulisNama}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted">{formatWaktu(k.createdAt)}</span>
                  <button
                    onClick={() => tanganiHapus(k.id)}
                    className="text-[10px] font-semibold text-red-600 hover:underline"
                  >
                    Hapus
                  </button>
                </div>
              </div>
              <p className="mt-0.5 whitespace-pre-wrap text-xs text-ink">{renderIsiKomentar(k.isi, anggota)}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={tanganiKirim} className="relative flex gap-2">
        {saranMention.length > 0 && (
          <div className="absolute bottom-full left-0 mb-1 w-56 overflow-hidden rounded-lg border border-cream-200 bg-white shadow-lg">
            {saranMention.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => pilihMention(a.nama)}
                className="block w-full px-3 py-1.5 text-left text-xs text-ink hover:bg-cream-100"
              >
                {a.nama}
              </button>
            ))}
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          value={teks}
          onChange={(e) => tanganiUbahTeks(e.target.value)}
          placeholder="Tulis komentar... (@ untuk mention)"
          className="flex-1 rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-orange-500"
        />
        <button
          type="submit"
          disabled={sedangKirim || !teks.trim()}
          className="rounded-lg bg-maroon-800 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          Kirim
        </button>
      </form>
      {pesanError && <p className="mt-1 text-xs text-red-700">{pesanError}</p>}
    </div>
  )
}
