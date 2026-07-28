'use client'

import { useState } from 'react'
import { ambilTask, type TaskTersedia } from './actions'

const WARNA_PRIORITAS: Record<string, string> = {
  mendesak: 'bg-red-100 text-red-700 border-red-200',
  tinggi: 'bg-orange-100 text-orange-700 border-orange-200',
  sedang: 'bg-maroon-50 text-maroon-700 border-maroon-100',
  rendah: 'bg-cream-100 text-muted border-cream-200',
}

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatJam(iso: string) {
  const d = new Date(iso)
  if (d.getHours() === 0 && d.getMinutes() === 0) return ''
  return ' · ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

export default function DaftarTaskTersedia({ tasksAwal }: { tasksAwal: TaskTersedia[] }) {
  const [tasks, setTasks] = useState<TaskTersedia[]>(tasksAwal)
  const [sedangAmbil, setSedangAmbil] = useState<string | null>(null)
  const [pesan, setPesan] = useState<Record<string, string>>({})

  async function tanganiAmbil(taskId: string) {
    setSedangAmbil(taskId)
    const hasil = await ambilTask(taskId)
    setSedangAmbil(null)
    if (hasil.sukses) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
    } else {
      setPesan((prev) => ({ ...prev, [taskId]: hasil.pesan }))
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-cream-200 bg-white p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cream-100">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-muted">Tidak ada tugas tersedia saat ini.</p>
        <p className="mt-1 text-xs text-muted/70">Pantau halaman ini secara berkala.</p>
      </div>
    )
  }

  return (
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
                    {formatTanggal(task.dueDate)}{formatJam(task.dueDate)}
                  </span>
                )}
                <span>Diposting oleh {task.dibuatOleh}</span>
              </div>
            </div>
          </div>

          {pesan[task.id] && (
            <p className="mt-2 text-xs text-red-600">{pesan[task.id]}</p>
          )}

          <button
            onClick={() => tanganiAmbil(task.id)}
            disabled={sedangAmbil === task.id}
            className="mt-3 w-full rounded-xl bg-maroon-800 py-2.5 text-sm font-bold text-white hover:bg-maroon-700 disabled:opacity-50 transition"
          >
            {sedangAmbil === task.id ? 'Mengambil...' : 'Ambil Tugas Ini'}
          </button>
        </div>
      ))}
    </div>
  )
}
