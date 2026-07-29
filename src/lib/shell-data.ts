import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ambilDivisiSaya, type DivisiSaya } from '@/app/(main)/admin/divisi/actions'

export type DataShell = {
  nama: string
  jabatan: string | null
  roleSistem: 'super_admin' | 'owner' | 'user'
  divisiSaya: DivisiSaya[]
  fotoUrl: string | null
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

  return {
    nama: profil?.nama ?? 'Pengguna',
    jabatan: profil?.jabatan ?? null,
    roleSistem: (profil?.role_sistem as 'super_admin' | 'owner' | 'user') ?? 'user',
    divisiSaya,
    fotoUrl: profil?.foto_url ?? null,
  }
}
