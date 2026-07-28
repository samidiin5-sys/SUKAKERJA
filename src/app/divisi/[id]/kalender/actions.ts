'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { pastikanAnggotaDivisi } from '@/lib/auth/otorisasi'

export type TaskKalender = {
  id: string
  judul: string
  prioritas: string
  dueDate: string
  completedAt: string | null
  isRecurring: boolean
  boardNama: string
  assignees: { id: string; nama: string; fotoUrl: string | null }[]
}

export async function ambilTaskKalender(
  divisionId: string,
  mulai: string,
  selesai: string
): Promise<TaskKalender[]> {
  const sesi = await pastikanAnggotaDivisi(divisionId)
  const admin = createAdminClient()
  const isStaff = sesi.roleSistem === 'user'

  const { data: boards } = await admin
    .from('boards')
    .select('id, nama')
    .eq('division_id', divisionId)
    .is('deleted_at', null)

  const boardMap = new Map((boards ?? []).map((b: { id: string; nama: string }) => [b.id, b.nama]))
  const boardIds = (boards ?? []).map((b: { id: string }) => b.id)

  if (boardIds.length === 0) return []

  let query = admin
    .from('tasks')
    .select('id, judul, prioritas, due_date, completed_at, is_recurring, board_id, hanya_assignee, task_assignees(user_id, profiles(id, nama, foto_url))')
    .in('board_id', boardIds)
    .is('deleted_at', null)
    .not('due_date', 'is', null)
    .gte('due_date', mulai)
    .lte('due_date', selesai)
    .order('due_date')

  const { data: tasks } = await query

  type BarisTask = {
    id: string
    judul: string
    prioritas: string
    due_date: string
    completed_at: string | null
    is_recurring: boolean
    board_id: string
    hanya_assignee: boolean
    task_assignees: {
      user_id: string
      profiles: { id: string; nama: string; foto_url: string | null }
    }[]
  }

  return ((tasks as unknown as BarisTask[] | null) ?? [])
    .filter((t) => {
      if (!isStaff) return true
      if (t.hanya_assignee) return t.task_assignees.some((a) => a.user_id === sesi.id)
      if (t.is_recurring) return true
      return t.task_assignees.some((a) => a.user_id === sesi.id)
    })
    .map((t) => ({
      id: t.id,
      judul: t.judul,
      prioritas: t.prioritas,
      dueDate: t.due_date,
      completedAt: t.completed_at,
      isRecurring: t.is_recurring,
      boardNama: boardMap.get(t.board_id) ?? '',
      assignees: t.task_assignees.map((a) => ({
        id: a.profiles.id,
        nama: a.profiles.nama,
        fotoUrl: a.profiles.foto_url,
      })),
    }))
}
