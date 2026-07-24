import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { ambilDataShell } from '@/lib/shell-data'
import { ambilSemuaDivisi } from './actions'
import FormBuatDivisi from './form-buat-divisi'
import DaftarDivisi from './daftar-divisi'

export default async function HalamanKelolaDivisi() {
  const data = await ambilDataShell()

  if (data.roleSistem !== 'super_admin') {
    redirect('/dashboard')
  }

  const daftarDivisi = await ambilSemuaDivisi()

  return (
    <AppShell data={data}>
      <div className="mx-auto max-w-2xl">
        <FormBuatDivisi />

        <div className="mt-6">
          <h2 className="mb-3 text-xs font-bold tracking-widest text-muted">DAFTAR DIVISI</h2>

          <DaftarDivisi daftarAwal={daftarDivisi} />
        </div>
      </div>
    </AppShell>
  )
}
