import { ambilTugasSaya, ambilTaskKalenderSaya } from './actions'
import TugasSayaView from './tugas-saya-view'

export default async function HalamanTugasSaya({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const params = await searchParams
  const viewAwal = params.view === 'kalender' ? 'kalender' : 'daftar'

  const sekarang = new Date()
  const awalBulan = new Date(sekarang.getFullYear(), sekarang.getMonth(), 1)
  const akhirBulan = new Date(sekarang.getFullYear(), sekarang.getMonth() + 1, 0, 23, 59, 59, 999)

  const [tugas, tasksKalender] = await Promise.all([
    ambilTugasSaya(),
    ambilTaskKalenderSaya(awalBulan.toISOString(), akhirBulan.toISOString()),
  ])

  return (
    <TugasSayaView
      tugasAwal={tugas}
      tasksKalenderAwal={tasksKalender}
      awalBulanIso={awalBulan.toISOString()}
      viewAwal={viewAwal as 'daftar' | 'kalender'}
    />
  )
}
