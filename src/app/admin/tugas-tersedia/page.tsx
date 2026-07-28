import AppShell from '@/components/app-shell'
import { ambilDataShell } from '@/lib/shell-data'
import { ambilProposalMenunggu } from '@/app/tugas-tersedia/actions'
import TinjauProposalList from './tinjau-proposal-list'
import BuatTugasPoolForm from './buat-tugas-pool-form'

export default async function HalamanAdminTugasTersedia() {
  const [data, proposals] = await Promise.all([ambilDataShell(), ambilProposalMenunggu()])

  return (
    <AppShell data={data}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-5">
          <h2 className="text-lg font-black text-maroon-800">Tugas Bebas</h2>
          <p className="text-sm text-muted">
            Kelola dan buat tugas bebas baru yang bisa diambil langsung oleh staff.
          </p>
        </div>

        <BuatTugasPoolForm divisiSaya={data.divisiSaya} />

        {proposals.length > 0 && (
          <>
            <h3 className="mb-3 text-xs font-bold tracking-widest text-muted">PENGAJUAN MASUK (HISTORI)</h3>
            <TinjauProposalList proposalsAwal={proposals} />
          </>
        )}
      </div>
    </AppShell>
  )
}
