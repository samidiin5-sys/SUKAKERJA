import { redirect } from 'next/navigation'
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
    <div className="mx-auto max-w-3xl">
        <div className="mb-5 rounded-[24px] border border-cream-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">Struktur organisasi</p>
          <h2 className="mt-1 text-lg font-black text-maroon-800">Kelola Divisi</h2>
          <p className="mt-1 text-sm text-muted">Buat dan kelola divisi yang ada di perusahaan.</p>
        </div>

        <FormBuatDivisi />

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-bold tracking-[0.24em] text-muted">DAFTAR DIVISI</h2>
            <span className="rounded-full bg-cream-100 px-2.5 py-1 text-[10px] font-semibold text-muted">Tersedia di sistem</span>
          </div>

          <DaftarDivisi daftarAwal={daftarDivisi} />
        </div>
      </div>
  )
}

