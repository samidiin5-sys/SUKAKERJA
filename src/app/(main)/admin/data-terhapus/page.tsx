import { redirect } from 'next/navigation'
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
    <div className="mx-auto max-w-3xl">
        <div className="mb-5 rounded-[24px] border border-cream-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">Pemulihan data</p>
          <h2 className="mt-1 text-lg font-black text-maroon-800">Data Terhapus</h2>
          <p className="mt-1 text-sm text-muted">
            Task yang sudah dihapus disimpan di sini selama 90 hari sebelum terhapus permanen.
          </p>
        </div>

        <DaftarTerhapus daftarAwal={daftar} />
      </div>
  )
}

