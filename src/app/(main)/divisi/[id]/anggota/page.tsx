import { redirect } from 'next/navigation'
import { ambilDataShell } from '@/lib/shell-data'
import {
  ambilAnggotaDivisi,
  ambilDetailDivisi,
  ambilKaryawanBelumJadiAnggota,
} from '../actions'
import FormTambahAnggota from './form-tambah-anggota'
import DaftarAnggota from './daftar-anggota'

export default async function HalamanAnggotaDivisi({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const data = await ambilDataShell()

  const divisi = await ambilDetailDivisi(id)
  if (!divisi) {
    redirect('/dashboard')
  }

  const bolehKelolaAnggota = data.roleSistem === 'super_admin'
  const bolehMonitor = data.roleSistem === 'super_admin' || data.roleSistem === 'owner'
  const bolehKelolaDivisi = data.roleSistem === 'super_admin' || data.roleSistem === 'owner'

  let kandidat: Awaited<ReturnType<typeof ambilKaryawanBelumJadiAnggota>> = []
  if (bolehKelolaAnggota) {
    try {
      kandidat = await ambilKaryawanBelumJadiAnggota(id)
    } catch {
      // ignore
    }
  }

  const anggota = await ambilAnggotaDivisi(id)

  return (
    <>
      {/* Header divisi */}
      <div className="mb-4 overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm">
        <div className="h-2 w-full" style={{ backgroundColor: divisi.warna }} />
        <div className="flex items-center gap-4 px-5 py-4">
          <div
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
            style={{ backgroundColor: divisi.warna }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-black text-maroon-800">{divisi.nama}</h2>
            <p className="text-xs text-muted">
              {bolehMonitor ? 'Pilih staff untuk memantau ruang kerja mereka' : `Anggota divisi ${divisi.nama}`}
            </p>
          </div>
          <div className="ml-auto flex-shrink-0">
            <span className="rounded-full bg-cream-100 px-3 py-1 text-xs font-bold text-muted">
              {anggota.length} staff
            </span>
          </div>
        </div>
      </div>

      {/* Sub-navigation tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <a
          href={`/divisi/${id}`}
          className="rounded-full border border-cream-200 bg-white px-3 py-1.5 text-xs font-bold text-maroon-700 shadow-sm hover:border-orange-500 hover:text-orange-600 transition-all"
        >
          Papan Kanban
        </a>
        <a
          href={`/divisi/${id}/kalender`}
          className="rounded-full border border-cream-200 bg-white px-3 py-1.5 text-xs font-bold text-maroon-700 shadow-sm hover:border-orange-500 hover:text-orange-600 transition-all"
        >
          Kalender
        </a>
        <a
          href={`/divisi/${id}/target`}
          className="rounded-full border border-cream-200 bg-white px-3 py-1.5 text-xs font-bold text-maroon-700 shadow-sm hover:border-orange-500 hover:text-orange-600 transition-all"
        >
          Target & Realisasi
        </a>
        {bolehKelolaDivisi && (
          <a
            href={`/divisi/${id}/tugas-rutin`}
            className="rounded-full border border-cream-200 bg-white px-3 py-1.5 text-xs font-bold text-maroon-700 shadow-sm hover:border-orange-500 hover:text-orange-600 transition-all"
          >
            Tugas Rutin
          </a>
        )}
        <a
          href={`/divisi/${id}/anggota`}
          className="rounded-full border border-maroon-700 bg-maroon-800 px-3 py-1.5 text-xs font-bold text-cream-50 shadow-sm"
        >
          {bolehMonitor ? 'Pantau Staff & Anggota' : 'Anggota Divisi'}
        </a>
      </div>

      {/* Grid Layout: 2 columns for managers, 1 column for staff */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {bolehKelolaAnggota ? (
          <>
            <div className="lg:col-span-1">
              <FormTambahAnggota divisionId={id} kandidat={kandidat} />
            </div>
            <div className="lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-bold tracking-[0.24em] text-muted">DAFTAR ANGGOTA</h3>
                <span className="rounded-full bg-cream-100 px-2.5 py-1 text-[10px] font-semibold text-muted">Aktif</span>
              </div>
              <DaftarAnggota
                divisionId={id}
                daftarAwal={anggota}
                bolehKelola={bolehKelolaAnggota}
                bolehMonitor={bolehMonitor}
              />
            </div>
          </>
        ) : (
          <div className="lg:col-span-3 mx-auto w-full max-w-3xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-[0.24em] text-muted">DAFTAR ANGGOTA</h3>
              <span className="rounded-full bg-cream-100 px-2.5 py-1 text-[10px] font-semibold text-muted">Aktif</span>
            </div>
            <DaftarAnggota
              divisionId={id}
              daftarAwal={anggota}
              bolehKelola={bolehKelolaAnggota}
              bolehMonitor={bolehMonitor}
            />
          </div>
        )}
      </div>
    </>
  )
}
