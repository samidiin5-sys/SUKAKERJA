import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ambilDivisiSaya, type DivisiSaya } from '@/app/(main)/admin/divisi/actions'
import { ambilTaskTersedia } from '@/app/(main)/tugas-tersedia/actions'

export type DataShell = {
  nama: string
  jabatan: string | null
  roleSistem: 'super_admin' | 'owner' | 'user'
  divisiSaya: DivisiSaya[]
  fotoUrl: string | null
  hasTugasTersedia: boolean
}

export async function ambilDataShell(): Promise<DataShell> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profil } = await supabase
    .from('profiles')
    .select('nama, jabatan, role_sistem, foto_url')
    .eq('id', user.id)
    .single()

  const divisiSaya = await ambilDivisiSaya()
  let hasTugasTersedia = false
  if (profil?.role_sistem === 'user') {
    const tugas = await ambilTaskTersedia()
    hasTugasTersedia = tugas.some((t) => !t.sudahDiajukan)
  }

  return {
    nama: profil?.nama ?? 'Pengguna',
    jabatan: profil?.jabatan ?? null,
    roleSistem: (profil?.role_sistem as 'super_admin' | 'owner' | 'user') ?? 'user',
    divisiSaya,
    fotoUrl: profil?.foto_url ?? null,
    hasTugasTersedia,
  }
}
