'use client'

import { useState, useEffect } from 'react'
import { ambilBoardUntukPool, kirimTugasPool, type BoardDivisi } from './actions'

type DivisiSaya = { id: string; nama: string; warna: string; role: string }

export default function BuatTugasPoolForm({ divisiSaya }: { divisiSaya: DivisiSaya[] }) {
  const [buka, setBuka] = useState(false)
  const [divisionId, setDivisionId] = useState(divisiSaya[0]?.id ?? '')
  const [boards, setBoards] = useState<BoardDivisi[]>([])
  const [boardId, setBoardId] = useState('')
  const [judul, setJudul] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [deadline, setDeadline] = useState('')
  const [muatBoard, setMuatBoard] = useState(false)
  const [sedangKirim, setSedangKirim] = useState(false)
  const [pesan, setPesan] = useState<{ sukses: boolean; teks: string } | null>(null)

  useEffect(() => {
    if (!divisionId) return
    setMuatBoard(true)
    setBoardId('')
    ambilBoardUntukPool(divisionId).then((data) => {
      setBoards(data)
      setBoardId(data[0]?.id ?? '')
      setMuatBoard(false)
    })
  }, [divisionId])

  function reset() {
    setJudul('')
    setDeskripsi('')
    setDeadline('')
    setPesan(null)
  }

  async function tanganiKirim(e: React.FormEvent) {
    e.preventDefault()
    if (!boardId) {
      setPesan({ sukses: false, teks: 'Pilih kolom (board) terlebih dahulu.' })
      return
    }
    setSedangKirim(true)
    setPesan(null)
    const deadlineISO = deadline ? new Date(deadline).toISOString() : null
    const hasil = await kirimTugasPool(divisionId, boardId, judul, deskripsi, deadlineISO)
    setSedangKirim(false)
    if (!hasil.sukses) {
      setPesan({ sukses: false, teks: hasil.pesan })
      return
    }
    setPesan({ sukses: true, teks: 'Tugas bebas berhasil dibuat! Staff aktif sudah diberitahu.' })
    reset()
  }

  if (divisiSaya.length === 0) return null

  return (
    <div className="mb-6">
      {!buka ? (
        <button
          onClick={() => { setBuka(true); setPesan(null) }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50 py-3.5 text-sm font-bold text-orange-700 transition hover:border-orange-400 hover:bg-orange-100"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Buat Tugas Bebas Baru
        </button>
      ) : (
        <div className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xs font-bold tracking-widest text-muted">BUAT TUGAS BEBAS BARU</h3>
            <button
              onClick={() => { setBuka(false); reset() }}
              className="text-xs text-muted hover:text-ink"
            >
              ✕ Tutup
            </button>
          </div>

          <form onSubmit={tanganiKirim} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
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
                <label className="mb-1 block text-xs font-semibold text-muted">Kolom (Board)</label>
                {muatBoard ? (
                  <div className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm text-muted animate-pulse">
                    Memuat...
                  </div>
                ) : (
                  <select
                    value={boardId}
                    onChange={(e) => setBoardId(e.target.value)}
                    required
                    disabled={boards.length === 0}
                    className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-orange-500 disabled:opacity-50"
                  >
                    {boards.length === 0 ? (
                      <option value="">Tidak ada kolom</option>
                    ) : (
                      boards.map((b) => (
                        <option key={b.id} value={b.id}>{b.nama}</option>
                      ))
                    )}
                  </select>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Judul Tugas</label>
              <input
                type="text"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Nama tugas yang perlu dikerjakan..."
                required
                maxLength={200}
                className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">
                Deskripsi <span className="font-normal text-muted/60">(opsional)</span>
              </label>
              <textarea
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="Detail pekerjaan, instruksi, atau referensi..."
                rows={3}
                className="w-full resize-none rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">
                Deadline <span className="font-normal text-muted/60">(opsional)</span>
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5">
              <svg className="mt-0.5 flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
              </svg>
              <p className="text-xs text-orange-700">
                Tugas bebas bisa langsung diambil oleh staff tanpa pengajuan proposal. Tentukan deadline agar staff tahu batas waktu pengerjaannya.
              </p>
            </div>

            {pesan && (
              <p className={`text-xs font-semibold ${pesan.sukses ? 'text-green-700' : 'text-red-600'}`}>
                {pesan.teks}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={sedangKirim || boards.length === 0}
                className="rounded-xl bg-maroon-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-maroon-700 disabled:opacity-50"
              >
                {sedangKirim ? 'Membuat...' : 'Buat Tugas Bebas'}
              </button>
              <button
                type="button"
                onClick={() => { setBuka(false); reset() }}
                className="rounded-xl border border-cream-200 px-4 py-2.5 text-sm font-semibold text-muted hover:bg-cream-50"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
