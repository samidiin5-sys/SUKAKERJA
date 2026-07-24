'use client'

import { useEffect, useState } from 'react'
import {
  ambilDetailTask,
  hapusTask,
  pindahkanTask,
  tandaiSelesai,
  ubahAssigneeTask,
  ubahJudulTask,
  ubahTask,
  type AnggotaDivisi,
  type BoardDenganTask,
  type DetailTask,
} from './actions'
import ChecklistSection from './checklist-section'
import LampiranSection from './lampiran-section'
import KomentarSection from './komentar-section'
import PengumpulanSection from './pengumpulan-section'

const PILIHAN_PRIORITAS = [
  { value: 'rendah', label: 'Rendah' },
  { value: 'sedang', label: 'Sedang' },
  { value: 'tinggi', label: 'Tinggi' },
  { value: 'mendesak', label: 'Mendesak' },
]

export default function DetailTaskPanel({
  divisionId,
  taskId,
  boardIdSaatIni,
  boards,
  anggota,
  bolehPindah = true,
  bolehHapus = false,
  bolehKelola = false,
  currentUserId,
  onClose,
  onBerubah,
}: {
  divisionId: string
  taskId: string
  boardIdSaatIni: string
  boards: BoardDenganTask[]
  anggota: AnggotaDivisi[]
  bolehPindah?: boolean
  bolehHapus?: boolean
  bolehKelola?: boolean
  currentUserId: string
  onClose: () => void
  onBerubah: () => void
}) {
  const [detail, setDetail] = useState<DetailTask | null>(null)
  const [deskripsi, setDeskripsi] = useState('')
  const [prioritas, setPrioritas] = useState('sedang')
  const [dueDate, setDueDate] = useState('')
  const [assigneeIds, setAssigneeIds] = useState<string[]>([])
  const [sedangMuat, setSedangMuat] = useState(true)
  const [sedangSimpan, setSedangSimpan] = useState(false)
  const [pesan, setPesan] = useState<string | null>(null)
  const [konfirmHapusTerbuka, setKonfirmHapusTerbuka] = useState(false)
  const [sedangHapus, setSedangHapus] = useState(false)
  const [editJudul, setEditJudul] = useState(false)
  const [judulSementara, setJudulSementara] = useState('')
  const [pesanJudul, setPesanJudul] = useState<string | null>(null)

  useEffect(() => {
    let batal = false
    ambilDetailTask(divisionId, taskId).then((data) => {
      if (batal || !data) return
      setDetail(data)
      setDeskripsi(data.deskripsi ?? '')
      setPrioritas(data.prioritas)
      setDueDate(data.dueDate ? data.dueDate.slice(0, 10) : '')
      setAssigneeIds(data.assigneeIds)
      setSedangMuat(false)
    })
    return () => {
      batal = true
    }
  }, [divisionId, taskId])

  async function simpanPerubahan() {
    setSedangSimpan(true)
    setPesan(null)

    const hasilTask = await ubahTask(divisionId, taskId, {
      deskripsi,
      prioritas,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    })

    if (!hasilTask.sukses) {
      setSedangSimpan(false)
      setPesan(hasilTask.pesan)
      return
    }

    const hasilAssignee = await ubahAssigneeTask(divisionId, taskId, assigneeIds)

    setSedangSimpan(false)

    if (!hasilAssignee.sukses) {
      setPesan(hasilAssignee.pesan)
      return
    }

    onBerubah()
  }

  async function tanganiPindah(boardIdBaru: string) {
    setSedangSimpan(true)
    const hasil = await pindahkanTask(divisionId, taskId, boardIdBaru)
    setSedangSimpan(false)
    if (!hasil.sukses) {
      setPesan(hasil.pesan)
      return
    }
    onBerubah()
  }

  async function tanganiSelesai() {
    setSedangSimpan(true)
    const hasil = await tandaiSelesai(divisionId, taskId)
    setSedangSimpan(false)
    if (!hasil.sukses) {
      setPesan(hasil.pesan)
      return
    }
    onBerubah()
  }

  async function tanganiHapusTask() {
    setSedangHapus(true)
    const hasil = await hapusTask(divisionId, taskId)
    setSedangHapus(false)
    setKonfirmHapusTerbuka(false)
    if (!hasil.sukses) {
      setPesan(hasil.pesan)
      return
    }
    onBerubah()
  }

  async function simpanJudul() {
    if (!detail || judulSementara.trim() === detail.judul) {
      setEditJudul(false)
      return
    }
    const hasil = await ubahJudulTask(divisionId, taskId, judulSementara)
    if (!hasil.sukses) {
      setPesanJudul(hasil.pesan)
      return
    }
    setDetail(prev => prev ? { ...prev, judul: judulSementara.trim() } : prev)
    setPesanJudul(null)
    setEditJudul(false)
    onBerubah()
  }

  function toggleAssignee(id: string) {
    setAssigneeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl border border-cream-200/40 scrollbar-thin scrollbar-thumb-cream-200/80 scrollbar-track-transparent scrollbar-thumb-rounded-full hover:scrollbar-thumb-cream-300">
        <div className="mb-5 flex items-start justify-between gap-3">
          {sedangMuat ? (
            <h2 className="text-lg font-black text-maroon-800">Memuat...</h2>
          ) : editJudul && bolehKelola ? (
            <div className="flex-1">
              <input
                autoFocus
                value={judulSementara}
                onChange={(e) => setJudulSementara(e.target.value)}
                onBlur={simpanJudul}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); simpanJudul() }
                  if (e.key === 'Escape') { setEditJudul(false); setPesanJudul(null) }
                }}
                maxLength={255}
                className="w-full rounded-xl border border-maroon-800 bg-cream-50/30 px-3 py-1.5 text-base font-black text-maroon-800 outline-none focus:ring-2 focus:ring-maroon-800/10 transition-all"
              />
              {pesanJudul && <p className="mt-1 text-xs font-bold text-red-600">{pesanJudul}</p>}
            </div>
          ) : (
            bolehKelola ? (
              <button
                className="flex-1 text-left text-lg font-black text-maroon-800 hover:text-orange-500 transition leading-snug"
                onClick={() => { setJudulSementara(detail?.judul ?? ''); setEditJudul(true) }}
                title="Klik untuk ubah judul"
              >
                {detail?.judul}
              </button>
            ) : (
              <h2 className="flex-1 text-lg font-black text-maroon-800 leading-snug">{detail?.judul}</h2>
            )
          )}
          <div className="flex shrink-0 items-center gap-3">
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-cream-50 hover:bg-cream-100 text-muted hover:text-ink transition-all duration-200 active:scale-90"
              aria-label="Tutup"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {sedangMuat ? (
          <p className="text-sm text-muted/75 italic">Memuat detail task...</p>
        ) : (
          <div className="space-y-5">
            {detail?.isRecurring && (
              <div className="flex items-center gap-2 rounded-xl bg-blue-50/70 border border-blue-100 px-3.5 py-2.5 text-xs font-bold text-blue-700">
                <span>↻</span>
                <span>Tugas Rutin &mdash; {({ daily_workday: 'Setiap hari kerja', daily: 'Setiap hari', weekly: 'Setiap minggu', monthly: 'Setiap bulan' } as Record<string, string>)[detail.templatePola ?? ''] ?? 'Berulang'}</span>
              </div>
            )}

            <div>
              <label className="mb-2 block text-xs font-bold tracking-wider text-muted uppercase">Deskripsi</label>
              <textarea
                value={deskripsi}
                onChange={(e) => bolehKelola && setDeskripsi(e.target.value)}
                readOnly={!bolehKelola}
                rows={3}
                className={`w-full rounded-xl border border-cream-200 px-3.5 py-2.5 text-xs font-semibold leading-relaxed outline-none transition-all duration-200 ${
                  bolehKelola
                    ? 'bg-white focus:border-maroon-800 focus:ring-1 focus:ring-maroon-800/20 shadow-sm'
                    : 'bg-cream-50/50 cursor-default text-muted'
                }`}
                placeholder="Tambahkan deskripsi tugas di sini..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-xs font-bold tracking-wider text-muted uppercase">Prioritas</label>
                {bolehKelola ? (
                  <select
                    value={prioritas}
                    onChange={(e) => setPrioritas(e.target.value)}
                    className="w-full rounded-xl border border-cream-200 bg-white px-3 py-2.5 text-xs font-bold text-ink outline-none focus:border-maroon-800 focus:ring-1 focus:ring-maroon-800/20 transition-all cursor-pointer shadow-sm"
                  >
                    {PILIHAN_PRIORITAS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="rounded-xl border border-cream-200 bg-cream-50/50 px-3 py-2.5 text-xs font-bold text-muted shadow-inner">
                    {PILIHAN_PRIORITAS.find(p => p.value === prioritas)?.label ?? prioritas}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold tracking-wider text-muted uppercase">Tenggat</label>
                {bolehKelola ? (
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-xl border border-cream-200 bg-white px-3 py-2.5 text-xs font-bold text-ink outline-none focus:border-maroon-800 focus:ring-1 focus:ring-maroon-800/20 transition-all shadow-sm"
                  />
                ) : (
                  <p className="rounded-xl border border-cream-200 bg-cream-50/50 px-3 py-2.5 text-xs font-bold text-muted shadow-inner">
                    {dueDate ? new Date(dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belum diatur'}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold tracking-wider text-muted uppercase">Penanggung Jawab</label>
              <div className="flex flex-wrap gap-2">
                {anggota.map((a) => {
                  const terpilih = assigneeIds.includes(a.id)
                  const inisial = a.nama.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => bolehKelola && toggleAssignee(a.id)}
                      disabled={!bolehKelola}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all duration-200 active:scale-95 disabled:active:scale-100 ${
                        terpilih
                          ? 'border-maroon-800 bg-maroon-800 text-cream-50 shadow-md shadow-maroon-800/10'
                          : 'border-cream-200 bg-cream-50/50 hover:bg-cream-100 text-ink'
                      } ${!bolehKelola ? 'cursor-default opacity-85 active:scale-100' : ''}`}
                    >
                      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-black uppercase ring-1 ${
                        terpilih ? 'bg-cream-100 text-maroon-800 ring-cream-200/50' : 'bg-maroon-800 text-cream-50 ring-maroon-800/20'
                      } overflow-hidden shadow-inner`}>
                        {a.fotoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.fotoUrl} alt={a.nama} className="h-full w-full object-cover rounded-full" />
                        ) : (
                          inisial
                        )}
                      </div>
                      <span>{a.nama}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold tracking-wider text-muted uppercase">Pindahkan ke Board</label>
              <select
                value={boardIdSaatIni}
                onChange={(e) => tanganiPindah(e.target.value)}
                disabled={sedangSimpan || !bolehPindah}
                className="w-full rounded-xl border border-cream-200 bg-white px-3 py-2.5 text-xs font-bold text-ink outline-none focus:border-maroon-800 focus:ring-1 focus:ring-maroon-800/20 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {boards.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nama}
                  </option>
                ))}
              </select>
              {!bolehPindah && (
                <p className="mt-1.5 text-[10px] font-semibold text-red-600/80">Anda tidak memiliki izin memindahkan task ini.</p>
              )}
            </div>

            <div className="border-t border-cream-200/60 pt-4.5">
              <ChecklistSection divisionId={divisionId} taskId={taskId} />
            </div>

            <div className="border-t border-cream-200/60 pt-4.5">
              <LampiranSection divisionId={divisionId} taskId={taskId} />
            </div>

            <div className="border-t border-cream-200/60 pt-4.5">
              <KomentarSection divisionId={divisionId} taskId={taskId} anggota={anggota} />
            </div>

            <div className="border-t border-cream-200/60 pt-4.5">
              <PengumpulanSection divisionId={divisionId} taskId={taskId} currentUserId={currentUserId} />
            </div>

            {pesan && <p className="text-xs font-bold text-red-700">{pesan}</p>}

            <div className="flex flex-col gap-2 border-t border-cream-200/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {bolehHapus && (
                  <button
                    onClick={() => setKonfirmHapusTerbuka(true)}
                    className="rounded-xl border border-red-200 hover:border-red-300 bg-white px-4 py-2.5 text-xs font-bold text-red-600 transition-all hover:bg-red-50 w-full sm:w-auto active:scale-95"
                  >
                    Hapus Task
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                <button
                  onClick={tanganiSelesai}
                  disabled={sedangSimpan}
                  className="rounded-xl border border-maroon-700 hover:border-maroon-800 bg-white px-4 py-2.5 text-xs font-bold text-maroon-800 hover:bg-maroon-50/50 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all shadow-sm"
                >
                  Tandai Selesai
                </button>
                {bolehKelola && (
                  <button
                    onClick={simpanPerubahan}
                    disabled={sedangSimpan}
                    className="rounded-xl bg-maroon-800 px-4 py-2.5 text-xs font-bold text-cream-50 hover:bg-maroon-900 shadow-md shadow-maroon-800/10 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all"
                  >
                    {sedangSimpan ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {konfirmHapusTerbuka && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 border border-cream-200/30 shadow-2xl">
            <h3 className="text-base font-black text-maroon-800">Hapus task ini?</h3>
            <p className="mt-1.5 text-xs text-muted/80 leading-relaxed font-semibold">
              Task &ldquo;{detail?.judul}&rdquo; akan dihapus secara permanen dan tidak dapat dikembalikan.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setKonfirmHapusTerbuka(false)}
                disabled={sedangHapus}
                className="rounded-xl border border-cream-200 px-4 py-2 text-xs font-bold text-muted transition hover:bg-cream-100 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={tanganiHapusTask}
                disabled={sedangHapus}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {sedangHapus ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
