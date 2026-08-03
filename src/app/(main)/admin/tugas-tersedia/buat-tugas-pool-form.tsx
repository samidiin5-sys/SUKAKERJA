'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ambilBoardUntukPool, kirimTugasPool, type BoardDivisi } from './actions'

type DivisiSaya = { id: string; nama: string; warna: string; role: string }

export default function BuatTugasPoolForm({ divisiSaya }: { divisiSaya: DivisiSaya[] }) {
  const router = useRouter()
  const [buka, setBuka] = useState(false)
  const [divisionId, setDivisionId] = useState(divisiSaya[0]?.id ?? '')
  const [boards, setBoards] = useState<BoardDivisi[]>([])
  const [boardId, setBoardId] = useState('')
  const [judul, setJudul] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [deadlineTanggal, setDeadlineTanggal] = useState('')
  const [deadlineHStr, setDeadlineHStr] = useState('')
  const [deadlineMStr, setDeadlineMStr] = useState('')
  const [deadlineJam, setDeadlineJam] = useState('')
  const [hasBonus, setHasBonus] = useState(false)
  const [bonusAmount, setBonusAmount] = useState('')
  const [lintasDivisi, setLintasDivisi] = useState(true)
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
    setDeadlineTanggal('')
    setDeadlineHStr('')
    setDeadlineMStr('')
    setDeadlineJam('')
    setHasBonus(false)
    setBonusAmount('')
    setLintasDivisi(true)
    setPesan(null)
  }

  async function tanganiKirim(e: React.FormEvent) {
    e.preventDefault()
    if (!boardId) {
      setPesan({ sukses: false, teks: 'Pilih kolom (board) terlebih dahulu.' })
      return
    }
    if (!deadlineTanggal) {
      setPesan({ sukses: false, teks: 'Deadline wajib diisi untuk Tugas Terbuka.' })
      return
    }
    setSedangKirim(true)
    setPesan(null)
    const jam = deadlineJam || '00:00'
    const deadlineISO = new Date(`${deadlineTanggal}T${jam}:00`).toISOString()
    const nominal = hasBonus ? parseInt(bonusAmount.replace(/\D/g, ''), 10) || 0 : 0
    const hasil = await kirimTugasPool(divisionId, boardId, judul, deskripsi, deadlineISO, lintasDivisi ? 'semua' : 'divisi', hasBonus, nominal)
    setSedangKirim(false)
    if (!hasil.sukses) {
      setPesan({ sukses: false, teks: hasil.pesan })
      return
    }
    setPesan({ sukses: true, teks: 'Tugas terbuka berhasil dibuat! Staff aktif sudah diberitahu.' })
    router.refresh()
    reset()
  }

  if (divisiSaya.length === 0) return null

  return (
    <div className="mb-6">
      {!buka ? (
        <button
          onClick={() => { setBuka(true); setPesan(null) }}
          className="flex w-full items-center justify-center gap-2 rounded-[22px] border-2 border-dashed border-maroon-200 bg-cream-50/50 py-4 text-xs font-black text-maroon-800 transition-all hover:border-maroon-300 hover:bg-cream-100/50 active:scale-[0.99] cursor-pointer"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Buat Tugas Terbuka Baru
        </button>
      ) : (
        <div className="rounded-[28px] border border-cream-200 bg-white p-5 shadow-[0_14px_40px_rgba(92,31,33,0.05)]">
          <div className="mb-4 flex items-center justify-between border-b border-cream-100 pb-3">
            <h3 className="text-xs font-bold tracking-widest text-muted uppercase">Buat Tugas Terbuka Baru</h3>
            <button
              onClick={() => { setBuka(false); reset() }}
              className="text-xs font-bold text-muted hover:text-ink transition cursor-pointer"
            >
              ✕ Tutup
            </button>
          </div>

          <form onSubmit={tanganiKirim} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted">Jangkauan (Akses Mengambil Tugas)</label>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setLintasDivisi(true)}
                  className={`flex-1 rounded-xl border py-2.5 text-xs font-black transition-all ${
                    lintasDivisi
                      ? 'border-maroon-700 bg-maroon-800 text-cream-50 shadow-md shadow-maroon-800/10'
                      : 'border-cream-200 bg-cream-50/50 text-muted hover:border-maroon-200 hover:text-ink'
                  }`}
                >
                  Semua Staff (Lintas Divisi)
                </button>
                <button
                  type="button"
                  onClick={() => setLintasDivisi(false)}
                  className={`flex-1 rounded-xl border py-2.5 text-xs font-black transition-all ${
                    !lintasDivisi
                      ? 'border-maroon-700 bg-maroon-800 text-cream-50 shadow-md shadow-maroon-800/10'
                      : 'border-cream-200 bg-cream-50/50 text-muted hover:border-maroon-200 hover:text-ink'
                  }`}
                >
                  Divisi Tertentu
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Divisi Asal</label>
              <select
                value={divisionId}
                onChange={(e) => setDivisionId(e.target.value)}
                required
                className="w-full rounded-xl border border-cream-200 bg-cream-50/50 px-3.5 py-2.5 text-xs font-bold text-ink outline-none focus:border-maroon-800 focus:bg-white transition-all cursor-pointer shadow-inner"
              >
                {divisiSaya.map((d) => (
                  <option key={d.id} value={d.id}>{d.nama}</option>
                ))}
              </select>
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
                className="w-full rounded-xl border border-cream-200 bg-cream-50/50 px-3.5 py-2.5 text-xs font-bold text-ink outline-none focus:border-maroon-800 focus:bg-white transition-all shadow-inner"
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
                className="w-full resize-none rounded-xl border border-cream-200 bg-cream-50/50 px-3.5 py-2.5 text-xs font-bold text-ink outline-none focus:border-maroon-800 focus:bg-white transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">
                Deadline <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={deadlineTanggal}
                  onChange={(e) => setDeadlineTanggal(e.target.value)}
                  required
                  className="flex-1 rounded-xl border border-cream-200 bg-cream-50/50 px-3.5 py-2.5 text-xs font-bold text-ink outline-none focus:border-maroon-800 focus:bg-white transition-all shadow-inner"
                />
                <div className="flex items-center justify-center gap-1.5 rounded-xl border border-cream-200 bg-cream-50/50 px-3 py-2.5 shadow-inner focus-within:border-maroon-800 focus-within:bg-white transition-all">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    placeholder="00"
                    value={deadlineHStr}
                    onChange={(e) => {
                      const h = e.target.value.replace(/\D/g, '').slice(0, 2)
                      if (h !== '' && parseInt(h) > 23) return
                      setDeadlineHStr(h)
                      const m = deadlineJam ? deadlineJam.split(':')[1] : '00'
                      setDeadlineJam(`${h.padStart(2, '0')}:${m}`)
                    }}
                    onBlur={() => setDeadlineHStr((h) => h.padStart(2, '0'))}
                    className="w-8 bg-transparent text-center text-xs font-bold text-ink outline-none"
                  />
                  <span className="text-xs font-black text-muted">:</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    placeholder="00"
                    value={deadlineMStr}
                    onChange={(e) => {
                      const m = e.target.value.replace(/\D/g, '').slice(0, 2)
                      if (m !== '' && parseInt(m) > 59) return
                      setDeadlineMStr(m)
                      const h = deadlineJam ? deadlineJam.split(':')[0] : '00'
                      setDeadlineJam(`${h}:${m.padStart(2, '0')}`)
                    }}
                    onBlur={() => setDeadlineMStr((m) => m.padStart(2, '0'))}
                    className="w-8 bg-transparent text-center text-xs font-bold text-ink outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Bonus Tugas</label>
              <div className="rounded-xl border border-cream-200 bg-cream-50/50 p-3.5 shadow-inner">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasBonus}
                    onChange={(e) => setHasBonus(e.target.checked)}
                    className="h-4 w-4 rounded border-cream-300 text-maroon-700 focus:ring-maroon-700 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-maroon-800">Berikan Bonus</span>
                </label>
                {hasBonus && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-xs font-semibold text-muted">Rp</span>
                    <input
                      type="text"
                      value={bonusAmount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '')
                        setBonusAmount(val ? parseInt(val, 10).toLocaleString('id-ID') : '')
                      }}
                      placeholder="50.000"
                      className="w-full rounded-xl border border-cream-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-maroon-800 focus:ring-1 focus:ring-maroon-800/20 transition-all shadow-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-orange-200 bg-orange-50/50 px-3.5 py-3">
              <svg className="mt-0.5 flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              <p className="text-xs font-semibold text-orange-700 leading-relaxed">
                Tugas terbuka bisa langsung diambil oleh staff tanpa pengajuan proposal. Tentukan deadline agar staff tahu batas waktu pengerjaannya.
              </p>
            </div>

            {pesan && (
              <p className={`text-xs font-semibold ${pesan.sukses ? 'text-green-700' : 'text-red-600'}`}>
                {pesan.teks}
              </p>
            )}

            <div className="flex gap-2.5 pt-1.5">
              <button
                type="submit"
                disabled={sedangKirim || boards.length === 0}
                className="rounded-xl bg-maroon-800 px-5 py-2.5 text-xs font-bold text-cream-50 hover:bg-maroon-900 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all shadow-md shadow-maroon-800/10 cursor-pointer"
              >
                {sedangKirim ? 'Membuat...' : 'Buat Tugas Terbuka'}
              </button>
              <button
                type="button"
                onClick={() => { setBuka(false); reset() }}
                className="rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-xs font-bold text-muted hover:bg-cream-50/50 active:scale-95 transition-all cursor-pointer shadow-sm"
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
