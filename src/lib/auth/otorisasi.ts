import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type RoleSistem = 'super_admin' | 'owner' | 'user'
export type RoleDivisi = 'staff'

export type SesiPengguna = {
  id: string
  nama: string
  roleSistem: RoleSistem
}

export async function ambilSesiPengguna(): Promise<SesiPengguna> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Sesi tidak valid')
  }

  const { data: profil } = await supabase
    .from('profiles')
    .select('nama, role_sistem')
    .eq('id', user.id)
    .single()

  return {
    id: user.id,
    nama: profil?.nama ?? '',
    roleSistem: (profil?.role_sistem as RoleSistem) ?? 'user',
  }
}

export async function pastikanSuperAdmin(): Promise<SesiPengguna> {
  const sesi = await ambilSesiPengguna()
  if (sesi.roleSistem !== 'super_admin') {
    throw new Error('Hanya Super Admin yang dapat melakukan tindakan ini')
  }
  return sesi
}

export async function pastikanOwnerAtauSuperAdmin(): Promise<SesiPengguna> {
  const sesi = await ambilSesiPengguna()
  if (sesi.roleSistem !== 'super_admin' && sesi.roleSistem !== 'owner') {
    throw new Error('Hanya Owner atau Super Admin yang dapat melakukan tindakan ini')
  }
  return sesi
}

export type SesiAnggotaDivisi = SesiPengguna & { roleDivisi: RoleDivisi | null }

export async function pastikanAnggotaDivisi(divisionId: string): Promise<SesiAnggotaDivisi> {
  const sesi = await ambilSesiPengguna()

  if (sesi.roleSistem === 'super_admin' || sesi.roleSistem === 'owner') {
    return { ...sesi, roleDivisi: null }
  }

  const admin = createAdminClient()
  const [{ data }, { data: divisi }] = await Promise.all([
    admin
      .from('division_members')
      .select('role')
      .eq('user_id', sesi.id)
      .eq('division_id', divisionId)
      .maybeSingle(),
    admin.from('divisions').select('status').eq('id', divisionId).maybeSingle(),
  ])

  if (!data) {
    throw new Error('Anda bukan anggota divisi ini')
  }

  if (divisi?.status !== 'aktif') {
    throw new Error('Divisi ini sudah dinonaktifkan')
  }

  return { ...sesi, roleDivisi: data.role as RoleDivisi }
}

export async function pastikanOwner(divisionId: string): Promise<SesiAnggotaDivisi> {
  const sesi = await pastikanAnggotaDivisi(divisionId)

  if (sesi.roleSistem !== 'super_admin' && sesi.roleSistem !== 'owner') {
    throw new Error('Hanya Owner yang dapat melakukan tindakan ini')
  }

  return sesi
}

/** Super Admin & Owner: akses penuh lintas semua divisi, tidak butuh baris division_members. */
export function apakahOwnerAtauSuperAdmin(sesi: SesiPengguna): boolean {
  return sesi.roleSistem === 'super_admin' || sesi.roleSistem === 'owner'
}

/**
 * Apakah user saat ini boleh memindahkan/mengurutkan task tertentu.
 * Super Admin & Owner: boleh untuk task apa pun di divisi manapun.
 * Staff: hanya boleh jika ditugaskan ke task itu atau dia yang membuatnya.
 */
export async function bolehPindahTask(divisionId: string, taskId: string): Promise<boolean> {
  const sesi = await pastikanAnggotaDivisi(divisionId)

  if (sesi.roleSistem === 'super_admin' || sesi.roleSistem === 'owner') {
    return true
  }

  const admin = createAdminClient()
  const [{ data: task }, { data: assignee }] = await Promise.all([
    admin.from('tasks').select('created_by').eq('id', taskId).maybeSingle(),
    admin
      .from('task_assignees')
      .select('id')
      .eq('task_id', taskId)
      .eq('user_id', sesi.id)
      .maybeSingle(),
  ])

  return task?.created_by === sesi.id || !!assignee
}
