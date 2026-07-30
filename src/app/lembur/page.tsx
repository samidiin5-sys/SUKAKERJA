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
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 rounded-[24px] border border-cream-200 bg-white p-5 shadow-[0_14px_40px_rgba(92,31,33,0.06)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">Operasional lembur</p>
          <h2 className="mt-1 text-lg font-black text-maroon-800">
            {sesi.roleSistem !== 'user' ? 'Tetapkan Lembur' : 'Pengajuan Lembur'}
          </h2>
          <p className="mt-1 text-sm text-muted">
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
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold tracking-[0.24em] text-muted">RIWAYAT PENGAJUAN</h3>
            <span className="rounded-full bg-cream-100 px-2.5 py-1 text-[10px] font-semibold text-muted shadow-sm">Terbaru dulu</span>
          </div>
          <DaftarLemburSaya daftarAwal={lemburSaya} />
        </div>
      </div>
    </AppShell>
  )
}
