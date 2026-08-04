import { redirect } from 'next/navigation'
import { ambilSesiPengguna } from '@/lib/auth/otorisasi'
import {
  ambilLemburMenunggu,
  ambilKaryawanAktif,
  ambilRiwayatLemburAdmin,
} from '@/app/(main)/lembur/actions'
import TinjauLemburWrapper from './tinjau-lembur-wrapper'

export default async function HalamanAdminLembur() {
  const sesi = await ambilSesiPengguna()

  if (sesi.roleSistem !== 'super_admin' && sesi.roleSistem !== 'owner') {
    redirect('/dashboard')
  }

  const [daftarMenunggu, karyawanAktif, riwayatInitial] = await Promise.all([
    ambilLemburMenunggu(),
    ambilKaryawanAktif(),
    ambilRiwayatLemburAdmin(),
  ])

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <h2 className="text-lg font-black text-maroon-800">Pengajuan & Riwayat Lembur</h2>
        <p className="text-sm text-muted">Tinjau pengajuan lembur baru atau rekap riwayat lembur staff.</p>
      </div>
      <TinjauLemburWrapper
        daftarMenungguInitial={daftarMenunggu}
        karyawanAktif={karyawanAktif}
        riwayatInitial={riwayatInitial}
      />
    </div>
  )
}
