import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { ambilDataShell } from '@/lib/shell-data'
import { ambilTaskTerhapus } from './actions'
import DaftarTerhapus from './daftar-terhapus'

export default async function HalamanDataTerhapus() {
  const data = await ambilDataShell()

  if (data.roleSistem !== 'super_admin') {
    redirect('/dashboard')
  }

  const daftar = await ambilTaskTerhapus()

  return (
    <AppShell data={data}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-5">
          <h2 className="text-lg font-black text-maroon-800">Data Terhapus</h2>
          <p className="text-sm text-muted">
            Task yang sudah dihapus disimpan di sini selama 90 hari sebelum terhapus permanen.
          </p>
        </div>

        <DaftarTerhapus daftarAwal={daftar} />
      </div>
    </AppShell>
  )
}
