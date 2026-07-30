'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ambilLampiranTask,
  ambilUrlLampiran,
  hapusLampiran,
  unggahLampiran,
  type Lampiran,
} from './actions'

function formatUkuran(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatWaktu(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function LampiranSection({
  divisionId,
  taskId,
}: {
  divisionId: string
  taskId: string
}) {
  const [daftar, setDaftar] = useState<Lampiran[]>([])
  const [sedangMuat, setSedangMuat] = useState(true)
  const [sedangUnggah, setSedangUnggah] = useState(false)
  const [pesanError, setPesanError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let batal = false
    ambilLampiranTask(divisionId, taskId).then((data) => {
      if (batal) return
      setDaftar(data)
      setSedangMuat(false)
    })
    return () => {
      batal = true
    }
  }, [divisionId, taskId])

  async function tanganiPilihFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setSedangUnggah(true)
    setPesanError(null)
    const hasil = await unggahLampiran(divisionId, taskId, file)
    setSedangUnggah(false)

    if (!hasil.sukses) {
      setPesanError(hasil.pesan)
      return
    }

    if (hasil.lampiran) {
      setDaftar((prev) => [...prev, hasil.lampiran!])
    }
  }

  async function tanganiUnduh(lampiran: Lampiran) {
    const hasil = await ambilUrlLampiran(divisionId, lampiran.id)
    if (!hasil.sukses || !hasil.url) {
      setPesanError(!hasil.sukses ? hasil.pesan : 'Gagal membuat tautan unduh')
      return
    }
    window.open(hasil.url, '_blank', 'noopener,noreferrer')
  }

  async function tanganiHapus(lampiranId: string) {
    if (!confirm('Hapus lampiran ini?')) return
    const sebelumnya = daftar
    setDaftar((prev) => prev.filter((l) => l.id !== lampiranId))
    const hasil = await hapusLampiran(divisionId, lampiranId)
    if (!hasil.sukses) {
      setDaftar(sebelumnya)
      setPesanError(hasil.pesan)
    }
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-muted">
        Lampiran {daftar.length > 0 && `(${daftar.length})`}
      </label>

      {sedangMuat ? (
        <p className="text-xs text-muted">Memuat lampiran...</p>
      ) : (
        <div className="mb-2 space-y-1.5">
          {daftar.length === 0 && <p className="text-xs text-muted">Belum ada lampiran.</p>}
          {daftar.map((l) => (
            <div key={l.id} className="flex items-center justify-between gap-2 rounded-lg bg-cream-50 px-2.5 py-2">
              <button
                type="button"
                onClick={() => tanganiUnduh(l)}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate text-xs font-bold text-maroon-700 hover:underline">{l.namaFile}</p>
                <p className="text-[10px] text-muted">
                  {formatUkuran(l.ukuranBytes)} &middot; {l.pengunggahNama} &middot; {formatWaktu(l.createdAt)}
                </p>
              </button>
              <button
                onClick={() => tanganiHapus(l.id)}
                className="shrink-0 text-[10px] font-semibold text-red-600 hover:underline"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        onChange={tanganiPilihFile}
        disabled={sedangUnggah}
        className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-xs outline-none file:mr-2 file:rounded-md file:border-0 file:bg-maroon-800 file:px-2 file:py-1 file:text-xs file:font-bold file:text-white disabled:opacity-50"
      />
      {sedangUnggah && <p className="mt-1 text-xs text-muted">Mengunggah...</p>}
      {pesanError && <p className="mt-1 text-xs text-red-700">{pesanError}</p>}
    </div>
  )
}
