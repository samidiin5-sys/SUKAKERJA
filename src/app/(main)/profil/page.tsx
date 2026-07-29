import { ambilSesiPengguna } from '@/lib/auth/otorisasi'
import { createAdminClient } from '@/lib/supabase/admin'
import FormProfil from './form-profil'

export default async function HalamanProfil() {
  const sesi = await ambilSesiPengguna()

  const admin = createAdminClient()
  const { data: profil } = await admin
    .from('profiles')
    .select('nama, foto_url')
    .eq('id', sesi.id)
    .single()

  const profilAwal = {
    nama: profil?.nama ?? sesi.nama,
    fotoUrl: profil?.foto_url ?? null,
  }

  return (
    <div className="mx-auto max-w-lg">
        <h1 className="mb-6 text-xl font-black text-maroon-800">Profil Saya</h1>
        <FormProfil profilAwal={profilAwal} />
      </div>
  )
}
