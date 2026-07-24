'use client'

import { useState } from 'react'
import { kirimTugasOwner, type AnggotaDivisi, type BoardDenganTask } from './actions'

export default function KirimTugasModal({
  divisionId,
  boards,
  anggota,
  onClose,
  onTerkirim,
}: {
  divisionId: string
  boards: BoardDenganTask[]
  anggota: AnggotaDivisi[]
  onClose: () => void
  onTerkirim: () => void
}) {
  const [boardId, setBoardId] = useState(boards[0]?.id ?? '')
  const [judul, setJudul] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [deadline, setDeadline] = useState('')
  const [tagged, setTagged] = useState<Set<string>>(new Set())
  const [pesanError, setPesanError] = useState<string | null>(null)
  const [sedangKirim, setSedangKirim] = useState(false)

  const tanggalKirim = new Date().toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  function toggleTag(userId: string) {
    setTagged((prev) => {
      const baru = new Set(prev)
      if (baru.has(userId)) baru.delete(userId)
      else baru.add(userId)
      return baru
    })
  }

  async function tanganiKirim(e: React.FormEvent) {
    e.preventDefault()
    setPesanError(null)

    if (!boardId) {
      setPesanError('Pilih board tujuan')
      return
    }
    if (tagged.size === 0) {
      setPesanError('Tag minimal 1 staff yang akan menerima tugas ini')
      return
    }

    setSedangKirim(true)
    const hasil = await kirimTugasOwner(
      divisionId,
      boardId,
      judul,
      deskripsi,
      deadline || null,
      Array.from(tagged)
    )
    setSedangKirim(false)

    if (!hasil.sukses) {
      setPesanError(hasil.pesan)
      return
    }

    onTerkirim()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-black text-maroon-800">Kirim Tugas</h2>
          <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Tutup">
            ✕
          </button>
        </div>

        <form onSubmit={tanganiKirim} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Board Tujuan</label>
            <select
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
              className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2.5 text-sm text-ink outline-none focus:border-orange-500"
            >
              {boards.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Judul Tugas</label>
            <input
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Judul tugas / project..."
              className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2.5 text-sm text-ink outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Deskripsi</label>
            <textarea
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              rows={3}
              placeholder="Detail tugas..."
              className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2.5 text-sm text-ink outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Tanggal Kirim</label>
              <input
                type="text"
                readOnly
                value={tanggalKirim}
                className="w-full rounded-lg border border-cream-200 bg-cream-100 px-3 py-2.5 text-sm text-muted"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2.5 text-sm text-ink outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">
              Tag Staff Penerima {tagged.size > 0 && `(${tagged.size})`}
            </label>
            <p className="mb-1.5 text-[11px] text-muted">
              Cuma staff yang di-tag di sini yang bisa lihat tugas ini.
            </p>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-cream-200 bg-cream-50 p-2">
              {anggota.length === 0 && (
                <p className="px-1 py-1 text-xs text-muted">Divisi ini belum punya anggota.</p>
              )}
              {anggota.map((a) => (
                <label
                  key={a.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-cream-100"
                >
                  <input
                    type="checkbox"
                    checked={tagged.has(a.id)}
                    onChange={() => toggleTag(a.id)}
                    className="h-4 w-4 accent-orange-500"
                  />
                  <span className="text-ink">{a.nama}</span>
                </label>
              ))}
            </div>
          </div>

          {pesanError && <p className="text-sm text-red-700">{pesanError}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-bold text-muted hover:bg-cream-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={sedangKirim}
              className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/25 transition hover:bg-orange-600 disabled:opacity-50"
            >
              {sedangKirim ? 'Mengirim...' : 'Kirim Tugas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
