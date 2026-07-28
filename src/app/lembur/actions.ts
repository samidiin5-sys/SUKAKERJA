'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { ambilSesiPengguna, pastikanOwnerAtauSuperAdmin } from '@/lib/auth/otorisasi'
import { kirimNotifikasi } from '@/lib/notifikasi'

export type LemburSaya = {
  id: string
  divisiNama: string
  tanggal: string
  jamMulai: string
  jamSelesai: string
  alasan: string
  status: 'menunggu' | 'disetujui' | 'ditolak'
  catatanOwner: string | null
  createdAt: string
}

export type HasilAksi = { sukses: true } | { sukses: false; pesan: string }

export async function ajukanLembur(
  divisionId: string,
  tanggal: string,
  jamMulai: string,
  jamSelesai: string,
  alasan: string
): Promise<HasilAksi> {
  const sesi = await ambilSesiPengguna()
  if (!alasan.trim() || alasan.trim().length < 10) {
    return { sukses: false, pesan: 'Alasan minimal 10 karakter' }
  }
  if (jamMulai >= jamSelesai) {
    return { sukses: false, pesan: 'Jam selesai harus lebih dari jam mulai' }
  }

  const admin = createAdminClient()
  const { error } = await admin.from('lembur').insert({
    user_id: sesi.id,
    division_id: divisionId,
    tanggal,
    jam_mulai: jamMulai,
    jam_selesai: jamSelesai,
    alasan: alasan.trim(),
  })

  if (error) return { sukses: false, pesan: 'Gagal mengajukan lembur. Coba lagi.' }

  return { sukses: true }
}

export async function ambilLemburSaya(): Promise<LemburSaya[]> {
  const sesi = await ambilSesiPengguna()
  const admin = createAdminClient()

  const { data } = await admin
    .from('lembur')
    .select('id, tanggal, jam_mulai, jam_selesai, alasan, status, catatan_owner, created_at, divisions(nama)')
    .eq('user_id', sesi.id)
    .order('created_at', { ascending: false })
    .limit(50)

  type Baris = {
    id: string
    tanggal: string
    jam_mulai: string
    jam_selesai: string
    alasan: string
    status: 'menunggu' | 'disetujui' | 'ditolak'
    catatan_owner: string | null
    created_at: string
    divisions: { nama: string }
  }

  return ((data as unknown as Baris[] | null) ?? []).map((r) => ({
    id: r.id,
    divisiNama: r.divisions.nama,
    tanggal: r.tanggal,
    jamMulai: r.jam_mulai,
    jamSelesai: r.jam_selesai,
    alasan: r.alasan,
    status: r.status,
    catatanOwner: r.catatan_owner,
    createdAt: r.created_at,
  }))
}

export type LemburMenunggu = LemburSaya & { staffNama: string; staffId: string }

export async function ambilLemburMenunggu(): Promise<LemburMenunggu[]> {
  await pastikanOwnerAtauSuperAdmin()
  const admin = createAdminClient()

  const { data } = await admin
    .from('lembur')
    .select('id, tanggal, jam_mulai, jam_selesai, alasan, status, catatan_owner, created_at, divisions(nama), profiles(id, nama)')
    .eq('status', 'menunggu')
    .order('created_at', { ascending: true })

  type Baris = {
    id: string
    tanggal: string
    jam_mulai: string
    jam_selesai: string
    alasan: string
    status: 'menunggu' | 'disetujui' | 'ditolak'
    catatan_owner: string | null
    created_at: string
    divisions: { nama: string }
    profiles: { id: string; nama: string }
  }

  return ((data as unknown as Baris[] | null) ?? []).map((r) => ({
    id: r.id,
    divisiNama: r.divisions.nama,
    tanggal: r.tanggal,
    jamMulai: r.jam_mulai,
    jamSelesai: r.jam_selesai,
    alasan: r.alasan,
    status: r.status,
    catatanOwner: r.catatan_owner,
    createdAt: r.created_at,
    staffNama: r.profiles.nama,
    staffId: r.profiles.id,
  }))
}

export async function tinjauLembur(
  lemburId: string,
  keputusan: 'disetujui' | 'ditolak',
  catatan: string
): Promise<HasilAksi> {
  const sesi = await pastikanOwnerAtauSuperAdmin()
  const admin = createAdminClient()

  const { data: lembur } = await admin
    .from('lembur')
    .select('user_id, tanggal, divisions(nama)')
    .eq('id', lemburId)
    .single()

  if (!lembur) return { sukses: false, pesan: 'Pengajuan tidak ditemukan' }

  const { error } = await admin
    .from('lembur')
    .update({
      status: keputusan,
      catatan_owner: catatan.trim() || null,
      reviewed_by: sesi.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', lemburId)

  if (error) return { sukses: false, pesan: 'Gagal memproses pengajuan.' }

  const divisiNama = (lembur.divisions as any)?.nama ?? 'divisi'
  await kirimNotifikasi({
    userId: lembur.user_id,
    jenis: keputusan === 'disetujui' ? 'lembur_disetujui' : 'lembur_ditolak',
    pesan: keputusan === 'disetujui'
      ? `Pengajuan lembur kamu tanggal ${lembur.tanggal} di ${divisiNama} disetujui.`
      : `Pengajuan lembur kamu tanggal ${lembur.tanggal} di ${divisiNama} ditolak.${catatan ? ` Catatan: ${catatan}` : ''}`,
  })

  return { sukses: true }
}
