'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { ambilSesiPengguna } from '@/lib/auth/otorisasi'
import { kirimNotifikasi } from '@/lib/notifikasi'
import { catatAktivitas } from '@/lib/aktivitas'
import { pastikanOwnerAtauSuperAdmin } from '@/lib/auth/otorisasi'

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
  sudahDiajukan: boolean
}

export type ProposalSaya = {
  id: string
  taskId: string
  taskJudul: string
  divisiNama: string
  deadlineDiusulkan: string
  pesan: string | null
  status: 'menunggu' | 'disetujui' | 'ditolak'
  catatanOwner: string | null
  createdAt: string
}

export type ProposalMenunggu = {
  id: string
  taskId: string
  taskJudul: string
  divisiNama: string
  staffNama: string
  staffId: string
  deadlineDiusulkan: string
  pesan: string | null
  createdAt: string
}

export async function ambilTaskTersedia(): Promise<TaskTersedia[]> {
  const sesi = await ambilSesiPengguna()
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

  const tasks = ((data as unknown as Baris[] | null) ?? []).map((t) => ({
    id: t.id,
    judul: t.judul,
    deskripsi: t.deskripsi,
    prioritas: t.prioritas,
    dueDate: t.due_date,
    divisiNama: t.boards.divisions.nama,
    divisiId: t.boards.division_id,
    dibuatOleh: t.profiles.nama,
    createdAt: t.created_at,
    sudahDiajukan: false,
  }))

  if (tasks.length === 0) return tasks

  // Cek proposal user yang sudah ada
  const taskIds = tasks.map((t) => t.id)
  const { data: proposals } = await admin
    .from('task_pool_proposals')
    .select('task_id')
    .eq('user_id', sesi.id)
    .in('task_id', taskIds)
    .in('status', ['menunggu', 'disetujui'])

  const sudahDiajukanSet = new Set((proposals ?? []).map((p: { task_id: string }) => p.task_id))
  return tasks.map((t) => ({ ...t, sudahDiajukan: sudahDiajukanSet.has(t.id) }))
}

export type HasilAksi = { sukses: true } | { sukses: false; pesan: string }

export async function ajukanPengambilanTask(
  taskId: string,
  deadlineDiusulkan: string,
  pesan: string
): Promise<HasilAksi> {
  const sesi = await ambilSesiPengguna()
  const admin = createAdminClient()

  const { data: task } = await admin
    .from('tasks')
    .select('id, judul, is_pool_task, boards!inner(division_id), created_by')
    .eq('id', taskId)
    .eq('is_pool_task', true)
    .is('deleted_at', null)
    .is('completed_at', null)
    .single()

  if (!task) return { sukses: false, pesan: 'Tugas tidak tersedia atau sudah diambil' }

  const divisionId = (task.boards as { division_id: string }).division_id

  const { error } = await admin.from('task_pool_proposals').upsert(
    {
      task_id: taskId,
      user_id: sesi.id,
      deadline_diusulkan: new Date(deadlineDiusulkan).toISOString(),
      pesan: pesan.trim() || null,
      status: 'menunggu',
    },
    { onConflict: 'task_id,user_id', ignoreDuplicates: false }
  )

  if (error) return { sukses: false, pesan: 'Gagal mengajukan. Coba lagi.' }

  // Notif ke owner divisi
  const { data: ownerDivisi } = await admin
    .from('division_members')
    .select('user_id')
    .eq('division_id', divisionId)
    .eq('role', 'owner')

  const ownerId = (task as { created_by: string }).created_by

  const targetIds = new Set<string>([ownerId])
  ;((ownerDivisi ?? []) as { user_id: string }[]).forEach((m) => targetIds.add(m.user_id))

  await Promise.all(
    Array.from(targetIds).map((uid) =>
      kirimNotifikasi({
        userId: uid,
        jenis: 'task_ditugaskan',
        pesan: `${sesi.nama} mengajukan pengambilan tugas "${(task as { judul: string }).judul}" — tunggu persetujuan.`,
        taskId,
        divisionId,
      })
    )
  )

  return { sukses: true }
}

export async function ambilProposalSaya(): Promise<ProposalSaya[]> {
  const sesi = await ambilSesiPengguna()
  const admin = createAdminClient()

  const { data } = await admin
    .from('task_pool_proposals')
    .select('id, task_id, deadline_diusulkan, pesan, status, catatan_owner, created_at, tasks!inner(judul, boards!inner(divisions!inner(nama)))')
    .eq('user_id', sesi.id)
    .order('created_at', { ascending: false })
    .limit(30)

  type Baris = {
    id: string
    task_id: string
    deadline_diusulkan: string
    pesan: string | null
    status: 'menunggu' | 'disetujui' | 'ditolak'
    catatan_owner: string | null
    created_at: string
    tasks: { judul: string; boards: { divisions: { nama: string } } }
  }

  return ((data as unknown as Baris[] | null) ?? []).map((p) => ({
    id: p.id,
    taskId: p.task_id,
    taskJudul: p.tasks.judul,
    divisiNama: p.tasks.boards.divisions.nama,
    deadlineDiusulkan: p.deadline_diusulkan,
    pesan: p.pesan,
    status: p.status,
    catatanOwner: p.catatan_owner,
    createdAt: p.created_at,
  }))
}

export async function ambilProposalMenunggu(): Promise<ProposalMenunggu[]> {
  await pastikanOwnerAtauSuperAdmin()
  const admin = createAdminClient()

  const { data } = await admin
    .from('task_pool_proposals')
    .select('id, task_id, deadline_diusulkan, pesan, created_at, user_id, tasks!inner(judul, boards!inner(divisions!inner(nama))), profiles!task_pool_proposals_user_id_fkey(nama)')
    .eq('status', 'menunggu')
    .order('created_at', { ascending: true })
    .limit(50)

  type Baris = {
    id: string
    task_id: string
    deadline_diusulkan: string
    pesan: string | null
    created_at: string
    user_id: string
    tasks: { judul: string; boards: { divisions: { nama: string } } }
    profiles: { nama: string }
  }

  return ((data as unknown as Baris[] | null) ?? []).map((p) => ({
    id: p.id,
    taskId: p.task_id,
    taskJudul: p.tasks.judul,
    divisiNama: p.tasks.boards.divisions.nama,
    staffNama: p.profiles.nama,
    staffId: p.user_id,
    deadlineDiusulkan: p.deadline_diusulkan,
    pesan: p.pesan,
    createdAt: p.created_at,
  }))
}

export async function tinjauProposal(
  proposalId: string,
  keputusan: 'disetujui' | 'ditolak',
  catatan: string
): Promise<HasilAksi> {
  const sesi = await pastikanOwnerAtauSuperAdmin()
  const admin = createAdminClient()

  const { data: proposal } = await admin
    .from('task_pool_proposals')
    .select('id, task_id, user_id, deadline_diusulkan, tasks!inner(judul, boards!inner(division_id))')
    .eq('id', proposalId)
    .eq('status', 'menunggu')
    .single()

  if (!proposal) return { sukses: false, pesan: 'Proposal tidak ditemukan atau sudah ditinjau' }

  const p = proposal as unknown as {
    id: string
    task_id: string
    user_id: string
    deadline_diusulkan: string
    tasks: { judul: string; boards: { division_id: string } }
  }
  const divisionId = p.tasks.boards.division_id

  await admin
    .from('task_pool_proposals')
    .update({
      status: keputusan,
      catatan_owner: catatan.trim() || null,
      reviewed_by: sesi.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', proposalId)

  if (keputusan === 'disetujui') {
    // Auto-join divisi jika belum anggota
    const { data: sudahAnggota } = await admin
      .from('division_members')
      .select('id')
      .eq('division_id', divisionId)
      .eq('user_id', p.user_id)
      .maybeSingle()

    if (!sudahAnggota) {
      await admin.from('division_members').insert({
        division_id: divisionId,
        user_id: p.user_id,
        role: 'staff',
      })
    }

    // Assign ke staff + set deadline
    await admin.from('task_assignees').upsert({
      task_id: p.task_id,
      user_id: p.user_id,
      assigned_by: sesi.id,
    })

    await admin
      .from('tasks')
      .update({ is_pool_task: false, due_date: p.deadline_diusulkan })
      .eq('id', p.task_id)

    // Tolak proposal lain untuk task yang sama
    await admin
      .from('task_pool_proposals')
      .update({ status: 'ditolak', catatan_owner: 'Tugas sudah diambil oleh staff lain.', reviewed_by: sesi.id, reviewed_at: new Date().toISOString() })
      .eq('task_id', p.task_id)
      .eq('status', 'menunggu')
      .neq('id', proposalId)

    await catatAktivitas({
      actorId: sesi.id,
      actorNama: sesi.nama,
      jenis: 'task_updated',
      objekTipe: 'Task',
      objekId: p.task_id,
      objekNama: p.tasks.judul,
      divisionId,
    })

    await kirimNotifikasi({
      userId: p.user_id,
      jenis: 'lembur_disetujui',
      pesan: `Pengajuan kamu untuk tugas "${p.tasks.judul}" disetujui! Deadline: ${new Date(p.deadline_diusulkan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.`,
      taskId: p.task_id,
      divisionId,
    })
  } else {
    await kirimNotifikasi({
      userId: p.user_id,
      jenis: 'lembur_ditolak',
      pesan: `Pengajuan kamu untuk tugas "${p.tasks.judul}" ditolak.${catatan ? ` Catatan: ${catatan}` : ''}`,
      taskId: p.task_id,
      divisionId,
    })
  }

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
