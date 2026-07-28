'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { ambilSesiPengguna } from '@/lib/auth/otorisasi'

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

  const { data } = await admin
    .from('task_assignees')
    .select('tasks!inner(id, judul, prioritas, due_date, completed_at, deleted_at, boards!inner(nama, division_id, divisions!inner(nama)))')
    .eq('user_id', sesi.id)
    .gte('tasks.due_date', mulai)
    .lte('tasks.due_date', selesai)
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
