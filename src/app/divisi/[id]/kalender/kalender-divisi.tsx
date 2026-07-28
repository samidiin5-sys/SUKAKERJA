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

function mulaiMinggu(tanggal: Date): Date {
  const d = new Date(tanggal)
  const hari = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - hari)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatIso(tanggal: Date): string {
  return tanggal.toISOString().split('T')[0]
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
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function isSamaHari(isoA: string, isoB: string): boolean {
  return isoA.split('T')[0] === isoB.split('T')[0]
}

function isHariIni(tanggal: Date): boolean {
  const sekarang = new Date()
  return formatIso(tanggal) === formatIso(sekarang)
}

function CardTask({ task, onClick }: { task: TaskKalender; onClick: () => void }) {
  const jam = formatJam(task.dueDate)
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg border p-2 text-left transition hover:shadow-sm ${
        task.completedAt
          ? 'border-emerald-200 bg-emerald-50 opacity-70'
          : 'border-cream-200 bg-white hover:border-orange-300'
      }`}
    >
      <div className="flex items-start justify-between gap-1">
        <p className={`text-xs font-semibold leading-snug ${task.completedAt ? 'line-through text-muted' : 'text-ink'}`}>
          {task.isRecurring && <span className="mr-1 text-maroon-500">↻</span>}
          {task.judul}
        </p>
        {task.completedAt && (
          <span className="mt-0.5 flex-shrink-0 text-emerald-500">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
        )}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1">
        <span className={`rounded border px-1 py-0.5 text-[9px] font-bold capitalize ${WARNA_PRIORITAS[task.prioritas] ?? ''}`}>
          {task.prioritas}
        </span>
        {jam && (
          <span className="text-[10px] font-semibold text-muted">{jam}</span>
        )}
      </div>
      {task.assignees.length > 0 && (
        <div className="mt-1.5 flex -space-x-1">
          {task.assignees.slice(0, 3).map((a) => (
            <div
              key={a.id}
              title={a.nama}
              className="flex h-4 w-4 items-center justify-center overflow-hidden rounded-full border border-white bg-maroon-700 text-[8px] font-bold text-white"
            >
              {a.fotoUrl ? (
                <img src={a.fotoUrl} alt={a.nama} className="h-full w-full object-cover" />
              ) : (
                a.nama[0]?.toUpperCase()
              )}
            </div>
          ))}
          {task.assignees.length > 3 && (
            <div className="flex h-4 w-4 items-center justify-center rounded-full border border-white bg-cream-200 text-[8px] font-bold text-muted">
              +{task.assignees.length - 3}
            </div>
          )}
        </div>
      )}
    </button>
  )
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
  awalMingguIso,
  isStaff,
}: {
  divisionId: string
  tasksAwal: TaskKalender[]
  awalMingguIso: string
  isStaff: boolean
}) {
  const [mode, setMode] = useState<'minggu' | 'bulan'>('minggu')
  const [awalMingguSaat, setAwalMingguSaat] = useState(() => new Date(awalMingguIso))
  const [bulanSaat, setBulanSaat] = useState(() => {
    const d = new Date(awalMingguIso)
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [tasks, setTasks] = useState<TaskKalender[]>(tasksAwal)
  const [sedangMuat, setSedangMuat] = useState(false)
  const [taskDipilih, setTaskDipilih] = useState<TaskKalender | null>(null)

  const muatTask = useCallback(async (mulai: Date, selesai: Date) => {
    setSedangMuat(true)
    const data = await ambilTaskKalender(divisionId, mulai.toISOString(), selesai.toISOString())
    setTasks(data)
    setSedangMuat(false)
  }, [divisionId])

  function navigasiMinggu(arah: -1 | 1) {
    const baru = new Date(awalMingguSaat)
    baru.setDate(baru.getDate() + arah * 7)
    setAwalMingguSaat(baru)
    const selesai = new Date(baru)
    selesai.setDate(baru.getDate() + 6)
    selesai.setHours(23, 59, 59, 999)
    muatTask(baru, selesai)
  }

  function navigasiBulan(arah: -1 | 1) {
    const baru = new Date(bulanSaat.getFullYear(), bulanSaat.getMonth() + arah, 1)
    setBulanSaat(baru)
    const selesai = new Date(baru.getFullYear(), baru.getMonth() + 1, 0, 23, 59, 59, 999)
    muatTask(baru, selesai)
  }

  function keHariIni() {
    if (mode === 'minggu') {
      const baru = mulaiMinggu(new Date())
      setAwalMingguSaat(baru)
      const selesai = new Date(baru)
      selesai.setDate(baru.getDate() + 6)
      selesai.setHours(23, 59, 59, 999)
      muatTask(baru, selesai)
    } else {
      const sekarang = new Date()
      const baru = new Date(sekarang.getFullYear(), sekarang.getMonth(), 1)
      setBulanSaat(baru)
      const selesai = new Date(baru.getFullYear(), baru.getMonth() + 1, 0, 23, 59, 59, 999)
      muatTask(baru, selesai)
    }
  }

  // --- TAMPILAN MINGGUAN ---
  const hariMinggu = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(awalMingguSaat)
    d.setDate(awalMingguSaat.getDate() + i)
    return d
  })

  const labelMinggu = (() => {
    const akhir = hariMinggu[6]
    if (awalMingguSaat.getMonth() === akhir.getMonth()) {
      return `${awalMingguSaat.getDate()}–${akhir.getDate()} ${BULAN[awalMingguSaat.getMonth()]} ${awalMingguSaat.getFullYear()}`
    }
    return `${awalMingguSaat.getDate()} ${BULAN[awalMingguSaat.getMonth()]} – ${akhir.getDate()} ${BULAN[akhir.getMonth()]} ${akhir.getFullYear()}`
  })()

  // --- TAMPILAN BULANAN ---
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
    const iso = formatIso(tanggal)
    return tasks.filter((t) => t.dueDate.startsWith(iso))
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => mode === 'minggu' ? navigasiMinggu(-1) : navigasiBulan(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-cream-200 bg-white text-muted hover:bg-cream-50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span className="text-sm font-bold text-maroon-800">
            {mode === 'minggu' ? labelMinggu : `${BULAN[bulanSaat.getMonth()]} ${bulanSaat.getFullYear()}`}
          </span>
          <button
            onClick={() => mode === 'minggu' ? navigasiMinggu(1) : navigasiBulan(1)}
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

        <div className="flex rounded-lg border border-cream-200 bg-white p-0.5">
          <button
            onClick={() => {
              setMode('minggu')
              const baru = mulaiMinggu(new Date(bulanSaat.getFullYear(), bulanSaat.getMonth(), 1))
              setAwalMingguSaat(baru)
              const selesai = new Date(baru)
              selesai.setDate(baru.getDate() + 6)
              selesai.setHours(23, 59, 59, 999)
              muatTask(baru, selesai)
            }}
            className={`rounded-md px-3 py-1 text-xs font-bold transition ${mode === 'minggu' ? 'bg-maroon-800 text-white' : 'text-muted hover:bg-cream-50'}`}
          >
            Minggu
          </button>
          <button
            onClick={() => {
              setMode('bulan')
              const baru = new Date(awalMingguSaat.getFullYear(), awalMingguSaat.getMonth(), 1)
              setBulanSaat(baru)
              const selesai = new Date(baru.getFullYear(), baru.getMonth() + 1, 0, 23, 59, 59, 999)
              muatTask(baru, selesai)
            }}
            className={`rounded-md px-3 py-1 text-xs font-bold transition ${mode === 'bulan' ? 'bg-maroon-800 text-white' : 'text-muted hover:bg-cream-50'}`}
          >
            Bulan
          </button>
        </div>
      </div>

      {/* Tampilan Mingguan */}
      {mode === 'minggu' && (
        <div className="overflow-x-auto rounded-2xl border border-cream-200 bg-white shadow-sm">
          <div className="grid min-w-[560px]" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
            {hariMinggu.map((hari, i) => {
              const hariIni = isHariIni(hari)
              const taskHari = taskUntukHari(hari)
              return (
                <div key={i} className={`border-r border-cream-100 last:border-r-0 ${hariIni ? 'bg-maroon-50/40' : ''}`}>
                  {/* Header hari */}
                  <div className={`border-b border-cream-100 px-2 py-2 text-center ${hariIni ? 'bg-maroon-800' : ''}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${hariIni ? 'text-cream-200' : 'text-muted'}`}>
                      {HARI[i]}
                    </p>
                    <p className={`text-sm font-black ${hariIni ? 'text-white' : 'text-maroon-800'}`}>
                      {hari.getDate()}
                    </p>
                  </div>
                  {/* Task */}
                  <div className="min-h-[120px] space-y-1.5 p-1.5">
                    {taskHari.map((task) => (
                      <CardTask key={task.id} task={task} onClick={() => setTaskDipilih(task)} />
                    ))}
                    {taskHari.length === 0 && (
                      <p className="pt-2 text-center text-[10px] text-muted/40">—</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tampilan Bulanan */}
      {mode === 'bulan' && (
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
                    {taskHari.slice(0, 3).map((task) => (
                      <button
                        key={task.id}
                        onClick={() => setTaskDipilih(task)}
                        className={`w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-semibold transition hover:opacity-80 ${
                          task.completedAt
                            ? 'bg-emerald-100 text-emerald-700 line-through'
                            : 'bg-maroon-50 text-maroon-800'
                        }`}
                      >
                        {task.isRecurring && '↻ '}{task.judul}
                      </button>
                    ))}
                    {taskHari.length > 3 && (
                      <p className="px-1 text-[10px] font-bold text-muted">+{taskHari.length - 3} lagi</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Legenda */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] font-semibold text-muted">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Selesai
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
