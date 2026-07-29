'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { ambilSesiPengguna, pastikanOwnerAtauSuperAdmin } from '@/lib/auth/otorisasi'
import { kirimNotifikasi } from '@/lib/notifikasi'
import { mapLemburReviewFromRows } from './lembur-utils'

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
export type AnggotaLembur = { id: string; nama: string }

export async function ambilAnggotaUntukLembur(divisionId: string): Promise<AnggotaLembur[]> {
  if (!divisionId) return []
  const admin = createAdminClient()

  const { data } = await admin
    .from('division_members')
    .select('profiles!inner(id, nama, status, deleted_at)')
    .eq('division_id', divisionId)

  type Baris = { profiles: { id: string; nama: string; status: string; deleted_at: string | null } }

  return ((data as unknown as Baris[] | null) ?? [])
    .filter((r) => r.profiles.status === 'aktif' && !r.profiles.deleted_at)
    .map((r) => ({ id: r.profiles.id, nama: r.profiles.nama }))
    .sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
}

export async function ajukanLembur(
  divisionId: string,
  tanggal: string,
  jamMulai: string,
  jamSelesai: string,
  alasan: string,
  pesertaIds: string[] = []
): Promise<HasilAksi> {
  const sesi = await ambilSesiPengguna()
  if (!alasan.trim() || alasan.trim().length < 10) {
    return { sukses: false, pesan: 'Alasan minimal 10 karakter' }
  }
  if (jamMulai >= jamSelesai) {
    return { sukses: false, pesan: 'Jam selesai harus lebih dari jam mulai' }
  }

  const finalPeserta = pesertaIds.length > 0 ? pesertaIds : [sesi.id]
  const admin = createAdminClient()

  const records = finalPeserta.map((uid) => ({
    user_id: uid,
    division_id: divisionId,
    tanggal,
    jam_mulai: jamMulai,
    jam_selesai: jamSelesai,
    alasan: alasan.trim(),
  }))

  const { error } = await admin.from('lembur').insert(records)

  if (error) return { sukses: false, pesan: 'Gagal mengajukan lembur. Coba lagi.' }

  return { sukses: true }
}

export async function tetapkanLemburStaff(
  divisionId: string,
  staffIds: string[],
  tanggal: string,
  jamMulai: string,
  jamSelesai: string,
  alasan: string
): Promise<HasilAksi> {
  const sesi = await pastikanOwnerAtauSuperAdmin()

  if (staffIds.length === 0) return { sukses: false, pesan: 'Pilih minimal 1 staff.' }
  if (!alasan.trim() || alasan.trim().length < 10) return { sukses: false, pesan: 'Alasan minimal 10 karakter' }
  if (jamMulai >= jamSelesai) return { sukses: false, pesan: 'Jam selesai harus lebih dari jam mulai' }

  const admin = createAdminClient()
  const sekarang = new Date().toISOString()

  const records = staffIds.map((uid) => ({
    user_id: uid,
    division_id: divisionId,
    tanggal,
    jam_mulai: jamMulai,
    jam_selesai: jamSelesai,
    alasan: alasan.trim(),
    status: 'disetujui' as const,
    reviewed_by: sesi.id,
    reviewed_at: sekarang,
  }))

  const { error } = await admin.from('lembur').insert(records)
  if (error) return { sukses: false, pesan: 'Gagal menetapkan lembur. Coba lagi.' }

  const { data: divisi } = await admin.from('divisions').select('nama').eq('id', divisionId).single()
  const divisiNama = (divisi as any)?.nama ?? 'divisi'

  await Promise.all(
    staffIds.map((uid) =>
      kirimNotifikasi({
        userId: uid,
        jenis: 'lembur_disetujui',
        pesan: `Kamu mendapat lembur pada ${tanggal} di ${divisiNama} (${jamMulai}–${jamSelesai}).`,
      })
    )
  )

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
    .select('id, user_id, division_id, tanggal, jam_mulai, jam_selesai, alasan, status, catatan_owner, created_at')
    .in('status', ['menunggu', null])
    .order('created_at', { ascending: true })

  type Baris = {
    id: string
    user_id: string
    division_id: string
    tanggal: string
    jam_mulai: string
    jam_selesai: string
    alasan: string
    status: string | null
    catatan_owner: string | null
    created_at: string
  }

  const rows = ((data as unknown as Baris[] | null) ?? []).filter((r) => !!r.user_id && !!r.division_id)

  if (rows.length === 0) return []

  const [profilesRes, divisionsRes] = await Promise.all([
    admin.from('profiles').select('id, nama').in('id', rows.map((r) => r.user_id)),
    admin.from('divisions').select('id, nama').in('id', rows.map((r) => r.division_id)),
  ])

  const profiles = ((profilesRes.data as Array<{ id: string; nama: string }> | null) ?? []).filter(Boolean)
  const divisions = ((divisionsRes.data as Array<{ id: string; nama: string }> | null) ?? []).filter(Boolean)

  return mapLemburReviewFromRows(rows, profiles, divisions)
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
