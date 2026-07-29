import AppShell from '@/components/app-shell'
import { ambilDataShell } from '@/lib/shell-data'
import { ambilTaskTersedia, ambilProposalSaya } from './actions'
import DaftarTaskTersedia from './daftar-task-tersedia'

export default async function HalamanTugasTersedia() {
  const data = await ambilDataShell()
  const [tasks, proposalSaya] = await Promise.all([ambilTaskTersedia(), ambilProposalSaya()])

  return (
    <AppShell data={data}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 rounded-[24px] border border-cream-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">Tugas terbuka</p>
          <h2 className="mt-1 text-lg font-black text-maroon-800">Tugas Terbuka</h2>
          <p className="mt-1 text-sm text-muted">Tugas Terbuka yang tersedia untuk diambil dari semua divisi. Ambil langsung tanpa pengajuan proposal.</p>
        </div>
        <DaftarTaskTersedia tasksAwal={tasks} proposalSaya={proposalSaya} />
      </div>
    </AppShell>
  )
}
