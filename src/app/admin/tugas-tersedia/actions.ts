'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { pastikanOwnerAtauSuperAdmin } from '@/lib/auth/otorisasi'
import { kirimTugasPool } from '@/app/divisi/[id]/actions'

export type BoardDivisi = { id: string; nama: string }

export type TaskPoolAktif = {
  id: string
  judul: string
  deskripsi: string | null
  prioritas: string
  dueDate: string | null
  targetScope: 'semua' | 'divisi'
  divisiNama: string
  createdAt: string
  jumlahPeminat: number
}

export async function ambilBoardUntukPool(divisionId: string): Promise<BoardDivisi[]> {
  if (!divisionId) return []
  await pastikanOwnerAtauSuperAdmin()
  const admin = createAdminClient()

  const { data } = await admin
    .from('boards')
    .select('id, nama')
    .eq('division_id', divisionId)
    .is('deleted_at', null)
    .order('urutan', { ascending: true })

  return ((data as { id: string; nama: string }[] | null) ?? [])
}

export async function ambilTaskPoolAktif(): Promise<TaskPoolAktif[]> {
  const sesi = await pastikanOwnerAtauSuperAdmin()
  const admin = createAdminClient()

  let query = admin
    .from('tasks')
    .select('id, judul, deskripsi, prioritas, due_date, target_scope, created_at, boards!inner(divisions!inner(nama))')
    .eq('is_pool_task', true)
    .is('deleted_at', null)
    .is('completed_at', null)
    .order('created_at', { ascending: false })
    .limit(50)

  if (sesi.roleSistem !== 'super_admin') {
    query = query.eq('created_by', sesi.id)
  }

  const { data } = await query

  type Baris = {
    id: string
    judul: string
    deskripsi: string | null
    prioritas: string
    due_date: string | null
    target_scope: string
    created_at: string
    boards: { divisions: { nama: string } }
  }

  const tasks = ((data as unknown as Baris[] | null) ?? [])

  if (tasks.length === 0) return []

  const taskIds = tasks.map((t) => t.id)
  const { data: peminat } = await admin
    .from('task_pool_proposals')
    .select('task_id')
    .in('task_id', taskIds)
    .in('status', ['menunggu'])

  const peminatCount = new Map<string, number>()
  ;((peminat ?? []) as { task_id: string }[]).forEach((p) => {
    peminatCount.set(p.task_id, (peminatCount.get(p.task_id) ?? 0) + 1)
  })

  return tasks.map((t) => ({
    id: t.id,
    judul: t.judul,
    deskripsi: t.deskripsi,
    prioritas: t.prioritas,
    dueDate: t.due_date,
    targetScope: t.target_scope as 'semua' | 'divisi',
    divisiNama: t.boards.divisions.nama,
    createdAt: t.created_at,
    jumlahPeminat: peminatCount.get(t.id) ?? 0,
  }))
}

export async function hapusTugasPool(taskId: string): Promise<{ sukses: boolean; pesan?: string }> {
  const sesi = await pastikanOwnerAtauSuperAdmin()
  const admin = createAdminClient()

  const { data: task } = await admin
    .from('tasks')
    .select('id, created_by')
    .eq('id', taskId)
    .eq('is_pool_task', true)
    .is('deleted_at', null)
    .single()

  if (!task) return { sukses: false, pesan: 'Tugas tidak ditemukan.' }
  const t = task as { id: string; created_by: string }
  if (sesi.roleSistem !== 'super_admin' && t.created_by !== sesi.id) {
    return { sukses: false, pesan: 'Tidak punya izin menghapus tugas ini.' }
  }

  await admin.from('tasks').update({ deleted_at: new Date().toISOString() }).eq('id', taskId)
  return { sukses: true }
}

export { kirimTugasPool }
