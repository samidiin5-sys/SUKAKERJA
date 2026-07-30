import { redirect } from 'next/navigation'
import { pastikanAnggotaDivisi } from '@/lib/auth/otorisasi'
import { ambilDetailDivisi } from '../actions'
import { ambilTaskKalender } from './actions'
import KalenderDivisi from './kalender-divisi'

export default async function HalamanKalenderDivisi({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let divisi
  try {
    divisi = await ambilDetailDivisi(id)
  } catch {
    redirect('/dashboard')
  }
  if (!divisi) redirect('/dashboard')

  const sesi = await pastikanAnggotaDivisi(id)

  const sekarang = new Date()
  const awalBulan = new Date(sekarang.getFullYear(), sekarang.getMonth(), 1)
  const akhirBulan = new Date(sekarang.getFullYear(), sekarang.getMonth() + 1, 0, 23, 59, 59, 999)

  const tasks = await ambilTaskKalender(
    id,
    awalBulan.toISOString(),
    akhirBulan.toISOString()
  )

  const isStaff = sesi.roleSistem === 'user'

  return (
    <>
      <div className="mb-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="flex items-center gap-2 text-lg font-black text-maroon-800">
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-full"
                style={{ backgroundColor: divisi.warna }}
                aria-hidden
              />
              <span className="truncate">{divisi.nama}</span>
            </h2>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/divisi/${id}`}
            className="rounded-full border border-cream-200 bg-white px-3 py-1.5 text-xs font-bold text-maroon-700 shadow-sm hover:border-orange-500 hover:text-orange-600"
          >
            Papan Kanban
          </a>
          <a
            href={`/divisi/${id}/kalender`}
            className="rounded-full border border-maroon-700 bg-maroon-800 px-3 py-1.5 text-xs font-bold text-cream-50 shadow-sm"
          >
            Kalender
          </a>
          <a
            href={`/divisi/${id}/target`}
            className="rounded-full border border-cream-200 bg-white px-3 py-1.5 text-xs font-bold text-maroon-700 shadow-sm hover:border-orange-500 hover:text-orange-600"
          >
            Target & Realisasi
          </a>
        </div>
      </div>

      <KalenderDivisi
        divisionId={id}
        tasksAwal={tasks}
        awalBulanIso={awalBulan.toISOString()}
        isStaff={isStaff}
      />
    </>
  )
}
