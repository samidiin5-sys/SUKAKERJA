'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { ambilSesiPengguna } from '@/lib/auth/otorisasi'
import { kirimNotifikasi } from '@/lib/notifikasi'
import { catatAktivitas } from '@/lib/aktivitas'

export type TaskTersedia = {
  id: string
  judul: string
  deskripsi: string | null
  prioritas: string
  dueDate: string | null
  divisiNama: string
  divisiId: string
  dibuatOleh: string
  createdAt: string
}

export async function ambilTaskTersedia(): Promise<TaskTersedia[]> {
  await ambilSesiPengguna()
  const admin = createAdminClient()

  const { data } = await admin
    .from('tasks')
    .select('id, judul, deskripsi, prioritas, due_date, created_at, boards!inner(division_id, divisions!inner(nama)), profiles!tasks_created_by_fkey(nama)')
    .eq('is_pool_task', true)
    .is('deleted_at', null)
    .is('completed_at', null)
    .order('created_at', { ascending: false })
    .limit(50)

  type Baris = {
    id: string
    judul: string
    deskripsi: string | null
    prioritas: string
    due_date: string | null
    created_at: string
    boards: { division_id: string; divisions: { nama: string } }
    profiles: { nama: string }
  }

  return ((data as unknown as Baris[] | null) ?? []).map((t) => ({
    id: t.id,
    judul: t.judul,
    deskripsi: t.deskripsi,
    prioritas: t.prioritas,
    dueDate: t.due_date,
    divisiNama: t.boards.divisions.nama,
    divisiId: t.boards.division_id,
    dibuatOleh: t.profiles.nama,
    createdAt: t.created_at,
  }))
}

export type HasilAksi = { sukses: true } | { sukses: false; pesan: string }

export async function ambilTask(taskId: string): Promise<HasilAksi> {
  const sesi = await ambilSesiPengguna()
  const admin = createAdminClient()

  const { data: task } = await admin
    .from('tasks')
    .select('id, judul, is_pool_task, boards!inner(division_id)')
    .eq('id', taskId)
    .eq('is_pool_task', true)
    .is('deleted_at', null)
    .is('completed_at', null)
    .single()

  if (!task) return { sukses: false, pesan: 'Tugas tidak tersedia atau sudah diambil' }

  const divisionId = (task.boards as any).division_id

  const { data: sudahAnggota } = await admin
    .from('division_members')
    .select('id')
    .eq('division_id', divisionId)
    .eq('user_id', sesi.id)
    .maybeSingle()

  if (!sudahAnggota) {
    await admin.from('division_members').insert({
      division_id: divisionId,
      user_id: sesi.id,
      role: 'staff',
    })
  }

  const { error: eAssignee } = await admin.from('task_assignees').upsert({
    task_id: taskId,
    user_id: sesi.id,
    assigned_by: sesi.id,
  })

  if (eAssignee) return { sukses: false, pesan: 'Gagal mengambil tugas. Coba lagi.' }

  await admin.from('tasks').update({ is_pool_task: false }).eq('id', taskId)

  await catatAktivitas({
    actorId: sesi.id,
    actorNama: sesi.nama,
    jenis: 'task_updated',
    objekTipe: 'Task',
    objekId: taskId,
    objekNama: task.judul,
    divisionId,
  })

  return { sukses: true }
}

export async function kirimNotifTaskPool(
  taskId: string,
  judulTask: string,
  divisionId: string
): Promise<void> {
  const admin = createAdminClient()

  const { data: semua } = await admin
    .from('profiles')
    .select('id')
    .eq('status', 'aktif')
    .is('deleted_at', null)
    .eq('role_sistem', 'user')

  await Promise.all(
    ((semua ?? []) as { id: string }[]).map((u) =>
      kirimNotifikasi({
        userId: u.id,
        jenis: 'task_pool_baru',
        pesan: `Ada tugas baru yang bisa kamu ambil: "${judulTask}"`,
        taskId,
        divisionId,
      })
    )
  )
}
