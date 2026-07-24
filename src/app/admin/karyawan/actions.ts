'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { pastikanSuperAdmin } from '@/lib/auth/otorisasi'
import { catatAktivitas } from '@/lib/aktivitas'
import { kirimNotifikasi } from '@/lib/notifikasi'

export type HasilBuatKaryawan =
  | { sukses: true; passwordSementara: string }
  | { sukses: false; pesan: string }

export async function buatKaryawan(
  nama: string,
  email: string,
  password: string,
  roleSistem: 'super_admin' | 'owner' | 'user',
  divisionId?: string
): Promise<HasilBuatKaryawan> {
  const sesi = await pastikanSuperAdmin()

  if (!nama.trim()) return { sukses: false, pesan: 'Nama tidak boleh kosong' }
  if (!email.trim()) return { sukses: false, pesan: 'Email tidak boleh kosong' }
  if (!password) return { sukses: false, pesan: 'Password tidak boleh kosong' }
  if (password.length < 8) return { sukses: false, pesan: 'Password minimal 8 karakter' }
  if (roleSistem === 'user' && !divisionId) {
    return { sukses: false, pesan: 'Pilih divisi/job untuk role Staff' }
  }

  const admin = createAdminClient()

  const { data: userBaru, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nama, role_sistem: roleSistem },
  })

  if (error) {
    if (error.message.toLowerCase().includes('already been registered')) {
      return { sukses: false, pesan: 'Email sudah terdaftar' }
    }
    return { sukses: false, pesan: 'Gagal membuat akun. Coba lagi.' }
  }

  const userId = userBaru.user?.id
  if (userId && roleSistem === 'user' && divisionId) {
    await admin.from('division_members').insert({ division_id: divisionId, user_id: userId, role: 'staff' })
  }

  await catatAktivitas({
    actorId: sesi.id,
    actorNama: sesi.nama,
    jenis: 'karyawan_dibuat',
    objekTipe: 'User',
    objekId: userId ?? null,
    objekNama: nama.trim(),
  })

  return { sukses: true, passwordSementara: password }
}

export type HasilResetPassword =
  | { sukses: true; passwordSementara: string }
  | { sukses: false; pesan: string }

export async function resetPasswordKaryawan(
  userId: string,
  passwordBaru: string
): Promise<HasilResetPassword> {
  await pastikanSuperAdmin()

  if (!passwordBaru) return { sukses: false, pesan: 'Password tidak boleh kosong' }
  if (passwordBaru.length < 8) return { sukses: false, pesan: 'Password minimal 8 karakter' }

  const admin = createAdminClient()

  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: passwordBaru,
  })

  if (error) {
    return { sukses: false, pesan: 'Gagal mereset password. Coba lagi.' }
  }

  await admin.from('profiles').update({ must_change_password: true }).eq('id', userId)

  return { sukses: true, passwordSementara: passwordBaru }
}

export type HasilAksiAkun = { sukses: true } | { sukses: false; pesan: string }

export async function nonaktifkanKaryawan(userId: string): Promise<HasilAksiAkun> {
  const sesi = await pastikanSuperAdmin()

  if (userId === sesi.id) {
    return { sukses: false, pesan: 'Anda tidak dapat menonaktifkan akun Anda sendiri' }
  }

  const admin = createAdminClient()

  const { data: target } = await admin
    .from('profiles')
    .select('role_sistem')
    .eq('id', userId)
    .single()

  if (target?.role_sistem === 'super_admin') {
    const { count } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role_sistem', 'super_admin')
      .eq('status', 'aktif')
      .is('deleted_at', null)

    if ((count ?? 0) <= 1) {
      return {
        sukses: false,
        pesan: 'Tidak dapat menonaktifkan Super Admin terakhir yang aktif',
      }
    }
  }

  const { error } = await admin.from('profiles').update({ status: 'nonaktif' }).eq('id', userId)

  if (error) {
    return { sukses: false, pesan: 'Gagal menonaktifkan akun. Coba lagi.' }
  }

  const { data: profilTarget } = await admin.from('profiles').select('nama').eq('id', userId).single()
  await catatAktivitas({
    actorId: sesi.id,
    actorNama: sesi.nama,
    jenis: 'karyawan_dinonaktifkan',
    objekTipe: 'User',
    objekId: userId,
    objekNama: profilTarget?.nama ?? userId,
  })

  return { sukses: true }
}

export async function aktifkanKembaliKaryawan(userId: string): Promise<HasilAksiAkun> {
  const sesi = await pastikanSuperAdmin()

  const admin = createAdminClient()
  const { error } = await admin.from('profiles').update({ status: 'aktif' }).eq('id', userId)

  if (error) {
    return { sukses: false, pesan: 'Gagal mengaktifkan akun. Coba lagi.' }
  }

  const { data: profilTarget } = await admin.from('profiles').select('nama').eq('id', userId).single()
  await catatAktivitas({
    actorId: sesi.id,
    actorNama: sesi.nama,
    jenis: 'user_reactivated',
    objekTipe: 'User',
    objekId: userId,
    objekNama: profilTarget?.nama ?? userId,
  })

  await kirimNotifikasi({
    userId,
    jenis: 'user_reactivated',
    pesan: `Akun Anda telah diaktifkan kembali oleh ${sesi.nama}`,
    taskId: null,
    divisionId: null,
  })

  return { sukses: true }
}

export async function hapusKaryawan(userId: string): Promise<HasilAksiAkun> {
  const sesi = await pastikanSuperAdmin()

  if (userId === sesi.id) {
    return { sukses: false, pesan: 'Anda tidak dapat menghapus akun Anda sendiri' }
  }

  const admin = createAdminClient()

  const { data: target } = await admin
    .from('profiles')
    .select('role_sistem, nama')
    .eq('id', userId)
    .single()

  if (target?.role_sistem === 'super_admin') {
    const { count } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role_sistem', 'super_admin')
      .eq('status', 'aktif')
      .is('deleted_at', null)

    if ((count ?? 0) <= 1) {
      return {
        sukses: false,
        pesan: 'Tidak dapat menghapus Super Admin terakhir yang aktif',
      }
    }
  }

  // Soft delete: status=nonaktif, deleted_at = now
  const { error } = await admin
    .from('profiles')
    .update({
      status: 'nonaktif',
      deleted_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (error) {
    return { sukses: false, pesan: 'Gagal menghapus akun karyawan. Coba lagi.' }
  }

  // Bersihkan juga dari keanggotaan divisi
  await admin.from('division_members').delete().eq('user_id', userId)

  await catatAktivitas({
    actorId: sesi.id,
    actorNama: sesi.nama,
    jenis: 'karyawan_dihapus',
    objekTipe: 'User',
    objekId: userId,
    objekNama: target?.nama ?? userId
  })

  return { sukses: true }
}

export type Karyawan = {
  id: string
  nama: string
  jabatan: string | null
  status: string
  role_sistem: string
  email: string
  mustChangePassword: boolean
  fotoUrl: string | null
}

export async function ambilDaftarKaryawan(): Promise<Karyawan[]> {
  await pastikanSuperAdmin()

  const admin = createAdminClient()

  const { data: profil } = await admin
    .from('profiles')
    .select('id, nama, jabatan, status, role_sistem, must_change_password, foto_url')
    .is('deleted_at', null)
    .order('nama')

  if (!profil || profil.length === 0) return []

  const { data: authList } = await admin.auth.admin.listUsers({ perPage: 200 })
  const emailById = new Map((authList?.users ?? []).map((u) => [u.id, u.email ?? '-']))

  return profil.map((p) => ({
    id: p.id,
    nama: p.nama,
    jabatan: p.jabatan,
    status: p.status,
    role_sistem: p.role_sistem,
    email: emailById.get(p.id) ?? '-',
    mustChangePassword: p.must_change_password,
    fotoUrl: p.foto_url,
  }))
}

export type DetailKaryawan = {
  id: string
  nama: string
  email: string
  jabatan: string | null
  roleSistem: string
  status: string
  createdAt: string
  divisi: { id: string; nama: string; warna: string; role: string }[]
}

export async function ambilDetailKaryawan(userId: string): Promise<DetailKaryawan | null> {
  await pastikanSuperAdmin()

  const admin = createAdminClient()

  const { data: profil } = await admin
    .from('profiles')
    .select('id, nama, jabatan, status, role_sistem, created_at')
    .eq('id', userId)
    .is('deleted_at', null)
    .single()

  if (!profil) return null

  const { data: authUser } = await admin.auth.admin.getUserById(userId)

  const { data: keanggotaan } = await admin
    .from('division_members')
    .select('role, divisions!inner(id, nama, warna)')
    .eq('user_id', userId)

  type BarisAnggota = { role: string; divisions: { id: string; nama: string; warna: string } }

  return {
    id: profil.id,
    nama: profil.nama,
    email: authUser?.user?.email ?? '-',
    jabatan: profil.jabatan,
    roleSistem: profil.role_sistem,
    status: profil.status,
    createdAt: profil.created_at,
    divisi: ((keanggotaan as unknown as BarisAnggota[] | null) ?? []).map((row) => ({
      id: row.divisions.id,
      nama: row.divisions.nama,
      warna: row.divisions.warna,
      role: row.role,
    })),
  }
}

export type RingkasanBeban = {
  totalAktif: number
  totalSelesai: number
  totalTerlambat: number
}

export async function ambilRingkasanBebanKerja(
  userId: string,
  dari: string,
  sampai: string
): Promise<RingkasanBeban> {
  await pastikanSuperAdmin()

  const admin = createAdminClient()

  const { data } = await admin
    .from('task_assignees')
    .select('tasks!inner(id, due_date, completed_at, deleted_at)')
    .eq('user_id', userId)

  type Baris = { tasks: { id: string; due_date: string | null; completed_at: string | null; deleted_at: string | null } }

  const tasks = ((data as unknown as Baris[] | null) ?? [])
    .map((row) => row.tasks)
    .filter((t) => t.deleted_at === null)

  const awalPeriode = new Date(dari).getTime()
  const akhirPeriode = new Date(sampai).getTime() + 24 * 60 * 60 * 1000
  const sekarang = Date.now()

  const totalAktif = tasks.filter((t) => t.completed_at === null).length
  const totalSelesai = tasks.filter((t) => {
    if (!t.completed_at) return false
    const d = new Date(t.completed_at).getTime()
    return d >= awalPeriode && d < akhirPeriode
  }).length
  const totalTerlambat = tasks.filter(
    (t) => t.completed_at === null && t.due_date && new Date(t.due_date).getTime() < sekarang
  ).length

  return { totalAktif, totalSelesai, totalTerlambat }
}
