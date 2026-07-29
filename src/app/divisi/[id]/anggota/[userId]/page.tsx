import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { ambilDataShell } from '@/lib/shell-data'
import { pastikanAnggotaDivisi } from '@/lib/auth/otorisasi'
import {
  ambilDetailDivisi,
  ambilPapanDivisi,
  ambilAnggotaDivisi,
} from '../../actions'
import PapanDivisi from '../../papan-divisi'

export default async function HalamanPantauStaff({
  params,
}: {
  params: Promise<{ id: string; userId: string }>
}) {
  const { id, userId } = await params
  const data = await ambilDataShell()

  if (data.roleSistem === 'user') redirect(`/divisi/${id}`)

  const [divisi, boards, anggota, sesi] = await Promise.all([
    ambilDetailDivisi(id),
    ambilPapanDivisi(id),
    ambilAnggotaDivisi(id),
    pastikanAnggotaDivisi(id),
  ])

  if (!divisi) redirect('/dashboard')

  const staff = anggota.find((a) => a.id === userId)
  if (!staff) redirect(`/divisi/${id}/anggota`)

  const inisial = staff.nama.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <AppShell data={data}>
      {/* Header staff */}
      <div className="mb-5 overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm">
        <div className="h-1.5 w-full" style={{ backgroundColor: divisi.warna }} />
        <div className="flex items-center gap-3.5 px-5 py-3.5">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
            style={{ backgroundColor: divisi.warna }}
          >
            {staff.fotoUrl ? (
              <img src={staff.fotoUrl} alt={staff.nama} className="h-10 w-10 rounded-xl object-cover" />
            ) : inisial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Ruang Kerja</span>
            </div>
            <p className="text-base font-black text-maroon-800">{staff.nama}</p>
          </div>
          <a
            href={`/divisi/${id}/anggota`}
            className="flex-shrink-0 rounded-xl border border-cream-200 bg-cream-50 px-3 py-1.5 text-xs font-bold text-muted transition hover:border-orange-400 hover:text-orange-600"
          >
            ← Daftar Staff
          </a>
        </div>
      </div>

      <PapanDivisi
        divisionId={id}
        boardsAwal={boards}
        anggota={anggota}
        bolehReorderBoard={true}
        bolehTambahTask={true}
        bolehKelola={true}
        bolehKirimTugas={false}
        currentUserId={sesi.id}
        isStaff={false}
        defaultAssigneeId={userId}
        pantauNama={staff.nama}
      />
    </AppShell>
  )
}
