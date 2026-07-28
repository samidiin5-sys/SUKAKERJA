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
          <h2 className="text-lg font-black text-maroon-800">Tugas Tersedia</h2>
          <p className="text-sm text-muted">Tugas bebas yang bisa kamu ambil. Ajukan deadline ke owner untuk dikonfirmasi.</p>
        </div>
        <DaftarTaskTersedia tasksAwal={tasks} proposalSaya={proposalSaya} />
      </div>
    </AppShell>
  )
}
