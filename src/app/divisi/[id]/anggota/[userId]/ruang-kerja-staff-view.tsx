'use client'

import type { RuangKerjaStaff } from '../../actions'

const WARNA_PRIORITAS: Record<string, string> = {
  mendesak: 'bg-red-100 text-red-700 border-red-200',
  tinggi: 'bg-orange-100 text-orange-700 border-orange-200',
  sedang: 'bg-maroon-50 text-maroon-700 border-maroon-100',
  rendah: 'bg-cream-100 text-muted border-cream-200',
}

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function isTerlambat(dueDate: string | null, completedAt: string | null) {
  if (!dueDate || completedAt) return false
  return new Date(dueDate) < new Date()
}

export default function RuangKerjaStaffView({
  ruangKerja,
  divisionId,
}: {
  ruangKerja: RuangKerjaStaff
  divisionId: string
}) {
  const { staff, tasks } = ruangKerja
  const inisial = staff.nama.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()

  const aktif = tasks.filter((t) => !t.completedAt)
  const selesai = tasks.filter((t) => !!t.completedAt)
  const terlambat = aktif.filter((t) => isTerlambat(t.dueDate, null))

  return (
    <div className="mx-auto max-w-2xl">
      {/* Profil Staff */}
      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-cream-200 bg-white p-5 shadow-sm">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-maroon-100 text-lg font-black text-maroon-800">
          {staff.fotoUrl ? (
            <img src={staff.fotoUrl} alt={staff.nama} className="h-14 w-14 rounded-full object-cover" />
          ) : inisial}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-black text-maroon-800">{staff.nama}</h2>
          <p className="text-sm text-muted">{staff.jabatan ?? 'Staff'}</p>
        </div>
        <a
          href={`/divisi/${divisionId}`}
          className="flex-shrink-0 rounded-xl border border-cream-200 px-3 py-2 text-xs font-bold text-muted transition hover:border-orange-400 hover:text-orange-600"
        >
          Lihat Papan Divisi
        </a>
      </div>

      {/* Statistik */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-cream-200 bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-maroon-800">{tasks.length}</p>
          <p className="mt-0.5 text-xs font-semibold text-muted">Total Tugas</p>
        </div>
        <div className="rounded-2xl border border-cream-200 bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-orange-600">{aktif.length}</p>
          <p className="mt-0.5 text-xs font-semibold text-muted">Aktif</p>
        </div>
        <div className="rounded-2xl border border-cream-200 bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-green-600">{selesai.length}</p>
          <p className="mt-0.5 text-xs font-semibold text-muted">Selesai</p>
        </div>
      </div>

      {terlambat.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" className="flex-shrink-0">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
          <p className="text-xs font-semibold text-red-700">
            {terlambat.length} tugas sudah melewati deadline
          </p>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-cream-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-muted">Belum ada tugas yang ditetapkan.</p>
        </div>
      ) : (
        <>
          {aktif.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-3 text-xs font-bold tracking-widest text-muted">AKTIF ({aktif.length})</h3>
              <div className="space-y-2">
                {aktif.map((task) => {
                  const telat = isTerlambat(task.dueDate, task.completedAt)
                  return (
                    <div key={task.id} className={`rounded-2xl border bg-white p-4 shadow-sm ${telat ? 'border-red-200' : 'border-cream-200'}`}>
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold capitalize ${WARNA_PRIORITAS[task.prioritas] ?? ''}`}>
                              {task.prioritas}
                            </span>
                            <span className="rounded bg-cream-100 px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                              {task.boardNama}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-ink">{task.judul}</p>
                          {task.dueDate && (
                            <p className={`mt-1 text-xs font-semibold ${telat ? 'text-red-600' : 'text-muted'}`}>
                              {telat ? '⚠ Terlambat · ' : 'Deadline: '}
                              {formatTanggal(task.dueDate)}
                            </p>
                          )}
                        </div>
                        <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-orange-400 mt-1" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {selesai.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-bold tracking-widest text-muted">SELESAI ({selesai.length})</h3>
              <div className="space-y-2">
                {selesai.map((task) => (
                  <div key={task.id} className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm opacity-60">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="rounded bg-cream-100 px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                            {task.boardNama}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-ink line-through">{task.judul}</p>
                        {task.completedAt && (
                          <p className="mt-1 text-xs text-muted">Selesai {formatTanggal(task.completedAt)}</p>
                        )}
                      </div>
                      <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-green-500 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
