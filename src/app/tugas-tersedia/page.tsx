import AppShell from '@/components/app-shell'
import { ambilDataShell } from '@/lib/shell-data'
import { ambilTaskTersedia, ambilProposalSaya } from './actions'
import DaftarTaskTersedia from './daftar-task-tersedia'

export default async function HalamanTugasTersedia() {
  const data = await ambilDataShell()
  const [tasks, proposalSaya] = await Promise.all([ambilTaskTersedia(), ambilProposalSaya()])

  return (
    <AppShell data={data}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-5">
          <h2 className="text-lg font-black text-maroon-800">Tugas Terbuka</h2>
          <p className="text-sm text-muted">Tugas Terbuka yang tersedia untuk diambil dari semua divisi. Ambil langsung tanpa pengajuan proposal.</p>
        </div>
        <DaftarTaskTersedia tasksAwal={tasks} proposalSaya={proposalSaya} />
      </div>
    </AppShell>
  )
}
