import AppShell from '@/components/app-shell'
import { ambilDataShell } from '@/lib/shell-data'
import { ambilTugasSaya } from './actions'
import DaftarTugasSaya from './daftar-tugas-saya'

export default async function HalamanTugasSaya() {
  const data = await ambilDataShell()
  const tugas = await ambilTugasSaya()

  return (
    <AppShell data={data}>
      <DaftarTugasSaya tugasAwal={tugas} />
    </AppShell>
  )
}
