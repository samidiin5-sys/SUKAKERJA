import AppShell from '@/components/app-shell'
import { ambilDataShell } from '@/lib/shell-data'
import { ambilSesiPengguna } from '@/lib/auth/otorisasi'
import { ambilLemburSaya } from './actions'
import FormLembur from './form-lembur'
import DaftarLemburSaya from './daftar-lembur-saya'

export default async function HalamanLembur() {
  const [data, sesi, lemburSaya] = await Promise.all([
    ambilDataShell(),
    ambilSesiPengguna(),
    ambilLemburSaya(),
  ])

  return (
    <AppShell data={data}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-5">
          <h2 className="text-lg font-black text-maroon-800">
            {sesi.roleSistem !== 'user' ? 'Tetapkan Lembur' : 'Pengajuan Lembur'}
          </h2>
          <p className="text-sm text-muted">
            {sesi.roleSistem !== 'user'
              ? 'Tetapkan lembur untuk staff divisimu — langsung disetujui.'
              : 'Ajukan lembur dan pantau status persetujuannya.'}
          </p>
        </div>

        <FormLembur
          divisiSaya={data.divisiSaya}
          sesiId={sesi.id}
          sesiNama={sesi.nama}
          isOwnerOrAdmin={sesi.roleSistem !== 'user'}
        />

        <div className="mt-6">
          <h3 className="mb-3 text-xs font-bold tracking-widest text-muted">RIWAYAT PENGAJUAN</h3>
          <DaftarLemburSaya daftarAwal={lemburSaya} />
        </div>
      </div>
    </AppShell>
  )
}
