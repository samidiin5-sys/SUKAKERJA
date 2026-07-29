import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { ambilDataShell } from '@/lib/shell-data'
import { ambilDetailDivisi, ambilRuangKerjaStaff } from '../../actions'
import RuangKerjaStaffView from './ruang-kerja-staff-view'

export default async function HalamanRuangKerjaStaff({
  params,
}: {
  params: Promise<{ id: string; userId: string }>
}) {
  const { id, userId } = await params
  const data = await ambilDataShell()

  if (data.roleSistem === 'user') redirect(`/divisi/${id}`)

  const [divisi, ruangKerja] = await Promise.all([
    ambilDetailDivisi(id),
    ambilRuangKerjaStaff(id, userId),
  ])

  if (!divisi || !ruangKerja) redirect(`/divisi/${id}/anggota`)

  return (
    <AppShell data={data}>
      <RuangKerjaStaffView
        ruangKerja={ruangKerja}
        divisionId={id}
        divisiNama={divisi.nama}
        divisiWarna={divisi.warna}
      />
    </AppShell>
  )
}
