import { redirect } from 'next/navigation'
import { ambilDataShell } from '@/lib/shell-data'
import { ambilProposalMenunggu } from '@/app/(main)/tugas-tersedia/actions'
import { ambilTaskPoolAktif } from './actions'
import TinjauProposalList from './tinjau-proposal-list'
import BuatTugasPoolForm from './buat-tugas-pool-form'
import DaftarTaskPoolAktif from './daftar-task-pool-aktif'

export default async function HalamanAdminTugasTersedia() {
  const [data, proposals, taskAktif] = await Promise.all([
    ambilDataShell(),
    ambilProposalMenunggu(),
    ambilTaskPoolAktif(),
  ])

  if (data.roleSistem !== 'super_admin' && data.roleSistem !== 'owner') {
    redirect('/dashboard')
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Header section */}
      <div className="mb-5 rounded-[24px] border border-cream-200 bg-white p-5 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">Pool Pekerjaan</p>
        <h2 className="mt-1 text-lg font-black text-maroon-800">Tugas Terbuka</h2>
        <p className="mt-1 text-sm text-muted">
          Buat tugas yang bisa diambil langsung oleh staff — lintas divisi atau divisi tertentu.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Guidelines / Kebijakan */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-[24px] border border-cream-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-xs font-bold tracking-widest text-muted uppercase">Panduan Tugas Terbuka</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4l3 3" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-ink">Bebas Ambil Mandiri</p>
                  <p className="mt-0.5 text-[11px] text-muted leading-relaxed font-semibold">
                    Staff dapat langsung mengklaim tugas ini ke ruang kerja mereka tanpa memerlukan persetujuan proposal terlebih dahulu.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v2M8 2v2M3 10h18" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-ink">Deadline Wajib</p>
                  <p className="mt-0.5 text-[11px] text-muted leading-relaxed font-semibold">
                    Setiap tugas terbuka wajib mencantumkan tanggal batas waktu pengerjaan sebagai patokan kerja staff.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M17 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-ink">Lintas Divisi</p>
                  <p className="mt-0.5 text-[11px] text-muted leading-relaxed font-semibold">
                    Memudahkan pembagian kerja ad-hoc yang bersifat umum agar dapat dikerjakan oleh staff dari divisi lain.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Form, Active Tasks & Proposals */}
        <div className="lg:col-span-2 space-y-6">
          <BuatTugasPoolForm divisiSaya={data.divisiSaya} />

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-[0.24em] text-muted uppercase">Tugas Aktif ({taskAktif.length})</h3>
              <span className="rounded-full bg-cream-100 px-2.5 py-1 text-[10px] font-semibold text-muted shadow-sm">Pool Aktif</span>
            </div>
            <DaftarTaskPoolAktif tasksAwal={taskAktif} />
          </div>

          {proposals.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-bold tracking-[0.24em] text-muted uppercase">Pengajuan Masuk ({proposals.length})</h3>
                <span className="rounded-full bg-cream-100 px-2.5 py-1 text-[10px] font-semibold text-muted shadow-sm">Butuh Review</span>
              </div>
              <TinjauProposalList proposalsAwal={proposals} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
