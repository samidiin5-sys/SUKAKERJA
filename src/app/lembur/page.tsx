import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { ambilDataShell } from '@/lib/shell-data'
import { ambilSesiPengguna } from '@/lib/auth/otorisasi'
import { ambilLemburSaya } from './actions'
import FormLembur from './form-lembur'
import DaftarLemburSaya from './daftar-lembur-saya'

export default async function HalamanLembur() {
  const data = await ambilDataShell()
  const sesi = await ambilSesiPengguna()

  if (sesi.roleSistem !== 'user') {
    redirect('/admin/lembur')
  }

  const lemburSaya = await ambilLemburSaya()

  return (
    <AppShell data={data}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-5">
          <h2 className="text-lg font-black text-maroon-800">Pengajuan Lembur</h2>
          <p className="text-sm text-muted">Ajukan lembur dan pantau status persetujuannya.</p>
        </div>

        <FormLembur divisiSaya={data.divisiSaya} />

        <div className="mt-6">
          <h3 className="mb-3 text-xs font-bold tracking-widest text-muted">RIWAYAT PENGAJUAN</h3>
          <DaftarLemburSaya daftarAwal={lemburSaya} />
        </div>
      </div>
    </AppShell>
  )
}
