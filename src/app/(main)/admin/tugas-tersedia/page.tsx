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

  return (
    <div className="mx-auto max-w-2xl">
        <div className="mb-5">
          <h2 className="text-lg font-black text-maroon-800">Tugas Terbuka</h2>
          <p className="text-sm text-muted">
            Buat tugas yang bisa diambil langsung oleh staff — lintas divisi atau divisi tertentu.
          </p>
        </div>

        <BuatTugasPoolForm divisiSaya={data.divisiSaya} />

        <div className="mt-6">
          <h3 className="mb-3 text-xs font-bold tracking-widest text-muted">TUGAS AKTIF ({taskAktif.length})</h3>
          <DaftarTaskPoolAktif tasksAwal={taskAktif} />
        </div>

        {proposals.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 text-xs font-bold tracking-widest text-muted">PENGAJUAN MASUK</h3>
            <TinjauProposalList proposalsAwal={proposals} />
          </div>
        )}
      </div>
  )
}
