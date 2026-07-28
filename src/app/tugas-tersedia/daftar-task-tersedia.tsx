'use client'

import { useState } from 'react'
import { ajukanPengambilanTask, type TaskTersedia, type ProposalSaya } from './actions'

const WARNA_PRIORITAS: Record<string, string> = {
  mendesak: 'bg-red-100 text-red-700 border-red-200',
  tinggi: 'bg-orange-100 text-orange-700 border-orange-200',
  sedang: 'bg-maroon-50 text-maroon-700 border-maroon-100',
  rendah: 'bg-cream-100 text-muted border-cream-200',
}

const WARNA_STATUS: Record<string, string> = {
  menunggu: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  disetujui: 'bg-green-100 text-green-700 border-green-200',
  ditolak: 'bg-red-100 text-red-700 border-red-200',
}

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatWaktu(iso: string) {
  const d = new Date(iso)
  if (d.getHours() === 0 && d.getMinutes() === 0) return ''
  return ' · ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function formatDatetimeLocal(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function ModalProposal({
  task,
  onClose,
  onAjukan,
}: {
  task: TaskTersedia
  onClose: () => void
  onAjukan: (deadlineDiusulkan: string, pesan: string) => Promise<void>
}) {
  const minDatetime = new Date()
  minDatetime.setMinutes(minDatetime.getMinutes() + 30)
  const minStr = formatDatetimeLocal(minDatetime.toISOString())

  const [deadline, setDeadline] = useState(task.dueDate ? formatDatetimeLocal(task.dueDate) : '')
  const [pesan, setPesan] = useState('')
  const [sedang, setSedang] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function tangani(e: React.FormEvent) {
    e.preventDefault()
    if (!deadline) { setError('Isi tanggal & jam deadline dulu'); return }
    setSedang(true)
    setError(null)
    try {
      await onAjukan(deadline, pesan)
    } catch {
      setError('Gagal mengajukan. Coba lagi.')
      setSedang(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-black text-maroon-800">Ajukan Pengambilan Tugas</h2>
          <button onClick={onClose} className="text-lg text-muted hover:text-ink">✕</button>
        </div>

        <div className="mb-4 rounded-xl border border-cream-200 bg-cream-50 p-3">
          <p className="text-xs font-bold text-ink">{task.judul}</p>
          <p className="mt-0.5 text-[10px] text-muted">{task.divisiNama}</p>
          {task.dueDate && (
            <p className="mt-1 text-[10px] text-orange-600">
              Deadline owner: {formatTanggal(task.dueDate)}{formatWaktu(task.dueDate)}
            </p>
          )}
        </div>

        <form onSubmit={tangani} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">
              Kapan kamu sanggup selesaikan? <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={deadline}
              min={minStr}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2.5 text-sm text-ink outline-none focus:border-orange-500"
            />
            <p className="mt-1 text-[10px] text-muted">Pilih tanggal dan jam. Owner akan review deadline ini.</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">
              Pesan ke owner <span className="text-[10px] font-normal">(opsional)</span>
            </label>
            <textarea
              value={pesan}
              onChange={(e) => setPesan(e.target.value)}
              rows={2}
              placeholder="Kenapa kamu cocok untuk tugas ini, atau catatan apapun..."
              className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2.5 text-sm text-ink outline-none focus:border-orange-500"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

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
              disabled={sedang}
              className="rounded-xl bg-maroon-800 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-maroon-700 disabled:opacity-50"
            >
              {sedang ? 'Mengajukan...' : 'Kirim Pengajuan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function DaftarTaskTersedia({
  tasksAwal,
  proposalSaya,
}: {
  tasksAwal: TaskTersedia[]
  proposalSaya: ProposalSaya[]
}) {
  const [tasks, setTasks] = useState<TaskTersedia[]>(tasksAwal)
  const [modalTask, setModalTask] = useState<TaskTersedia | null>(null)
  const [pesan, setPesan] = useState<Record<string, string>>({})

  async function tanganiAjukan(deadlineDiusulkan: string, pesanStaff: string) {
    if (!modalTask) return
    const hasil = await ajukanPengambilanTask(modalTask.id, deadlineDiusulkan, pesanStaff)
    if (hasil.sukses) {
      setTasks((prev) => prev.map((t) => t.id === modalTask.id ? { ...t, sudahDiajukan: true } : t))
      setModalTask(null)
    } else {
      throw new Error(hasil.pesan)
    }
  }

  const adaTask = tasks.length > 0
  const adaProposal = proposalSaya.length > 0

  return (
    <>
      {modalTask && (
        <ModalProposal
          task={modalTask}
          onClose={() => setModalTask(null)}
          onAjukan={tanganiAjukan}
        />
      )}

      {adaProposal && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-black tracking-widest text-maroon-800">PENGAJUAN SAYA</h2>
          <div className="space-y-2">
            {proposalSaya.map((p) => (
              <div key={p.id} className="rounded-xl border border-cream-200 bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-ink">{p.taskJudul}</p>
                    <p className="text-[10px] text-muted">{p.divisiNama}</p>
                    <p className="mt-1 text-[10px] text-muted">
                      Deadline diusulkan: {formatTanggal(p.deadlineDiusulkan)}{formatWaktu(p.deadlineDiusulkan)}
                    </p>
                    {p.catatanOwner && (
                      <p className="mt-1 text-[10px] text-orange-700">Catatan owner: {p.catatanOwner}</p>
                    )}
                  </div>
                  <span className={`flex-shrink-0 rounded border px-2 py-0.5 text-[10px] font-bold capitalize ${WARNA_STATUS[p.status] ?? ''}`}>
                    {p.status === 'menunggu' ? 'Menunggu' : p.status === 'disetujui' ? 'Disetujui ✓' : 'Ditolak'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="mb-3 text-sm font-black tracking-widest text-maroon-800">TUGAS TERSEDIA</h2>

      {!adaTask ? (
        <div className="rounded-2xl border border-cream-200 bg-white p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cream-100">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-muted">Tidak ada tugas tersedia saat ini.</p>
          <p className="mt-1 text-xs text-muted/70">Pantau halaman ini secara berkala.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold capitalize ${WARNA_PRIORITAS[task.prioritas] ?? ''}`}>
                      {task.prioritas}
                    </span>
                    <span className="rounded bg-cream-100 px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                      {task.divisiNama}
                    </span>
                  </div>
                  <h3 className="mt-1.5 text-sm font-bold text-maroon-800">{task.judul}</h3>
                  {task.deskripsi && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted">{task.deskripsi}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted">
                    {task.dueDate && (
                      <span className="flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                        {formatTanggal(task.dueDate)}{formatWaktu(task.dueDate)}
                      </span>
                    )}
                    <span>Diposting oleh {task.dibuatOleh}</span>
                  </div>
                </div>
              </div>

              {pesan[task.id] && (
                <p className="mt-2 text-xs text-red-600">{pesan[task.id]}</p>
              )}

              {task.sudahDiajukan ? (
                <div className="mt-3 rounded-xl bg-yellow-50 py-2.5 text-center text-xs font-semibold text-yellow-700 border border-yellow-200">
                  Pengajuan dikirim — menunggu persetujuan owner
                </div>
              ) : (
                <button
                  onClick={() => setModalTask(task)}
                  className="mt-3 w-full rounded-xl bg-maroon-800 py-2.5 text-sm font-bold text-white hover:bg-maroon-700 transition"
                >
                  Ambil Tugas Ini
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
