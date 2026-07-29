import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
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
    <AppShell data={data}>
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <span
            className="h-3.5 w-3.5 flex-shrink-0 rounded-full"
            style={{ backgroundColor: divisi.warna }}
          />
          <h2 className="text-lg font-black text-maroon-800">{divisi.nama}</h2>
        </div>
        <p className="mt-1 text-sm text-muted">
          {bolehMonitor ? 'Pilih staff untuk melihat ruang kerja mereka.' : `Anggota divisi ${divisi.nama}`}
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        {bolehKelolaAnggota && <FormTambahAnggota divisionId={id} kandidat={kandidat} />}

        <div className={bolehKelolaAnggota ? 'mt-6' : ''}>
          <h3 className="mb-3 text-xs font-bold tracking-widest text-muted">
            STAFF ({anggota.length})
          </h3>
          <DaftarAnggota
            divisionId={id}
            daftarAwal={anggota}
            bolehKelola={bolehKelolaAnggota}
            bolehMonitor={bolehMonitor}
          />
        </div>
      </div>
    </AppShell>
  )
}
