import { redirect } from 'next/navigation'
import { ambilSesiPengguna } from '@/lib/auth/otorisasi'
import { ambilLemburMenunggu } from '@/app/(main)/lembur/actions'
import TinjauLembur from './tinjau-lembur'

export default async function HalamanAdminLembur() {
  const sesi = await ambilSesiPengguna()

  if (sesi.roleSistem !== 'super_admin' && sesi.roleSistem !== 'owner') {
    redirect('/dashboard')
  }

  const daftar = await ambilLemburMenunggu()

  return (
    <div className="mx-auto max-w-2xl">
        <div className="mb-5">
          <h2 className="text-lg font-black text-maroon-800">Pengajuan Lembur</h2>
          <p className="text-sm text-muted">Tinjau dan setujui atau tolak pengajuan lembur staff.</p>
        </div>
        <TinjauLembur daftarAwal={daftar} />
      </div>
  )
}
