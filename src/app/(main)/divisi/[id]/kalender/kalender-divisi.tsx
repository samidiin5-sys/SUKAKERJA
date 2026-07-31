'use client'

import { useState, useCallback } from 'react'
import { ambilTaskKalender, type TaskKalender } from './actions'

const HARI = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const HARI_PANJANG = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const WARNA_PRIORITAS: Record<string, string> = {
  mendesak: 'bg-red-100 text-red-700 border-red-200',
  tinggi: 'bg-orange-100 text-orange-700 border-orange-200',
  sedang: 'bg-maroon-50 text-maroon-700 border-maroon-100',
  rendah: 'bg-cream-100 text-muted border-cream-200',
}

function formatLokal(tanggal: Date): string {
  return `${tanggal.getFullYear()}-${String(tanggal.getMonth() + 1).padStart(2, '0')}-${String(tanggal.getDate()).padStart(2, '0')}`
}

/** Ambil tanggal WIB dari ISO string due_date (timestamptz dari DB) */
function dueDateKeLokal(iso: string): string {
  // Tambah 7 jam (WIB) lalu slice YYYY-MM-DD
  return new Date(new Date(iso).getTime() + 7 * 3600_000).toISOString().slice(0, 10)
}

function formatTanggal(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatJam(iso: string): string {
  const d = new Date(iso)
  const jam = d.getHours()
  const menit = d.getMinutes()
  if (jam === 0 && menit === 0) return ''
  return `${String(jam).padStart(2, '0')}:${String(menit).padStart(2, '0')}`
}

function isHariIni(tanggal: Date): boolean {
  return formatLokal(tanggal) === formatLokal(new Date())
}

function ModalDetailTask({ task, onTutup }: { task: TaskKalender; onTutup: () => void }) {
  const jam = formatJam(task.dueDate)
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onTutup}>
      <div
        className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              {task.isRecurring && (
                <span className="rounded bg-maroon-50 px-1.5 py-0.5 text-[10px] font-bold text-maroon-700">Rutin ↻</span>
              )}
              {!task.completedAt && new Date(task.dueDate).getTime() < Date.now() && (
                <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">Terlambat ⚠️</span>
              )}
              <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold capitalize ${WARNA_PRIORITAS[task.prioritas] ?? ''}`}>
                {task.prioritas}
              </span>
              <span className="rounded bg-cream-100 px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                {task.boardNama}
              </span>
            </div>
            <h3 className={`mt-2 text-base font-black text-maroon-800 ${task.completedAt ? 'line-through opacity-60' : ''}`}>
              {task.judul}
            </h3>
          </div>
          <button onClick={onTutup} className="flex-shrink-0 rounded-lg p-1 text-muted hover:bg-cream-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <span className="font-semibold">{formatTanggal(task.dueDate)}{jam ? ` · ${jam}` : ''}</span>
          </div>

          {task.assignees.length > 0 && (
            <div className="flex items-start gap-2 text-muted">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0">
                <circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
              </svg>
              <span className="font-semibold">{task.assignees.map((a) => a.nama).join(', ')}</span>
            </div>
          )}

          {task.completedAt && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-600">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span className="text-xs font-bold text-emerald-700">
                Selesai · {new Date(task.completedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          )}
        </div>

        <a
          href={`/divisi/${task.id}`}
          onClick={onTutup}
          className="mt-4 block w-full rounded-xl bg-maroon-800 py-2.5 text-center text-sm font-bold text-white hover:bg-maroon-700"
        >
          Lihat Detail Lengkap
        </a>
      </div>
    </div>
  )
}

export default function KalenderDivisi({
  divisionId,
  tasksAwal,
  awalBulanIso,
  isStaff,
}: {
  divisionId: string
  tasksAwal: TaskKalender[]
  awalBulanIso: string
  isStaff: boolean
}) {
  const [bulanSaat, setBulanSaat] = useState(() => {
    const d = new Date(awalBulanIso)
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [tasks, setTasks] = useState<TaskKalender[]>(tasksAwal)
  const [sedangMuat, setSedangMuat] = useState(false)
  const [taskDipilih, setTaskDipilih] = useState<TaskKalender | null>(null)

  const muatTask = useCallback(async (mulai: Date, selesai: Date) => {
    setSedangMuat(true)
    try {
      const data = await ambilTaskKalender(divisionId, mulai.toISOString(), selesai.toISOString())
      setTasks(data)
    } catch (error) {
      console.error("Gagal memuat task kalender:", error)
    } finally {
      setSedangMuat(false)
    }
  }, [divisionId])

  function navigasiBulan(arah: -1 | 1) {
    const baru = new Date(bulanSaat.getFullYear(), bulanSaat.getMonth() + arah, 1)
    setBulanSaat(baru)
    const selesai = new Date(baru.getFullYear(), baru.getMonth() + 1, 0, 23, 59, 59, 999)
    muatTask(baru, selesai)
  }

  function keHariIni() {
    const sekarang = new Date()
    const baru = new Date(sekarang.getFullYear(), sekarang.getMonth(), 1)
    setBulanSaat(baru)
    const selesai = new Date(baru.getFullYear(), baru.getMonth() + 1, 0, 23, 59, 59, 999)
    muatTask(baru, selesai)
  }

  const hariDalamBulan = (() => {
    const tahun = bulanSaat.getFullYear()
    const bulan = bulanSaat.getMonth()
    const awalBulan = new Date(tahun, bulan, 1)
    const akhirBulan = new Date(tahun, bulan + 1, 0)
    const offsetAwal = (awalBulan.getDay() + 6) % 7

    const hari: (Date | null)[] = []
    for (let i = 0; i < offsetAwal; i++) hari.push(null)
    for (let i = 1; i <= akhirBulan.getDate(); i++) hari.push(new Date(tahun, bulan, i))
    while (hari.length % 7 !== 0) hari.push(null)
    return hari
  })()

  function taskUntukHari(tanggal: Date): TaskKalender[] {
    const kunci = formatLokal(tanggal)
    return tasks.filter((t) => dueDateKeLokal(t.dueDate) === kunci)
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => navigasiBulan(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-cream-200 bg-white text-muted hover:bg-cream-50"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="min-w-[140px] text-center text-sm font-bold text-maroon-800">
          {`${BULAN[bulanSaat.getMonth()]} ${bulanSaat.getFullYear()}`}
        </span>
        <button
          onClick={() => navigasiBulan(1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-cream-200 bg-white text-muted hover:bg-cream-50"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
        <button
          onClick={keHariIni}
          className="rounded-lg border border-cream-200 bg-white px-3 py-1.5 text-xs font-bold text-muted hover:bg-cream-50"
        >
          Hari Ini
        </button>
        {sedangMuat && <span className="text-xs text-muted animate-pulse">Memuat...</span>}
      </div>

      {/* Tampilan Bulanan */}
      <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm">
        {/* Header hari */}
        <div className="grid grid-cols-7 border-b border-cream-100">
          {HARI_PANJANG.map((h) => (
            <div key={h} className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-muted">
              {h.slice(0, 3)}
            </div>
          ))}
        </div>
        {/* Grid tanggal */}
        <div className="grid grid-cols-7">
          {hariDalamBulan.map((hari, i) => {
            if (!hari) {
              return <div key={i} className="border-b border-r border-cream-100/60 bg-cream-50/30 p-1 last:border-r-0" />
            }
            const hariIni = isHariIni(hari)
            const taskHari = taskUntukHari(hari)
            const kolom = i % 7
            return (
              <div
                key={i}
                className={`min-h-[80px] border-b border-r border-cream-100 p-1 ${kolom === 6 ? 'border-r-0' : ''} ${hariIni ? 'bg-maroon-50/30' : ''}`}
              >
                <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${hariIni ? 'bg-maroon-800 text-white' : 'text-maroon-800'}`}>
                  {hari.getDate()}
                </div>
                <div className="space-y-0.5">
                  {taskHari.slice(0, 3).map((task) => {
                    const overdue = !task.completedAt && new Date(task.dueDate).getTime() < Date.now()
                    return (
                      <button
                        key={task.id}
                        onClick={() => setTaskDipilih(task)}
                        className={`w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-semibold transition hover:opacity-80 ${
                          task.completedAt
                            ? 'bg-emerald-100 text-emerald-700 line-through'
                            : overdue
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-maroon-50 text-maroon-800'
                        }`}
                      >
                        {task.isRecurring && '↻ '}{task.judul}
                      </button>
                    )
                  })}
                  {taskHari.length > 3 && (
                    <p className="px-1 text-[10px] font-bold text-muted">+{taskHari.length - 3} lagi</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] font-semibold text-muted">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Selesai
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-500" /> Terlambat (Overdue)
        </div>
        <div className="flex items-center gap-1">
          <span className="text-maroon-500">↻</span> Tugas Rutin
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-maroon-800" /> Hari ini
        </div>
      </div>

      {/* Modal detail task */}
      {taskDipilih && (
        <ModalDetailTask task={taskDipilih} onTutup={() => setTaskDipilih(null)} />
      )}
    </div>
  )
}
