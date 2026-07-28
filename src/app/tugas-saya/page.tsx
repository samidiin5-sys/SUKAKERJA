import AppShell from '@/components/app-shell'
import { ambilDataShell } from '@/lib/shell-data'
import { ambilTugasSaya, ambilTaskKalenderSaya } from './actions'
import TugasSayaView from './tugas-saya-view'

function mulaiMinggu(d: Date): Date {
  const x = new Date(d)
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  x.setHours(0, 0, 0, 0)
  return x
}

export default async function HalamanTugasSaya({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const [data, params] = await Promise.all([ambilDataShell(), searchParams])
  const viewAwal = params.view === 'kalender' ? 'kalender' : 'daftar'

  const awalMinggu = mulaiMinggu(new Date())
  const akhirMinggu = new Date(awalMinggu)
  akhirMinggu.setDate(awalMinggu.getDate() + 6)
  akhirMinggu.setHours(23, 59, 59, 999)

  const [tugas, tasksKalender] = await Promise.all([
    ambilTugasSaya(),
    ambilTaskKalenderSaya(awalMinggu.toISOString(), akhirMinggu.toISOString()),
  ])

  return (
    <AppShell data={data}>
      <TugasSayaView
        tugasAwal={tugas}
        tasksKalenderAwal={tasksKalender}
        awalMingguIso={awalMinggu.toISOString()}
        viewAwal={viewAwal as 'daftar' | 'kalender'}
      />
    </AppShell>
  )
}
