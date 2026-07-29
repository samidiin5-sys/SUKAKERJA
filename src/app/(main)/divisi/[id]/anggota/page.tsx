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
      <div className="mb-6 overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm">
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

      <div className="mx-auto max-w-3xl">
        {bolehKelolaAnggota && (
          <div className="mb-6">
            <FormTambahAnggota divisionId={id} kandidat={kandidat} />
          </div>
        )}

        <DaftarAnggota
          divisionId={id}
          daftarAwal={anggota}
          bolehKelola={bolehKelolaAnggota}
          bolehMonitor={bolehMonitor}
        />
      </div>
    </>
  )
}
