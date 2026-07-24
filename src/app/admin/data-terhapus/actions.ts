'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { pastikanSuperAdmin } from '@/lib/auth/otorisasi'
import { catatAktivitas } from '@/lib/aktivitas'

const BUCKET_LAMPIRAN = 'task-attachments'
const HARI_RETENSI = 90

export type TaskTerhapus = {
  id: string
  judul: string
  divisiId: string
  divisiNama: string
  boardNama: string
  deletedAt: string
  dihapusOleh: string
  sisaHari: number
}

export async function ambilTaskTerhapus(): Promise<TaskTerhapus[]> {
  await pastikanSuperAdmin()
  const admin = createAdminClient()

  const { data } = await admin
    .from('tasks')
    .select(
      'id, judul, deleted_at, board:boards!inner(nama, division_id, division:divisions!inner(nama)), penghapus:profiles!tasks_deleted_by_fkey(nama)'
    )
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })

  type Baris = {
    id: string
    judul: string
    deleted_at: string
    board: { nama: string; division_id: string; division: { nama: string } }
    penghapus: { nama: string } | null
  }

  const sekarang = Date.now()

  return ((data as unknown as Baris[] | null) ?? []).map((t) => {
    const hariBerlalu = Math.floor((sekarang - new Date(t.deleted_at).getTime()) / (1000 * 60 * 60 * 24))
    return {
      id: t.id,
      judul: t.judul,
      divisiId: t.board.division_id,
      divisiNama: t.board.division.nama,
      boardNama: t.board.nama,
      deletedAt: t.deleted_at,
      dihapusOleh: t.penghapus?.nama ?? 'Tidak diketahui',
      sisaHari: Math.max(0, HARI_RETENSI - hariBerlalu),
    }
  })
}

export type HasilRestore = { sukses: true } | { sukses: false; pesan: string }

export async function restoreTask(taskId: string): Promise<HasilRestore> {
  const sesi = await pastikanSuperAdmin()
  const admin = createAdminClient()

  const { data: task } = await admin
    .from('tasks')
    .select('judul, board_id, boards!inner(division_id, deleted_at)')
    .eq('id', taskId)
    .single()

  if (!task) {
    return { sukses: false, pesan: 'Task tidak ditemukan' }
  }

  const board = task.boards as unknown as { division_id: string; deleted_at: string | null }
  let boardTujuan = task.board_id

  if (board.deleted_at !== null) {
    const { data: boardFallback } = await admin
      .from('boards')
      .select('id')
      .eq('division_id', board.division_id)
      .is('deleted_at', null)
      .order('urutan')
      .limit(1)
      .maybeSingle()

    if (!boardFallback) {
      return { sukses: false, pesan: 'Board asal sudah dihapus dan tidak ada board pengganti di divisi ini' }
    }
    boardTujuan = boardFallback.id
  }

  const { error } = await admin
    .from('tasks')
    .update({ deleted_at: null, deleted_by: null, board_id: boardTujuan })
    .eq('id', taskId)

  if (error) {
    return { sukses: false, pesan: 'Gagal memulihkan task. Coba lagi.' }
  }

  await catatAktivitas({
    actorId: sesi.id,
    actorNama: sesi.nama,
    jenis: 'task_restored',
    objekTipe: 'Task',
    objekId: taskId,
    objekNama: task.judul,
    divisionId: board.division_id,
  })

  return { sukses: true }
}

export async function hapusPermanenTask(taskId: string): Promise<HasilRestore> {
  const sesi = await pastikanSuperAdmin()
  const admin = createAdminClient()

  const { data: task } = await admin
    .from('tasks')
    .select('judul, deleted_at, boards!inner(division_id)')
    .eq('id', taskId)
    .single()

  if (!task) {
    return { sukses: false, pesan: 'Task tidak ditemukan' }
  }

  if (task.deleted_at === null) {
    return { sukses: false, pesan: 'Hanya task yang sudah dihapus yang dapat dihapus permanen' }
  }

  const board = task.boards as unknown as { division_id: string }

  const { data: lampiran } = await admin.from('task_attachments').select('path').eq('task_id', taskId)
  if (lampiran && lampiran.length > 0) {
    await admin.storage.from(BUCKET_LAMPIRAN).remove(lampiran.map((l) => l.path))
  }

  const { error } = await admin.from('tasks').delete().eq('id', taskId)

  if (error) {
    return { sukses: false, pesan: 'Gagal menghapus task secara permanen. Coba lagi.' }
  }

  await catatAktivitas({
    actorId: sesi.id,
    actorNama: sesi.nama,
    jenis: 'task_permanently_deleted',
    objekTipe: 'Task',
    objekId: null,
    objekNama: task.judul,
    divisionId: board.division_id,
  })

  return { sukses: true }
}
