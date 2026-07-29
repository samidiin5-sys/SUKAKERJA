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
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 rounded-[24px] border border-cream-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">Manajemen pengguna</p>
          <h2 className="mt-1 text-lg font-black text-maroon-800">
            {isSuperAdmin ? 'Kelola Karyawan' : 'Data Karyawan'}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {isSuperAdmin
              ? 'Tambah, nonaktifkan, atau reset password akun karyawan.'
              : 'Daftar seluruh karyawan yang terdaftar di sistem.'}
          </p>
        </div>

        {isSuperAdmin && (
          <FormBuatKaryawan daftarDivisi={daftarDivisi.map((d) => ({ id: d.id, nama: d.nama }))} />
        )}

        <div className={isSuperAdmin ? 'mt-6' : ''}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-bold tracking-[0.24em] text-muted">DAFTAR KARYAWAN</h2>
            <span className="rounded-full bg-cream-100 px-2.5 py-1 text-[10px] font-semibold text-muted">Aktif & terdaftar</span>
          </div>
          <DaftarKaryawan daftarAwal={daftarKaryawan} isSuperAdmin={isSuperAdmin} />
        </div>
      </div>
    </AppShell>
  )
}
