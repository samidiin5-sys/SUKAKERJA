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

  let kandidat: Awaited<ReturnType<typeof ambilKaryawanBelumJadiAnggota>> = []
  if (bolehKelolaAnggota) {
    try {
      kandidat = await ambilKaryawanBelumJadiAnggota(id)
    } catch {
      // ignore — bolehKelolaAnggota is already true, kandidat stays empty
    }
  }

  const anggota = await ambilAnggotaDivisi(id)

  return (
    <AppShell data={data}>
      <a
        href={`/divisi/${id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-maroon-700 hover:underline"
      >
        ← Kembali ke Papan {divisi.nama}
      </a>
      <h2 className="mb-5 text-lg font-black text-maroon-800">Anggota Divisi {divisi.nama}</h2>

      <div className="mx-auto max-w-2xl">
        {bolehKelolaAnggota && <FormTambahAnggota divisionId={id} kandidat={kandidat} />}

        <div className="mt-6">
          <h3 className="mb-3 text-xs font-bold tracking-widest text-muted">
            ANGGOTA SAAT INI ({anggota.length})
          </h3>
          <DaftarAnggota divisionId={id} daftarAwal={anggota} bolehKelola={bolehKelolaAnggota} />
        </div>
      </div>
    </AppShell>
  )
}
