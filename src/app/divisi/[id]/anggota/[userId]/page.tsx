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
      <div className="mb-5">
        <a
          href={`/divisi/${id}/anggota`}
          className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-orange-600 transition"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: divisi.warna }}
          />
          {divisi.nama}
        </a>
      </div>

      <RuangKerjaStaffView ruangKerja={ruangKerja} divisionId={id} />
    </AppShell>
  )
}
