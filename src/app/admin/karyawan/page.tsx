import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { ambilDataShell } from '@/lib/shell-data'
import { ambilDaftarKaryawan } from './actions'
import { ambilSemuaDivisi } from '../divisi/actions'
import FormBuatKaryawan from './form-buat-karyawan'
import DaftarKaryawan from './daftar-karyawan'

export default async function HalamanKelolaKaryawan() {
  const data = await ambilDataShell()

  if (data.roleSistem !== 'super_admin') {
    redirect('/dashboard')
  }

  const [daftarKaryawan, daftarDivisi] = await Promise.all([
    ambilDaftarKaryawan(),
    ambilSemuaDivisi(),
  ])

  return (
    <AppShell data={data}>
      <div className="mx-auto max-w-2xl">
        <FormBuatKaryawan daftarDivisi={daftarDivisi.map((d) => ({ id: d.id, nama: d.nama }))} />

        <div className="mt-6">
          <h2 className="mb-3 text-xs font-bold tracking-widest text-muted">DAFTAR KARYAWAN</h2>
          <DaftarKaryawan daftarAwal={daftarKaryawan} />
        </div>
      </div>
    </AppShell>
  )
}
