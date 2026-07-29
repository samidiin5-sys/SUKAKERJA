import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { IkonCentang, IkonClipboard, IkonPeringatan } from '@/components/icons'
import { ambilDataShell } from '@/lib/shell-data'
import { pastikanAnggotaDivisi } from '@/lib/auth/otorisasi'
import {
  ambilAnggotaDivisi,
  ambilDetailDivisi,
  ambilPapanDivisi,
  ambilStatistikDivisi,
} from './actions'
import PapanDivisi from './papan-divisi'

function formatTenggat(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

export default async function HalamanPapanDivisi({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const data = await ambilDataShell()

  let divisi
  try {
    divisi = await ambilDetailDivisi(id)
  } catch {
    redirect('/dashboard')
  }
  if (!divisi) {
    redirect('/dashboard')
  }

  const [boards, anggota, sesi, statistik] = await Promise.all([
    ambilPapanDivisi(id),
    ambilAnggotaDivisi(id),
    pastikanAnggotaDivisi(id),
    ambilStatistikDivisi(id),
  ])

  const bolehReorderBoard = sesi.roleSistem === 'super_admin' || sesi.roleSistem === 'owner'
  const bolehTambahTask = sesi.roleSistem === 'super_admin' || sesi.roleSistem === 'owner'
  const bolehKelola = sesi.roleSistem === 'super_admin' || sesi.roleSistem === 'owner'
  const bolehKirimTugas = sesi.roleSistem === 'super_admin' || sesi.roleSistem === 'owner'

  const kartuStatistikDivisi = [
    {
      label: 'Total Task Aktif',
      nilai: statistik.totalAktif,
      icon: <IkonClipboard />,
      iconBg: 'bg-maroon-700',
      iconText: 'text-white',
      warna: 'text-maroon-800',
    },
    {
      label: 'Selesai Bulan Ini',
      nilai: statistik.selesaiBulanIni,
      icon: <IkonCentang />,
      iconBg: 'bg-orange-500',
      iconText: 'text-white',
      warna: 'text-orange-600',
    },
    {
      label: 'Task Terlambat',
      nilai: statistik.terlambat,
      icon: <IkonPeringatan />,
      iconBg: statistik.terlambat > 0 ? 'bg-red-600' : 'bg-cream-200',
      iconText: statistik.terlambat > 0 ? 'text-white' : 'text-muted',
      warna: statistik.terlambat > 0 ? 'text-red-600' : 'text-maroon-800',
    },
  ]

  return (
    <AppShell data={data}>
      <div className="mb-5 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="flex items-center gap-2 text-lg font-black text-maroon-800">
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-full"
                style={{ backgroundColor: divisi.warna }}
                aria-hidden
              />
              <span className="truncate">{divisi.nama}</span>
            </h2>
            {divisi.deskripsi && <p className="mt-0.5 text-sm text-muted">{divisi.deskripsi}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/divisi/${id}/kalender`}
            className="rounded-full border border-cream-200 bg-white px-3 py-1.5 text-xs font-bold text-maroon-700 shadow-sm hover:border-orange-500 hover:text-orange-600"
          >
            Kalender
          </a>
          <a
            href={`/divisi/${id}/target`}
            className="rounded-full border border-cream-200 bg-white px-3 py-1.5 text-xs font-bold text-maroon-700 shadow-sm hover:border-orange-500 hover:text-orange-600"
          >
            Target & Realisasi
          </a>
          {bolehKelola && (
            <a href={`/divisi/${id}/tugas-rutin`} className="rounded-full border border-cream-200 bg-white px-3 py-1.5 text-xs font-bold text-maroon-700 shadow-sm hover:border-orange-500 hover:text-orange-600">
              Tugas Rutin
            </a>
          )}
          <a
            href={`/divisi/${id}/anggota`}
            className="rounded-full border border-cream-200 bg-white px-3 py-1.5 text-xs font-bold text-maroon-700 shadow-sm hover:border-orange-500 hover:text-orange-600"
          >
            {anggota.length} Anggota
          </a>
          {bolehKelola && (
            <a
              href={`/divisi/${id}/anggota`}
              className="rounded-full border border-maroon-700 bg-maroon-800 px-3 py-1.5 text-xs font-bold text-cream-50 shadow-sm hover:bg-maroon-700"
            >
              Pantau Staff
            </a>
          )}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
        {kartuStatistikDivisi.map((k) => (
          <div
            key={k.label}
            className="rounded-2xl border border-cream-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-4"
          >
            <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg sm:mb-3 sm:h-9 sm:w-9 ${k.iconBg} ${k.iconText}`}>
              {k.icon}
            </div>
            <p className={`text-2xl font-black sm:text-3xl ${k.warna}`}>{k.nilai}</p>
            <p className="mt-0.5 text-[10px] font-semibold text-muted sm:mt-1 sm:text-xs">{k.label}</p>
          </div>
        ))}
      </div>

      <PapanDivisi
        divisionId={id}
        boardsAwal={boards}
        anggota={anggota}
        bolehReorderBoard={bolehReorderBoard}
        bolehTambahTask={bolehTambahTask}
        bolehKelola={bolehKelola}
        bolehKirimTugas={bolehKirimTugas}
        currentUserId={sesi.id}
        isStaff={sesi.roleSistem === 'user'}
      />

      {(statistik.produktivitas.length > 0 || statistik.tenggatTerdekat.length > 0) && (
        <div className="mt-8 border-t border-cream-200/60 pt-6">
          <h3 className="mb-4 text-xs font-extrabold tracking-widest text-muted uppercase">Analisis & Produktivitas Divisi</h3>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {statistik.produktivitas.length > 0 && (
              <div className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
                <h4 className="mb-3 text-[11px] font-bold tracking-wider text-maroon-800 uppercase">Produktivitas Anggota</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs text-muted">
                        <th className="pb-1.5 font-semibold">Nama</th>
                        <th className="pb-1.5 text-right font-semibold">Aktif</th>
                        <th className="pb-1.5 text-right font-semibold">Selesai</th>
                        <th className="pb-1.5 text-right font-semibold">Terlambat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statistik.produktivitas.map((p) => (
                        <tr key={p.id} className="border-t border-cream-100">
                          <td className="py-1.5">
                            {bolehKelola ? (
                              <a
                                href={`/divisi/${id}/anggota/${p.id}`}
                                className="font-semibold text-maroon-800 hover:text-orange-600 hover:underline transition"
                              >
                                {p.nama}
                              </a>
                            ) : (
                              <span className="text-ink">{p.nama}</span>
                            )}
                          </td>
                          <td className="py-1.5 text-right text-ink">{p.aktif}</td>
                          <td className="py-1.5 text-right text-ink">{p.selesai}</td>
                          <td className={`py-1.5 text-right ${p.terlambat > 0 ? 'font-bold text-red-600' : 'text-ink'}`}>
                            {p.terlambat}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {statistik.tenggatTerdekat.length > 0 && (
              <div className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
                <h4 className="mb-3 text-[11px] font-bold tracking-wider text-maroon-800 uppercase">Tenggat Terdekat</h4>
                <div className="space-y-1.5">
                  {statistik.tenggatTerdekat.map((t) => (
                    <div key={t.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-cream-50/50 transition">
                      <span className="text-ink font-medium">{t.judul}</span>
                      <span className="text-xs text-muted bg-cream-100/70 border border-cream-200/50 rounded px-1.5 py-0.5">
                        {t.boardNama} &middot; {formatTenggat(t.dueDate)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  )
}
