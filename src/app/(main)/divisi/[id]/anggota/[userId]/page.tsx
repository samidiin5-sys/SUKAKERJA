import { redirect } from 'next/navigation'
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
    <>
      {/* Header monitoring */}
      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
        <a
          href={`/divisi/${id}/anggota`}
          className="flex flex-shrink-0 items-center gap-1 text-xs font-semibold text-muted transition hover:text-orange-600"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          Kembali
        </a>
        <div className="h-4 w-px flex-shrink-0 bg-cream-200" />
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
          style={{ backgroundColor: divisi.warna }}
        >
          {staff.fotoUrl ? (
            <img src={staff.fotoUrl} alt={staff.nama} className="h-9 w-9 rounded-xl object-cover" />
          ) : inisial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{divisi.nama} · Ruang Kerja</p>
          <p className="truncate text-sm font-black text-maroon-800">{staff.nama}</p>
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
    </>
  )
}
