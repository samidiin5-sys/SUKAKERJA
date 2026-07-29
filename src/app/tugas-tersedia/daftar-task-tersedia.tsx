'use client'

import { useState } from 'react'
import { ambilTaskBebasLangsung, type TaskTersedia, type ProposalSaya } from './actions'

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
  const h = d.getHours()
  const m = d.getMinutes()
  if (h === 0 && m === 0) return ''
  return ` · ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export default function DaftarTaskTersedia({
  tasksAwal,
  proposalSaya = [],
}: {
  tasksAwal: TaskTersedia[]
  proposalSaya?: ProposalSaya[]
}) {
  const [tasks, setTasks] = useState<TaskTersedia[]>(tasksAwal)
  const [sedangAmbil, setSedangAmbil] = useState<Record<string, boolean>>({})
  const [pesan, setPesan] = useState<Record<string, { sukses: boolean; teks: string }>>({})

  async function tanganiAmbilTugas(taskId: string) {
    setSedangAmbil((prev) => ({ ...prev, [taskId]: true }))
    setPesan((prev) => ({ ...prev, [taskId]: { sukses: false, teks: '' } }))

    const hasil = await ambilTaskBebasLangsung(taskId)
    setSedangAmbil((prev) => ({ ...prev, [taskId]: false }))

    if (hasil.sukses) {
      setPesan((prev) => ({ ...prev, [taskId]: { sukses: true, teks: 'Berhasil diambil! Tugas sudah masuk ke Tugas Saya.' } }))
      // Hapus dari list tugas tersedia setelah 1.5 detik
      setTimeout(() => {
        setTasks((prev) => prev.filter((t) => t.id !== taskId))
      }, 1500)
    } else {
      setPesan((prev) => ({ ...prev, [taskId]: { sukses: false, teks: hasil.pesan } }))
    }
  }

  const adaTask = tasks.length > 0
  const adaProposal = proposalSaya.length > 0

  return (
    <>
      {adaProposal && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-black tracking-widest text-maroon-800">PENGAJUAN SAYA (LAMA)</h2>
          <div className="space-y-2">
            {proposalSaya.map((p) => (
              <div key={p.id} className="rounded-[20px] border border-cream-200 bg-white/95 p-3 shadow-sm transition hover:border-maroon-200 hover:shadow-md">
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
                  <span className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-bold capitalize ${WARNA_STATUS[p.status] ?? ''}`}>
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
          <p className="text-sm font-semibold text-muted">Tidak ada tugas terbuka tersedia saat ini.</p>
          <p className="mt-1 text-xs text-muted/70">Tugas Terbuka yang tersedia untuk diambil dari semua divisi akan muncul di sini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-[22px] border border-cream-200 bg-white/95 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-maroon-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold capitalize ${WARNA_PRIORITAS[task.prioritas] ?? ''}`}>
                      {task.prioritas}
                    </span>
                    <span className="rounded bg-cream-100 px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                      {task.divisiNama}
                    </span>
                    {task.targetScope === 'semua' ? (
                      <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                        🌐 Lintas Divisi
                      </span>
                    ) : (
                      <span className="rounded border border-purple-200 bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-700">
                        🏢 Divisi Ini
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1.5 text-sm font-bold text-maroon-800">{task.judul}</h3>
                  {task.deskripsi && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted">{task.deskripsi}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted">
                    {task.dueDate && (
                      <span className="flex items-center gap-1 font-semibold text-orange-700">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                        Deadline: {formatTanggal(task.dueDate)}{formatWaktu(task.dueDate)}
                      </span>
                    )}
                    <span>Diposting oleh {task.dibuatOleh}</span>
                  </div>
                </div>
              </div>

              {pesan[task.id]?.teks && (
                <p className={`mt-2 text-xs font-bold ${pesan[task.id].sukses ? 'text-green-700' : 'text-red-600'}`}>
                  {pesan[task.id].teks}
                </p>
              )}

              <button
                onClick={() => tanganiAmbilTugas(task.id)}
                disabled={sedangAmbil[task.id] || pesan[task.id]?.sukses}
                className="mt-3 w-full rounded-[16px] bg-maroon-800 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-maroon-700 disabled:opacity-50"
              >
                {sedangAmbil[task.id] ? 'Mengambil Tugas...' : pesan[task.id]?.sukses ? 'Tugas Diambil ✓' : 'Ambil Tugas Ini'}
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
