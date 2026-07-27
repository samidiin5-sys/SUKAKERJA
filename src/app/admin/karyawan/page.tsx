import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { ambilDataShell } from '@/lib/shell-data'
import { ambilDaftarKaryawan } from './actions'
import { ambilSemuaDivisi } from '../divisi/actions'
import FormBuatKaryawan from './form-buat-karyawan'
import DaftarKaryawan from './daftar-karyawan'

export default async function HalamanKelolaKaryawan() {
  const data = await ambilDataShell()

  if (data.roleSistem !== 'super_admin' && data.roleSistem !== 'owner') {
    redirect('/dashboard')
  }

  const isSuperAdmin = data.roleSistem === 'super_admin'

  const [daftarKaryawan, daftarDivisi] = await Promise.all([
    ambilDaftarKaryawan(),
    isSuperAdmin ? ambilSemuaDivisi() : Promise.resolve([]),
  ])

  return (
    <AppShell data={data}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-5">
          <h2 className="text-lg font-black text-maroon-800">
            {isSuperAdmin ? 'Kelola Karyawan' : 'Data Karyawan'}
          </h2>
          <p className="text-sm text-muted">
            {isSuperAdmin
              ? 'Tambah, nonaktifkan, atau reset password akun karyawan.'
              : 'Daftar seluruh karyawan yang terdaftar di sistem.'}
          </p>
        </div>

        {isSuperAdmin && (
          <FormBuatKaryawan daftarDivisi={daftarDivisi.map((d) => ({ id: d.id, nama: d.nama }))} />
        )}

        <div className={isSuperAdmin ? 'mt-6' : ''}>
          <h2 className="mb-3 text-xs font-bold tracking-widest text-muted">DAFTAR KARYAWAN</h2>
          <DaftarKaryawan daftarAwal={daftarKaryawan} isSuperAdmin={isSuperAdmin} />
        </div>
      </div>
    </AppShell>
  )
}
