'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { pastikanSuperAdmin, ambilSesiPengguna } from '@/lib/auth/otorisasi'
import { catatAktivitas } from '@/lib/aktivitas'

const BOARD_DEFAULT = ['To Do', 'Dikerjakan', 'Review', 'Selesai']

export type HasilBuatDivisi = { sukses: true } | { sukses: false; pesan: string }

export async function buatDivisi(
  nama: string,
  deskripsi: string,
  warna: string
): Promise<HasilBuatDivisi> {
  const sesi = await pastikanSuperAdmin()

  if (!nama.trim()) {
    return { sukses: false, pesan: 'Nama divisi tidak boleh kosong' }
  }

  const admin = createAdminClient()

  const { data: divisi, error } = await admin
    .from('divisions')
    .insert({
      nama: nama.trim(),
      deskripsi: deskripsi.trim() || null,
      warna: warna || '#7a2b1c',
      created_by: sesi.id,
    })
    .select('id')
    .single()

  if (error) {
    if (error.message.toLowerCase().includes('duplicate')) {
      return { sukses: false, pesan: 'Nama divisi sudah dipakai' }
    }
    return { sukses: false, pesan: 'Gagal membuat divisi. Coba lagi.' }
  }

  const boards = BOARD_DEFAULT.map((namaBoard, i) => ({
    division_id: divisi.id,
    nama: namaBoard,
    urutan: i,
    is_completion_board: namaBoard === 'Selesai',
  }))

  const { error: errorBoard } = await admin.from('boards').insert(boards)

  if (errorBoard) {
    return {
      sukses: false,
      pesan: 'Divisi dibuat, tapi gagal membuat board bawaan. Hubungi tim teknis.',
    }
  }

  await catatAktivitas({
    actorId: sesi.id,
    actorNama: sesi.nama,
    jenis: 'divisi_dibuat',
    objekTipe: 'Division',
    objekId: divisi.id,
    objekNama: nama.trim(),
    divisionId: divisi.id,
  })

  return { sukses: true }
}

export type Divisi = {
  id: string
  nama: string
  deskripsi: string | null
  warna: string
  status: string
  jumlahAnggota: number
}

export async function ambilSemuaDivisi(): Promise<Divisi[]> {
  await pastikanSuperAdmin()

  const admin = createAdminClient()
  const { data } = await admin
    .from('divisions')
    .select('id, nama, deskripsi, warna, status, division_members(count)')
    .is('deleted_at', null)
    .order('nama')

  type BarisDivisi = {
    id: string
    nama: string
    deskripsi: string | null
    warna: string
    status: string
    division_members: { count: number }[]
  }

  return ((data as BarisDivisi[] | null) ?? []).map((d) => ({
    id: d.id,
    nama: d.nama,
    deskripsi: d.deskripsi,
    warna: d.warna,
    status: d.status,
    jumlahAnggota: d.division_members?.[0]?.count ?? 0,
  }))
}

export type DivisiSaya = { id: string; nama: string; warna: string; role: string }

export async function ambilDivisiSaya(): Promise<DivisiSaya[]> {
  const sesi = await ambilSesiPengguna()
  const admin = createAdminClient()

  if (sesi.roleSistem === 'super_admin' || sesi.roleSistem === 'owner') {
    const { data } = await admin
      .from('divisions')
      .select('id, nama, warna')
      .eq('status', 'aktif')
      .is('deleted_at', null)
      .order('nama')

    return ((data as { id: string; nama: string; warna: string }[] | null) ?? []).map((d) => ({
      ...d,
      role: sesi.roleSistem,
    }))
  }

  const { data } = await admin
    .from('division_members')
    .select('role, divisions!inner(id, nama, warna, status)')
    .eq('user_id', sesi.id)
    .filter('divisions.status', 'eq', 'aktif')

  type BarisAnggota = {
    role: string
    divisions: { id: string; nama: string; warna: string; status: string }
  }

  return ((data as unknown as BarisAnggota[] | null) ?? [])
    .filter((row) => row.divisions.status === 'aktif')  // safety filter
    .map((row) => ({
      id: row.divisions.id,
      nama: row.divisions.nama,
      warna: row.divisions.warna,
      role: row.role,
    }))
}

export type HasilAksiDivisi = { sukses: true } | { sukses: false; pesan: string }
export type HasilNonaktifkanDivisi = { sukses: true; jumlahTaskAktif: number } | { sukses: false; pesan: string }

export async function nonaktifkanDivisi(
  divisionId: string,
  konfirmasiNama: string
): Promise<HasilNonaktifkanDivisi> {
  const sesi = await pastikanSuperAdmin()
  const admin = createAdminClient()

  const { data: divisi } = await admin
    .from('divisions').select('nama, status').eq('id', divisionId).single()
  if (!divisi) return { sukses: false, pesan: 'Divisi tidak ditemukan' }
  if (divisi.status !== 'aktif') return { sukses: false, pesan: 'Divisi sudah nonaktif' }

  // REQ-020: validasi case-sensitive
  if (konfirmasiNama !== divisi.nama)
    return { sukses: false, pesan: 'Nama konfirmasi tidak cocok' }

  // REQ-023: cek task aktif (warning, tidak blokir)
  const { data: boards } = await admin
    .from('boards')
    .select('id')
    .eq('division_id', divisionId)
    .is('deleted_at', null)

  const boardIds = (boards ?? []).map(b => b.id)
  let jumlahTaskAktif = 0
  if (boardIds.length > 0) {
    const { count } = await admin
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .in('board_id', boardIds)
      .is('deleted_at', null)
      .is('completed_at', null)
    jumlahTaskAktif = count ?? 0
  }

  const { error } = await admin
    .from('divisions').update({ status: 'nonaktif' }).eq('id', divisionId)
  if (error) return { sukses: false, pesan: 'Gagal menonaktifkan divisi. Coba lagi.' }

  await catatAktivitas({
    actorId: sesi.id, actorNama: sesi.nama,
    jenis: 'division_deactivated', objekTipe: 'Division',
    objekId: divisionId, objekNama: divisi.nama, divisionId,
  })

  return { sukses: true, jumlahTaskAktif }
}

export async function aktifkanKembaliDivisi(divisionId: string): Promise<HasilAksiDivisi> {
  const sesi = await pastikanSuperAdmin()

  const admin = createAdminClient()
  const { error } = await admin.from('divisions').update({ status: 'aktif' }).eq('id', divisionId)

  if (error) {
    return { sukses: false, pesan: 'Gagal mengaktifkan divisi. Coba lagi.' }
  }

  const { data: divisi } = await admin.from('divisions').select('nama').eq('id', divisionId).single()
  await catatAktivitas({
    actorId: sesi.id,
    actorNama: sesi.nama,
    jenis: 'division_reactivated',
    objekTipe: 'Division',
    objekId: divisionId,
    objekNama: divisi?.nama ?? divisionId,
    divisionId,
  })

  return { sukses: true }
}

