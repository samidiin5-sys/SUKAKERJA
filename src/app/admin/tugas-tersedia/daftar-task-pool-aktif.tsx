'use client'

import { useState } from 'react'
import { hapusTugasPool, type TaskPoolAktif } from './actions'

const WARNA_PRIORITAS: Record<string, string> = {
  mendesak: 'bg-red-100 text-red-700 border-red-200',
  tinggi: 'bg-orange-100 text-orange-700 border-orange-200',
  sedang: 'bg-maroon-50 text-maroon-700 border-maroon-100',
  rendah: 'bg-cream-100 text-muted border-cream-200',
}

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function DaftarTaskPoolAktif({ tasksAwal }: { tasksAwal: TaskPoolAktif[] }) {
  const [tasks, setTasks] = useState<TaskPoolAktif[]>(tasksAwal)
  const [konfirmHapus, setKonfirmHapus] = useState<string | null>(null)
  const [sedangHapus, setSedangHapus] = useState(false)
  const [pesan, setPesan] = useState<{ sukses: boolean; teks: string } | null>(null)

  async function tanganiHapus(taskId: string) {
    setSedangHapus(true)
    const hasil = await hapusTugasPool(taskId)
    setSedangHapus(false)
    setKonfirmHapus(null)
    if (hasil.sukses) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
    } else {
      setPesan({ sukses: false, teks: hasil.pesan ?? 'Gagal menghapus.' })
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-cream-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-muted">Belum ada tugas terbuka aktif yang kamu buat.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {pesan && (
          <p className={`text-xs font-semibold ${pesan.sukses ? 'text-green-700' : 'text-red-600'}`}>
            {pesan.teks}
          </p>
        )}
        {tasks.map((task) => (
          <div key={task.id} className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold capitalize ${WARNA_PRIORITAS[task.prioritas] ?? ''}`}>
                    {task.prioritas}
                  </span>
                  {task.targetScope === 'semua' ? (
                    <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                      Semua Staff
                    </span>
                  ) : (
                    <span className="rounded border border-purple-200 bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-700">
                      {task.divisiNama}
                    </span>
                  )}
                  {task.jumlahPeminat > 0 && (
                    <span className="rounded bg-orange-50 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">
                      {task.jumlahPeminat} pengajuan
                    </span>
                  )}
                </div>
                <h3 className="mt-1.5 text-sm font-bold text-maroon-800">{task.judul}</h3>
                {task.deskripsi && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted">{task.deskripsi}</p>
                )}
                <p className="mt-1.5 text-[10px] text-muted">
                  Dibuat {formatTanggal(task.createdAt)}
                  {task.dueDate && (
                    <> · <span className="font-semibold text-orange-700">Deadline: {formatTanggal(task.dueDate)}</span></>
                  )}
                </p>
              </div>
              <button
                onClick={() => setKonfirmHapus(task.id)}
                className="flex-shrink-0 rounded-lg border border-red-200 px-2.5 py-1.5 text-[10px] font-bold text-red-600 transition hover:bg-red-50"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      {konfirmHapus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-base font-black text-maroon-800">Hapus tugas terbuka ini?</h3>
            <p className="mt-1.5 text-sm text-muted">
              Tugas akan dihapus dan tidak lagi terlihat oleh staff. Pengajuan yang ada juga akan diabaikan.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setKonfirmHapus(null)}
                disabled={sedangHapus}
                className="rounded-xl border border-cream-200 px-4 py-2 text-sm font-bold text-muted transition hover:bg-cream-100 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={() => tanganiHapus(konfirmHapus)}
                disabled={sedangHapus}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {sedangHapus ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
