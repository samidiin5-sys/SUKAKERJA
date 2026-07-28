'use client'

import { useState, useEffect } from 'react'
import { ambilDivisiDanBoardStaff, buatTugasSendiri, type DivisiOpsi } from './actions'
import { useRouter } from 'next/navigation'

export default function FormBuatTugasSendiri() {
  const router = useRouter()
  const [buka, setBuka] = useState(false)
  const [divisiList, setDivisiList] = useState<DivisiOpsi[]>([])
  const [divisionId, setDivisionId] = useState('')
  const [boardId, setBoardId] = useState('')
  const [judul, setJudul] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [prioritas, setPrioritas] = useState('sedang')
  const [dueDate, setDueDate] = useState('')
  const [memuat, setMemuat] = useState(false)
  const [sedangKirim, setSedangKirim] = useState(false)
  const [pesan, setPesan] = useState<{ sukses: boolean; teks: string } | null>(null)

  useEffect(() => {
    if (!buka) return
    setMemuat(true)
    ambilDivisiDanBoardStaff().then((res) => {
      setDivisiList(res)
      if (res.length > 0) {
        setDivisionId(res[0].id)
        setBoardId(res[0].boards[0]?.id ?? '')
      }
      setMemuat(false)
    })
  }, [buka])

  const boardsTersedia = divisiList.find((d) => d.id === divisionId)?.boards ?? []

  function tanganiGantiDivisi(id: string) {
    setDivisionId(id)
    const targetDiv = divisiList.find((d) => d.id === id)
    setBoardId(targetDiv?.boards[0]?.id ?? '')
  }

  function resetForm() {
    setJudul('')
    setDeskripsi('')
    setPrioritas('sedang')
    setDueDate('')
    setPesan(null)
  }

  async function tanganiSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!divisionId || !boardId) {
      setPesan({ sukses: false, teks: 'Pilih divisi dan kolom (board).' })
      return
    }

    setSedangKirim(true)
    setPesan(null)

    const hasil = await buatTugasSendiri({
      divisionId,
      boardId,
      judul,
      deskripsi,
      prioritas,
      dueDate: dueDate ? dueDate : null,
    })

    setSedangKirim(false)

    if (hasil.sukses) {
      resetForm()
      setBuka(false)
      router.refresh()
    } else {
      setPesan({ sukses: false, teks: hasil.pesan })
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setBuka(true)
          resetForm()
        }}
        className="flex items-center gap-1.5 rounded-xl bg-maroon-800 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-maroon-700 shadow-sm"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Buat Tugas Sendiri
      </button>

      {buka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-black text-maroon-800">Buat Tugas Personal</h2>
              <button
                onClick={() => setBuka(false)}
                className="text-lg font-bold text-muted hover:text-ink"
              >
                ✕
              </button>
            </div>

            {memuat ? (
              <div className="py-8 text-center text-xs font-semibold text-muted animate-pulse">
                Memuat divisi & board...
              </div>
            ) : divisiList.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted">
                Kamu belum terdaftar di divisi mana pun. Hubungi owner divisi untuk bergabung.
              </div>
            ) : (
              <form onSubmit={tanganiSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted">Divisi</label>
                    <select
                      value={divisionId}
                      onChange={(e) => tanganiGantiDivisi(e.target.value)}
                      required
                      className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm text-ink outline-none focus:border-orange-500"
                    >
                      {divisiList.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nama}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted">Kolom (Board)</label>
                    <select
                      value={boardId}
                      onChange={(e) => setBoardId(e.target.value)}
                      required
                      className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm text-ink outline-none focus:border-orange-500"
                    >
                      {boardsTersedia.length === 0 ? (
                        <option value="">Tidak ada kolom</option>
                      ) : (
                        boardsTersedia.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.nama}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">
                    Judul Tugas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    placeholder="Contoh: Menyiapkan laporan penjualan mingguan..."
                    required
                    maxLength={200}
                    className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2.5 text-sm text-ink outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">
                    Deskripsi <span className="font-normal text-muted/60">(opsional)</span>
                  </label>
                  <textarea
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    placeholder="Detail instruksi atau rincian pekerjaan..."
                    rows={3}
                    className="w-full resize-none rounded-lg border border-cream-200 bg-cream-50 px-3 py-2.5 text-sm text-ink outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted">Prioritas</label>
                    <select
                      value={prioritas}
                      onChange={(e) => setPrioritas(e.target.value)}
                      className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm text-ink outline-none focus:border-orange-500"
                    >
                      <option value="rendah">Rendah</option>
                      <option value="sedang">Sedang</option>
                      <option value="tinggi">Tinggi</option>
                      <option value="mendesak">Mendesak</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted">
                      Deadline <span className="font-normal text-muted/60">(opsional)</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm text-ink outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {pesan && (
                  <p className={`text-xs font-semibold ${pesan.sukses ? 'text-green-700' : 'text-red-600'}`}>
                    {pesan.teks}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setBuka(false)}
                    className="rounded-xl px-4 py-2 text-sm font-bold text-muted hover:bg-cream-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={sedangKirim || !boardId}
                    className="rounded-xl bg-maroon-800 px-5 py-2 text-sm font-bold text-white transition hover:bg-maroon-700 disabled:opacity-50"
                  >
                    {sedangKirim ? 'Menyimpan...' : 'Simpan Tugas'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
