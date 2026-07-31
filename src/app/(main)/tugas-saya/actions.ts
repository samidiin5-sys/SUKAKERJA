'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { ambilSesiPengguna } from '@/lib/auth/otorisasi'
import { catatAktivitas } from '@/lib/aktivitas'

/** Konversi ISO string ke format YYYY-MM-DD (WIB) agar cocok dengan due_date di DB */
function isoKeTanggalLokal(iso: string): string {
  const d = new Date(iso)
  const wib = new Date(d.getTime() + 7 * 60 * 60 * 1000)
  return wib.toISOString().slice(0, 10)
}

export type TaskKalenderSaya = {
  id: string
  judul: string
  prioritas: string
  dueDate: string
  completedAt: string | null
  divisiNama: string
  divisiId: string
  boardNama: string
}

export async function ambilTaskKalenderSaya(mulai: string, selesai: string): Promise<TaskKalenderSaya[]> {
  const sesi = await ambilSesiPengguna()
  const admin = createAdminClient()

  // Konversi ISO ke YYYY-MM-DD agar cocok dengan format due_date di database
  const mulaiTanggal = isoKeTanggalLokal(mulai)
  const selesaiTanggal = isoKeTanggalLokal(selesai)

  const { data } = await admin
    .from('task_assignees')
    .select('tasks!inner(id, judul, prioritas, due_date, completed_at, deleted_at, boards!inner(nama, division_id, divisions!inner(nama)))')
    .eq('user_id', sesi.id)
    .gte('tasks.due_date', mulaiTanggal)
    .lte('tasks.due_date', selesaiTanggal)
    .is('tasks.deleted_at', null)

  type BarisTask = {
    id: string; judul: string; prioritas: string
    due_date: string; completed_at: string | null; deleted_at: string | null
    boards: { nama: string; division_id: string; divisions: { nama: string } }
  }
  type Baris = { tasks: BarisTask }

  return ((data as unknown as Baris[] | null) ?? [])
    .filter((row) => !row.tasks.deleted_at && row.tasks.due_date)
    .map((row) => ({
      id: row.tasks.id,
      judul: row.tasks.judul,
      prioritas: row.tasks.prioritas,
      dueDate: row.tasks.due_date,
      completedAt: row.tasks.completed_at,
      divisiNama: row.tasks.boards.divisions.nama,
      divisiId: row.tasks.boards.division_id,
      boardNama: row.tasks.boards.nama,
    }))
}

export type TugasSaya = {
  id: string
  judul: string
  prioritas: string
  dueDate: string | null
  divisiId: string
  divisiNama: string
  boardNama: string
  ditugaskanOleh: string
}

export async function ambilTugasSaya(): Promise<TugasSaya[]> {
  const sesi = await ambilSesiPengguna()
  const admin = createAdminClient()

  const { data } = await admin
    .from('task_assignees')
    .select(
      'pemberi:profiles!task_assignees_assigned_by_fkey(nama), tasks!inner(id, judul, prioritas, due_date, completed_at, deleted_at, boards!inner(nama, division_id, divisions!inner(nama)))'
    )
    .eq('user_id', sesi.id)

  type BarisTask = {
    id: string
    judul: string
    prioritas: string
    due_date: string | null
    completed_at: string | null
    deleted_at: string | null
    boards: { nama: string; division_id: string; divisions: { nama: string } }
  }
  type Baris = { tasks: BarisTask; pemberi: { nama: string } | null }

  return ((data as unknown as Baris[] | null) ?? [])
    .filter((row) => !row.tasks.completed_at && !row.tasks.deleted_at)
    .map((row) => ({
      id: row.tasks.id,
      judul: row.tasks.judul,
      prioritas: row.tasks.prioritas,
      dueDate: row.tasks.due_date,
      divisiId: row.tasks.boards.division_id,
      divisiNama: row.tasks.boards.divisions.nama,
      boardNama: row.tasks.boards.nama,
      ditugaskanOleh: row.pemberi?.nama ?? 'Tidak diketahui',
    }))
}

export type BoardOpsi = { id: string; nama: string }
export type DivisiOpsi = { id: string; nama: string; boards: BoardOpsi[] }

export async function ambilDivisiDanBoardStaff(): Promise<DivisiOpsi[]> {
  const sesi = await ambilSesiPengguna()
  const admin = createAdminClient()

  let divisionIds: string[] = []
  if ((sesi.roleSistem as string) === 'owner' || sesi.roleSistem === 'super_admin') {
    const { data: divAll } = await admin
      .from('divisions')
      .select('id')
      .eq('status', 'aktif')
      .is('deleted_at', null)
    divisionIds = (divAll ?? []).map((d) => d.id)
  } else {
    const { data: divMembers } = await admin
      .from('division_members')
      .select('division_id, divisions!inner(status, deleted_at)')
      .eq('user_id', sesi.id)
      .eq('divisions.status', 'aktif')
      .is('divisions.deleted_at', null)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    divisionIds = (divMembers ?? []).map((dm: any) => dm.division_id)
  }

  if (divisionIds.length === 0) return []

  const { data: divData } = await admin
    .from('divisions')
    .select('id, nama, boards(id, nama, urutan)')
    .in('id', divisionIds)
    .eq('status', 'aktif')
    .is('deleted_at', null)
    .is('boards.deleted_at', null)
    .order('nama', { ascending: true })

  type BarisBoard = { id: string; nama: string; urutan: number }
  type BarisDivisi = { id: string; nama: string; boards: BarisBoard[] }

  return ((divData as unknown as BarisDivisi[] | null) ?? []).map((d) => ({
    id: d.id,
    nama: d.nama,
    boards: (d.boards ?? [])
      .sort((a, b) => a.urutan - b.urutan)
      .map((b) => ({ id: b.id, nama: b.nama })),
  }))
}

export type HasilAksi = { sukses: true } | { sukses: false; pesan: string }

export async function buatTugasSendiri(input: {
  divisionId: string
  boardId: string
  judul: string
  deskripsi?: string
  prioritas?: string
  dueDate?: string | null
}): Promise<HasilAksi> {
  const sesi = await ambilSesiPengguna()
  const admin = createAdminClient()

  if (!input.judul || input.judul.trim().length === 0) {
    return { sukses: false, pesan: 'Judul tugas tidak boleh kosong.' }
  }

  if (!input.boardId) {
    return { sukses: false, pesan: 'Pilih kolom (board) terlebih dahulu.' }
  }

  const { data: newTask, error: errTask } = await admin
    .from('tasks')
    .insert({
      board_id: input.boardId,
      judul: input.judul.trim(),
      deskripsi: input.deskripsi?.trim() || null,
      prioritas: input.prioritas || 'sedang',
      due_date: input.dueDate ? new Date(input.dueDate).toISOString() : null,
      created_by: sesi.id,
      is_pool_task: false,
    })
    .select('id, judul')
    .single()

  if (errTask || !newTask) {
    return { sukses: false, pesan: 'Gagal membuat tugas. Silakan coba lagi.' }
  }

  await admin.from('task_assignees').insert({
    task_id: newTask.id,
    user_id: sesi.id,
    assigned_by: sesi.id,
  })

  await catatAktivitas({
    actorId: sesi.id,
    actorNama: sesi.nama,
    jenis: 'task_dibuat',
    objekTipe: 'Task',
    objekId: newTask.id,
    objekNama: newTask.judul,
    divisionId: input.divisionId,
  })

  return { sukses: true }
}

