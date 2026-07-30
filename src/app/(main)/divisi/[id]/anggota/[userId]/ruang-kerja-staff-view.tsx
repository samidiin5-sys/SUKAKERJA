'use client'

import type { RuangKerjaStaff } from '../../actions'

const WARNA_PRIORITAS: Record<string, { bg: string; text: string; dot: string }> = {
  mendesak: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
  tinggi: { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', dot: 'bg-orange-400' },
  sedang: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400' },
  rendah: { bg: 'bg-cream-50 border-cream-200', text: 'text-muted', dot: 'bg-cream-400' },
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
  divisiNama,
  divisiWarna,
}: {
  ruangKerja: RuangKerjaStaff
  divisionId: string
  divisiNama: string
  divisiWarna: string
}) {
  const { staff, tasks } = ruangKerja
  const inisial = staff.nama.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()

  const aktif = tasks.filter((t) => !t.completedAt)
  const selesai = tasks.filter((t) => !!t.completedAt)
  const terlambat = aktif.filter((t) => isTerlambat(t.dueDate, null))

  return (
    <div>
      {/* Banner monitoring — pembeda utama dari Papan Divisi */}
      <div
        className="mb-6 overflow-hidden rounded-2xl shadow-sm"
        style={{ background: `linear-gradient(135deg, ${divisiWarna}18 0%, ${divisiWarna}08 100%)`, border: `1px solid ${divisiWarna}40` }}
      >
        <div className="h-1.5 w-full" style={{ backgroundColor: divisiWarna }} />
        <div className="flex items-center gap-4 px-5 py-4">
          {/* Avatar besar */}
          <div
            className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl text-xl font-black text-white shadow-md"
            style={{ backgroundColor: divisiWarna }}
          >
            {staff.fotoUrl ? (
              <img src={staff.fotoUrl} alt={staff.nama} className="h-16 w-16 rounded-2xl object-cover" />
            ) : inisial}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-center gap-2">
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white" style={{ backgroundColor: divisiWarna }}>
                Ruang Kerja
              </span>
            </div>
            <h2 className="text-xl font-black text-maroon-800">{staff.nama}</h2>
            <p className="text-sm text-muted">{staff.jabatan ?? 'Staff'} · {divisiNama}</p>
          </div>

          <a
            href={`/divisi/${divisionId}/anggota`}
            className="flex-shrink-0 flex items-center gap-1.5 rounded-xl border border-cream-200 bg-white px-3 py-2 text-xs font-bold text-muted transition hover:border-orange-400 hover:text-orange-600 shadow-sm"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Daftar Staff
          </a>
        </div>
      </div>

      {/* 3 kartu statistik */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-cream-200 bg-white p-4 text-center shadow-sm">
          <p className="text-3xl font-black text-maroon-800">{tasks.length}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted">Total Tugas</p>
        </div>
        <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4 text-center shadow-sm">
          <p className="text-3xl font-black text-orange-600">{aktif.length}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-orange-500">Sedang Aktif</p>
        </div>
        <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-center shadow-sm">
          <p className="text-3xl font-black text-green-600">{selesai.length}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-green-600">Selesai</p>
        </div>
      </div>

      {/* Peringatan terlambat */}
      {terlambat.length > 0 && (
        <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" className="flex-shrink-0">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
          <p className="text-xs font-bold text-red-700">
            {terlambat.length} tugas melewati deadline — perlu perhatian segera
          </p>
        </div>
      )}

      {/* Daftar tugas */}
      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cream-300 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cream-100">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-muted">
              <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 9h6M9 12h6M9 15h4" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-muted">Belum ada tugas untuk {staff.nama}.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {aktif.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-orange-400" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-maroon-800">Sedang Dikerjakan ({aktif.length})</h3>
              </div>
              <div className="space-y-2">
                {aktif.map((task) => {
                  const telat = isTerlambat(task.dueDate, task.completedAt)
                  const prio = WARNA_PRIORITAS[task.prioritas] ?? WARNA_PRIORITAS.rendah
                  return (
                    <div
                      key={task.id}
                      className={`rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md ${telat ? 'border-red-200 bg-red-50/30' : 'border-cream-200'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${prio.dot}`} />
                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                            <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold capitalize ${prio.bg} ${prio.text}`}>
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
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {selesai.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted">Sudah Selesai ({selesai.length})</h3>
              </div>
              <div className="space-y-2">
                {selesai.map((task) => (
                  <div key={task.id} className="rounded-xl border border-cream-200 bg-white p-4 shadow-sm opacity-60">
                    <div className="flex items-start gap-3">
                      <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-green-500" />
                      <div className="min-w-0 flex-1">
                        <span className="rounded bg-cream-100 px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                          {task.boardNama}
                        </span>
                        <p className="mt-1 text-sm font-semibold text-ink line-through">{task.judul}</p>
                        {task.completedAt && (
                          <p className="mt-0.5 text-xs text-muted">Selesai {formatTanggal(task.completedAt)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
