import AppShell from '@/components/app-shell'
import { ambilDataShell } from '@/lib/shell-data'
import { ambilProposalMenunggu } from '@/app/tugas-tersedia/actions'
import TinjauProposalList from './tinjau-proposal-list'

export default async function HalamanAdminTugasTersedia() {
  const data = await ambilDataShell()
  const proposals = await ambilProposalMenunggu()

  return (
    <AppShell data={data}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-5">
          <h2 className="text-lg font-black text-maroon-800">Pengajuan Tugas Bebas</h2>
          <p className="text-sm text-muted">
            Review dan setujui/tolak pengajuan staff untuk mengambil tugas pool.
          </p>
        </div>
        <TinjauProposalList proposalsAwal={proposals} />
      </div>
    </AppShell>
  )
}
