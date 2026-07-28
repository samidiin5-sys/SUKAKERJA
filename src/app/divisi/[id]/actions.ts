'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { bolehPindahTask, pastikanAnggotaDivisi, pastikanOwner } from '@/lib/auth/otorisasi'
import { catatAktivitas } from '@/lib/aktivitas'
import { kirimNotifikasi } from '@/lib/notifikasi'

// ---------- Detail Divisi ----------

export type DetailDivisi = { id: string; nama: string; deskripsi: string | null; warna: string }

export async function ambilDetailDivisi(divisionId: string): Promise<DetailDivisi | null> {
  await pastikanAnggotaDivisi(divisionId)

  const admin = createAdminClient()
  const { data } = await admin
    .from('divisions')
    .select('id, nama, deskripsi, warna')
    .eq('id', divisionId)
    .single()

  return data
}

// ---------- Anggota ----------

export type AnggotaDivisi = {
  id: string
  nama: string
  jabatan: string | null
  role: string
  fotoUrl?: string | null
}

export async function ambilAnggotaDivisi(divisionId: string): Promise<AnggotaDivisi[]> {
  await pastikanAnggotaDivisi(divisionId)

  const admin = createAdminClient()
  const { data } = await admin
    .from('division_members')
    .select('role, profiles!inner(id, nama, jabatan, foto_url)')
    .eq('division_id', divisionId)

  type Baris = { role: string; profiles: { id: string; nama: string; jabatan: string | null; foto_url: string | null } }

  return ((data as unknown as Baris[] | null) ?? [])
    .map((row) => ({
      id: row.profiles.id,
      nama: row.profiles.nama,
      jabatan: row.profiles.jabatan,
      role: row.role,
      fotoUrl: row.profiles.foto_url,
    }))
    .sort((a, b) => a.nama.localeCompare(b.nama))
}

export type KaryawanTersedia = { id: string; nama: string; jabatan: string | null }

export async function ambilKaryawanBelumJadiAnggota(divisionId: string): Promise<KaryawanTersedia[]> {
  await pastikanOwner(divisionId)

  const admin = createAdminClient()
  const { data: anggotaSekarang } = await admin
    .from('division_members')
    .select('user_id')
    .eq('division_id', divisionId)

  const idAnggota = (anggotaSekarang ?? []).map((a) => a.user_id)

  const query = admin
    .from('profiles')
    .select('id, nama, jabatan')
    .is('deleted_at', null)
    .eq('status', 'aktif')
    .order('nama')

  const { data } = idAnggota.length > 0 ? await query.not('id', 'in', `(${idAnggota.join(',')})`) : await query

  return data ?? []
}

export type HasilAksiAnggota = { sukses: true } | { sukses: false; pesan: string }

export async function tambahAnggota(
  divisionId: string,
  userId: string,
  role: 'staff'
): Promise<HasilAksiAnggota> {
  const sesi = await pastikanOwner(divisionId)

  const admin = createAdminClient()
  const { error } = await admin
    .from('division_members')
    .insert({ division_id: divisionId, user_id: userId, role })

  if (error) {
    return { sukses: false, pesan: 'Gagal menambahkan anggota. Coba lagi.' }
  }

  const { data: target } = await admin.from('profiles').select('nama').eq('id', userId).single()
  await catatAktivitas({
    actorId: sesi.id,
    actorNama: sesi.nama,
    jenis: 'anggota_ditambah',
    objekTipe: 'DivisionMember',
    objekId: userId,
    objekNama: target?.nama ?? userId,
    divisionId,
  })

  return { sukses: true }
}

export async function keluarkanAnggota(divisionId: string, userId: string): Promise<HasilAksiAnggota> {
  const sesi = await pastikanOwner(divisionId)

  const admin = createAdminClient()
  const { data: target } = await admin.from('profiles').select('nama').eq('id', userId).single()

  const { error } = await admin
    .from('division_members')
    .delete()
    .eq('division_id', divisionId)
    .eq('user_id', userId)

  if (error) {
    return { sukses: false, pesan: 'Gagal mengeluarkan anggota. Coba lagi.' }
  }

  await catatAktivitas({
    actorId: sesi.id,
    actorNama: sesi.nama,
    jenis: 'anggota_dikeluarkan',
    objekTipe: 'DivisionMember',
    objekId: userId,
    objekNama: target?.nama ?? userId,
    divisionId,
  })

  return { sukses: true }
}

// ---------- Statistik Divisi ----------

export type ProduktivitasAnggota = {
  id: string
  nama: string
  aktif: number
  selesai: number
  terlambat: number
}

export type TenggatTerdekatDivisi = { id: string; judul: string; dueDate: string; boardNama: string }

export type StatistikDivisi = {
  totalAktif: number
  selesaiBulanIni: number
  terlambat: number
  produktivitas: ProduktivitasAnggota[]
  tenggatTerdekat: TenggatTerdekatDivisi[]
}

export async function ambilStatistikDivisi(divisionId: string): Promise<StatistikDivisi> {
  const sesi = await pastikanAnggotaDivisi(divisionId)
  const bolehLihatSemua = sesi.roleSistem === 'super_admin' || sesi.roleSistem === 'owner'

  const admin = createAdminClient()

  const [{ data: boards }, anggota] = await Promise.all([
    admin.from('boards').select('id, nama').eq('division_id', divisionId).is('deleted_at', null),
    ambilAnggotaDivisi(divisionId),
  ])

  const boardMap = new Map((boards ?? []).map((b) => [b.id, b.nama]))
  const boardIds = (boards ?? []).map((b) => b.id)

  const kosong: StatistikDivisi = {
    totalAktif: 0,
    selesaiBulanIni: 0,
    terlambat: 0,
    produktivitas: anggota.map((a) => ({ id: a.id, nama: a.nama, aktif: 0, selesai: 0, terlambat: 0 })),
    tenggatTerdekat: [],
  }

  if (boardIds.length === 0) return kosong

  const { data: tasks } = await admin
    .from('tasks')
    .select('id, judul, due_date, completed_at, board_id, hanya_assignee, task_assignees(user_id)')
    .in('board_id', boardIds)
    .is('deleted_at', null)

  type BarisTask = {
    id: string
    judul: string
    due_date: string | null
    completed_at: string | null
    board_id: string
    hanya_assignee: boolean
    task_assignees: { user_id: string }[]
  }

  const semuaTask = ((tasks as unknown as BarisTask[] | null) ?? []).filter((t) => {
    if (!t.hanya_assignee) return true
    if (bolehLihatSemua) return true
    return t.task_assignees.some((ta) => ta.user_id === sesi.id)
  })

  const sekarang = new Date()
  const awalHariIni = new Date(sekarang)
  awalHariIni.setHours(0, 0, 0, 0)
  const awalBulanIni = new Date(sekarang.getFullYear(), sekarang.getMonth(), 1)

  const aktif = semuaTask.filter((t) => t.completed_at === null)
  const selesai = semuaTask.filter((t) => t.completed_at !== null)
  const terlambatList = aktif.filter((t) => t.due_date && new Date(t.due_date).getTime() < awalHariIni.getTime())
  const selesaiBulanIni = selesai.filter((t) => new Date(t.completed_at as string).getTime() >= awalBulanIni.getTime())

  const produktivitas: ProduktivitasAnggota[] = anggota.map((a) => {
    const tugasSaya = semuaTask.filter((t) => t.task_assignees.some((ta) => ta.user_id === a.id))
    return {
      id: a.id,
      nama: a.nama,
      aktif: tugasSaya.filter((t) => t.completed_at === null).length,
      selesai: tugasSaya.filter((t) => t.completed_at !== null).length,
      terlambat: tugasSaya.filter((t) => t.completed_at === null && t.due_date && new Date(t.due_date).getTime() < awalHariIni.getTime()).length,
    }
  })

  const tenggatTerdekat = aktif
    .filter((t) => t.due_date !== null)
    .sort((a, b) => new Date(a.due_date as string).getTime() - new Date(b.due_date as string).getTime())
    .slice(0, 10)
    .map((t) => ({
      id: t.id,
      judul: t.judul,
      dueDate: t.due_date as string,
      boardNama: boardMap.get(t.board_id) ?? '',
    }))

  return {
    totalAktif: aktif.length,
    selesaiBulanIni: selesaiBulanIni.length,
    terlambat: terlambatList.length,
    produktivitas,
    tenggatTerdekat,
  }
}

// ---------- Papan & Task ----------

export type TaskRingkas = {
  id: string
  judul: string
  prioritas: string
  dueDate: string | null
  completedAt: string | null
  assignees: { id: string; nama: string; fotoUrl?: string | null }[]
  ditugaskanOleh: string | null
  bolehGeser: boolean
  bolehHapus: boolean
  checklistTotal: number
  checklistSelesai: number
  coverImageUrl: string | null
  isRecurring: boolean
  deskripsi?: string | null
  jumlahKomentar?: number
  jumlahLampiran?: number
}

export type BoardDenganTask = {
  id: string
  nama: string
  urutan: number
  isCompletionBoard: boolean
  tasks: TaskRingkas[]
}

export async function ambilPapanDivisi(divisionId: string): Promise<BoardDenganTask[]> {
  const sesi = await pastikanAnggotaDivisi(divisionId)

  const admin = createAdminClient()

  const { data: boards } = await admin
    .from('boards')
    .select('id, nama, urutan, is_completion_board')
    .eq('division_id', divisionId)
    .is('deleted_at', null)
    .order('urutan')

  if (!boards || boards.length === 0) return []

  const boardIds = boards.map((b) => b.id)

  const { data: tasks } = await admin
    .from('tasks')
    .select(
      'id, board_id, judul, prioritas, due_date, completed_at, created_by, urutan, is_recurring, hanya_assignee, deskripsi, task_assignees(user_id, profiles!task_assignees_user_id_fkey(id, nama, foto_url), pemberi:profiles!task_assignees_assigned_by_fkey(nama)), checklist_items(id, selesai), comments(id), task_attachments(id)'
    )
    .in('board_id', boardIds)
    .is('deleted_at', null)
    .order('urutan')

  type BarisTask = {
    id: string
    board_id: string
    judul: string
    prioritas: string
    due_date: string | null
    completed_at: string | null
    created_by: string
    urutan: number
    is_recurring: boolean
    hanya_assignee: boolean
    deskripsi: string | null
    task_assignees: {
      user_id: string
      profiles: { id: string; nama: string; foto_url: string | null }
      pemberi: { nama: string } | null
    }[]
    checklist_items: { id: string; selesai: boolean }[]
    comments: { id: string }[]
    task_attachments: { id: string }[]
  }

  const bolehLihatSemua = sesi.roleSistem === 'super_admin' || sesi.roleSistem === 'owner'

  const semuaTask = ((tasks as unknown as BarisTask[] | null) ?? []).filter((t) => {
    if (!t.hanya_assignee) return true
    if (bolehLihatSemua) return true
    return t.task_assignees.some((a) => a.user_id === sesi.id)
  })

  // Ambil cover image (lampiran gambar pertama) per task — gunakan signed URL
  const taskIds = semuaTask.map(t => t.id)
  const coverMap = new Map<string, string>()
  if (taskIds.length > 0) {
    const { data: covers } = await admin
      .from('task_attachments')
      .select('task_id, path, tipe_mime')
      .in('task_id', taskIds)
      .in('tipe_mime', ['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
      .order('created_at', { ascending: true })

    // Ambil satu cover per task (yang pertama di-upload)
    const coverUnik = new Map<string, string>()
    for (const cover of covers ?? []) {
      if (!coverUnik.has(cover.task_id)) {
        coverUnik.set(cover.task_id, cover.path)
      }
    }

    // Generate signed URL secara paralel (expiry 1 jam = 3600 detik)
    await Promise.all(
      Array.from(coverUnik.entries()).map(async ([taskId, path]) => {
        const { data } = await admin.storage
          .from('task-attachments')
          .createSignedUrl(path, 3600)
        if (data?.signedUrl) {
          coverMap.set(taskId, data.signedUrl)
        }
      })
    )
  }

  const bolehGeserSemua = sesi.roleSistem === 'super_admin' || sesi.roleSistem === 'owner'

  function hitungBolehGeser(t: BarisTask): boolean {
    if (bolehGeserSemua) return true
    return t.created_by === sesi.id || t.task_assignees.some((a) => a.user_id === sesi.id)
  }

  const bolehHapusTask = sesi.roleSistem === 'super_admin' || sesi.roleSistem === 'owner'

  return boards.map((b) => ({
    id: b.id,
    nama: b.nama,
    urutan: b.urutan,
    isCompletionBoard: b.is_completion_board,
    tasks: semuaTask
      .filter((t) => t.board_id === b.id)
      .map((t) => ({
        id: t.id,
        judul: t.judul,
        prioritas: t.prioritas,
        dueDate: t.due_date,
        completedAt: t.completed_at,
        assignees: (t.task_assignees ?? []).map((a) => ({
          id: a.profiles.id,
          nama: a.profiles.nama,
          fotoUrl: a.profiles.foto_url,
        })),
        ditugaskanOleh: t.task_assignees?.[0]?.pemberi?.nama ?? null,
        bolehGeser: hitungBolehGeser(t),
        bolehHapus: bolehHapusTask,
        checklistTotal: (t.checklist_items ?? []).length,
        checklistSelesai: (t.checklist_items ?? []).filter((c) => c.selesai).length,
        coverImageUrl: coverMap.get(t.id) ?? null,
        isRecurring: t.is_recurring,
        deskripsi: t.deskripsi,
        jumlahKomentar: (t.comments ?? []).length,
        jumlahLampiran: (t.task_attachments ?? []).length,
      })),
  }))
}

export type HasilBuatTask = { sukses: true } | { sukses: false; pesan: string }

export async function buatTask(
  divisionId: string,
  boardId: string,
  judul: string
): Promise<HasilBuatTask> {
  const sesi = await pastikanAnggotaDivisi(divisionId)

  if (!judul.trim()) {
    return { sukses: false, pesan: 'Judul task tidak boleh kosong' }
  }
  if (judul.trim().length > 200) {
    return { sukses: false, pesan: 'Judul task maksimal 200 karakter' }
  }

  const admin = createAdminClient()
  const { data: taskBaru, error } = await admin
    .from('tasks')
    .insert({
      board_id: boardId,
      judul: judul.trim(),
      created_by: sesi.id,
    })
    .select('id')
    .single()

  if (error) {
    return { sukses: false, pesan: 'Gagal membuat task. Coba lagi.' }
  }

  await catatAktivitas({
    actorId: sesi.id,
    actorNama: sesi.nama,
    jenis: 'task_dibuat',
    objekTipe: 'Task',
    objekId: taskBaru?.id ?? null,
    objekNama: judul.trim(),
    divisionId,
  })

  return { sukses: true }
}

/**
 * Owner mengirim tugas ke staff tertentu (tag). Task ini cuma muncul di
 * papan untuk staff yang di-tag (+ Super Admin/Owner) — bukan seluruh
 * anggota divisi seperti task biasa yang dibuat lewat "+ Tambah task".
 */
export async function kirimTugasOwner(
  divisionId: string,
  boardId: string,
  judul: string,
  deskripsi: string,
  deadline: string | null,
  assigneeIds: string[]
): Promise<HasilBuatTask> {
  const sesi = await pastikanOwner(divisionId)

  const judulBersih = judul.trim()
  if (!judulBersih) return { sukses: false, pesan: 'Judul tugas tidak boleh kosong' }
  if (judulBersih.length > 200) return { sukses: false, pesan: 'Judul tugas maksimal 200 karakter' }
  if (assigneeIds.length === 0) return { sukses: false, pesan: 'Pilih minimal 1 staff yang ditag' }

  const admin = createAdminClient()
  const { data: taskBaru, error } = await admin
    .from('tasks')
    .insert({
      board_id: boardId,
      judul: judulBersih,
      deskripsi: deskripsi.trim() || null,
      due_date: deadline || null,
      created_by: sesi.id,
      hanya_assignee: true,
    })
    .select('id')
    .single()

  if (error || !taskBaru) {
    return { sukses: false, pesan: 'Gagal mengirim tugas. Coba lagi.' }
  }

  await admin.from('task_assignees').insert(
    assigneeIds.map((userId) => ({ task_id: taskBaru.id, user_id: userId, assigned_by: sesi.id }))
  )

  await catatAktivitas({
    actorId: sesi.id,
    actorNama: sesi.nama,
    jenis: 'task_dibuat',
    objekTipe: 'Task',
    objekId: taskBaru.id,
    objekNama: judulBersih,
    divisionId,
  })

  for (const userId of assigneeIds) {
    await kirimNotifikasi({
      userId,
      jenis: 'task_ditugaskan',
      pesan: `${sesi.nama} mengirim tugas baru: "${judulBersih}"`,
      taskId: taskBaru.id,
      divisionId,
    })
  }

  return { sukses: true }
}

export async function kirimTugasPool(
  divisionId: string,
  boardId: string,
  judul: string,
  deskripsi: string,
  deadline: string | null
): Promise<HasilBuatTask & { taskId?: string }> {
  const sesi = await pastikanOwner(divisionId)

  const judulBersih = judul.trim()
  if (!judulBersih) return { sukses: false, pesan: 'Judul tugas tidak boleh kosong' }
  if (judulBersih.length > 200) return { sukses: false, pesan: 'Judul tugas maksimal 200 karakter' }

  const admin = createAdminClient()
  const { data: taskBaru, error } = await admin
    .from('tasks')
    .insert({
      board_id: boardId,
      judul: judulBersih,
      deskripsi: deskripsi.trim() || null,
      due_date: deadline || null,
      created_by: sesi.id,
      is_pool_task: true,
      hanya_assignee: false,
    })
    .select('id')
    .single()

  if (error || !taskBaru) return { sukses: false, pesan: 'Gagal membuat tugas pool. Coba lagi.' }

  await catatAktivitas({
    actorId: sesi.id,
    actorNama: sesi.nama,
    jenis: 'task_dibuat',
    objekTipe: 'Task',
    objekId: taskBaru.id,
    objekNama: judulBersih,
    divisionId,
  })

  // Kirim notif ke semua staff aktif
  const { data: semuaStaff } = await admin
    .from('profiles')
    .select('id')
    .eq('status', 'aktif')
    .is('deleted_at', null)
    .eq('role_sistem', 'user')

  await Promise.all(
    ((semuaStaff ?? []) as { id: string }[]).map((u) =>
      kirimNotifikasi({
        userId: u.id,
        jenis: 'task_pool_baru',
        pesan: `Ada tugas baru yang bisa kamu ambil: "${judulBersih}"`,
        taskId: taskBaru.id,
        divisionId,
      })
    )
  )

  return { sukses: true, taskId: taskBaru.id }
}

export async function pindahkanTask(
  divisionId: string,
  taskId: string,
  boardIdBaru: string,
  urutanBaru?: number
): Promise<HasilBuatTask> {
  const sesi = await pastikanAnggotaDivisi(divisionId)

  const boleh = await bolehPindahTask(divisionId, taskId)
  if (!boleh) {
    return { sukses: false, pesan: 'Anda tidak memiliki izin untuk memindahkan task ini' }
  }

  const admin = createAdminClient()

  const [{ data: board }, { data: task }] = await Promise.all([
    admin
      .from('boards')
      .select('is_completion_board, nama, division_id')
      .eq('id', boardIdBaru)
      .single(),
    admin.from('tasks').select('judul').eq('id', taskId).single(),
  ])

  if (!board || board.division_id !== divisionId) {
    return { sukses: false, pesan: 'Tidak boleh memindahkan task ke board divisi lain' }
  }

  const update: Record<string, unknown> = { board_id: boardIdBaru }
  if (board.is_completion_board) {
    update.completed_at = new Date().toISOString()
    update.completed_by = sesi.id
  } else {
    update.completed_at = null
    update.completed_by = null
  }
  if (typeof urutanBaru === 'number') {
    update.urutan = urutanBaru
  }

  const { error } = await admin.from('tasks').update(update).eq('id', taskId)

  if (error) {
    return { sukses: false, pesan: 'Gagal memindahkan task. Coba lagi.' }
  }

  await catatAktivitas({
    actorId: sesi.id,
    actorNama: sesi.nama,
    jenis: 'task_dipindah',
    objekTipe: 'Task',
    objekId: taskId,
    objekNama: `${task?.judul ?? taskId} → ${board.nama}`,
    divisionId,
  })

  return { sukses: true }
}

export async function ubahUrutanTask(
  divisionId: string,
  urutan: { taskId: string; urutan: number }[]
): Promise<HasilBuatTask> {
  const sesi = await pastikanAnggotaDivisi(divisionId)

  if (urutan.length === 0) {
    return { sukses: true }
  }

  for (const item of urutan) {
    const boleh = await bolehPindahTask(divisionId, item.taskId)
    if (!boleh) {
      return { sukses: false, pesan: 'Anda tidak memiliki izin untuk mengurutkan task ini' }
    }
  }

  const admin = createAdminClient()

  const hasilUpdate = await Promise.all(
    urutan.map((item) => admin.from('tasks').update({ urutan: item.urutan }).eq('id', item.taskId))
  )

  const gagal = hasilUpdate.find((r) => r.error)
  if (gagal) {
    return { sukses: false, pesan: 'Gagal menyimpan urutan task. Coba lagi.' }
  }

  const { data: task } = await admin.from('tasks').select('judul').eq('id', urutan[0].taskId).single()
  await catatAktivitas({
    actorId: sesi.id,
    actorNama: sesi.nama,
    jenis: 'task_diurutkan',
    objekTipe: 'Task',
    objekId: urutan[0].taskId,
    objekNama: task?.judul ?? urutan[0].taskId,
    divisionId,
  })

  return { sukses: true }
}

export async function tandaiSelesai(divisionId: string, taskId: string): Promise<HasilBuatTask> {
  const sesi = await pastikanAnggotaDivisi(divisionId)

  const admin = createAdminClient()

  const { data: task } = await admin.from('tasks').select('board_id, judul').eq('id', taskId).single()
  if (!task) return { sukses: false, pesan: 'Task tidak ditemukan' }

  const { data: boardSelesai } = await admin
    .from('boards')
    .select('id')
    .eq('division_id', divisionId)
    .eq('is_completion_board', true)
    .single()

  if (!boardSelesai) {
    return { sukses: false, pesan: 'Divisi ini belum memiliki board penyelesaian' }
  }

  const { error } = await admin
    .from('tasks')
    .update({
      board_id: boardSelesai.id,
      completed_at: new Date().toISOString(),
      completed_by: sesi.id,
    })
    .eq('id', taskId)

  if (error) {
    return { sukses: false, pesan: 'Gagal menandai task selesai. Coba lagi.' }
  }

  await catatAktivitas({
    actorId: sesi.id,
    actorNama: sesi.nama,
    jenis: 'task_selesai',
    objekTipe: 'Task',
    objekId: taskId,
    objekNama: task.judul,
    divisionId,
  })

  return { sukses: true }
}

export async function hapusTask(divisionId: string, taskId: string): Promise<HasilBuatTask> {
  const sesi = await pastikanAnggotaDivisi(divisionId)

  const admin = createAdminClient()

  const { data: task } = await admin.from('tasks').select('judul').eq('id', taskId).single()
  if (!task) return { sukses: false, pesan: 'Task tidak ditemukan' }

  const bolehHapus = sesi.roleSistem === 'super_admin' || sesi.roleSistem === 'owner'

  if (!bolehHapus) {
    return { sukses: false, pesan: 'Hanya Owner atau Super Admin yang dapat menghapus task' }
  }

  const { error } = await admin
    .from('tasks')
    .update({ deleted_at: new Date().toISOString(), deleted_by: sesi.id })
    .eq('id', taskId)

  if (error) {
    return { sukses: false, pesan: 'Gagal menghapus task. Coba lagi.' }
  }

  await catatAktivitas({
    actorId: sesi.id,
    actorNama: sesi.nama,
    jenis: 'task_dihapus',
    objekTipe: 'Task',
    objekId: taskId,
    objekNama: task.judul,
    divisionId,
  })

  return { sukses: true }
}

// ---------- Detail Task ----------

export type DetailTask = {
  id: string
  judul: string
  deskripsi: string | null
  prioritas: string
  dueDate: string | null
  completedAt: string | null
  boardId: string
  assigneeIds: string[]
  isRecurring: boolean
  templatePola: string | null
  alasanTerlambat: string | null
}

export async function ambilDetailTask(divisionId: string, taskId: string): Promise<DetailTask | null> {
  await pastikanAnggotaDivisi(divisionId)

  const admin = createAdminClient()
  const { data: task } = await admin
    .from('tasks')
    .select('id, judul, deskripsi, prioritas, due_date, completed_at, board_id, is_recurring, alasan_terlambat, recurring_template_id, recurring_task_templates(pola), task_assignees(user_id)')
    .eq('id', taskId)
    .single()

  if (!task) return null

  type BarisAssignee = { user_id: string }

  return {
    id: task.id,
    judul: task.judul,
    deskripsi: task.deskripsi,
    prioritas: task.prioritas,
    dueDate: task.due_date,
    completedAt: task.completed_at,
    boardId: task.board_id,
    assigneeIds: ((task.task_assignees as unknown as BarisAssignee[]) ?? []).map((a) => a.user_id),
    isRecurring: task.is_recurring,
    templatePola: (task.recurring_task_templates as any)?.pola ?? null,
    alasanTerlambat: task.alasan_terlambat,
  }
}

export async function simpanAlasanTerlambat(
  divisionId: string,
  taskId: string,
  alasan: string
): Promise<HasilBuatTask> {
  const sesi = await pastikanAnggotaDivisi(divisionId)
  if (!alasan.trim()) return { sukses: false, pesan: 'Alasan tidak boleh kosong' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('tasks')
    .update({ alasan_terlambat: alasan.trim() })
    .eq('id', taskId)

  if (error) return { sukses: false, pesan: 'Gagal menyimpan alasan. Coba lagi.' }

  await catatAktivitas({
    actorId: sesi.id,
    actorNama: sesi.nama,
    jenis: 'task_diubah',
    objekTipe: 'Task',
    objekId: taskId,
    objekNama: 'alasan keterlambatan',
    divisionId,
  })

  return { sukses: true }
}

export async function ubahTask(
  divisionId: string,
  taskId: string,
  data: { deskripsi: string; prioritas: string; dueDate: string | null }
): Promise<HasilBuatTask> {
  await pastikanAnggotaDivisi(divisionId)

  const admin = createAdminClient()
  const { error } = await admin
    .from('tasks')
    .update({
      deskripsi: data.deskripsi.trim() || null,
      prioritas: data.prioritas,
      due_date: data.dueDate,
    })
    .eq('id', taskId)

  if (error) {
    return { sukses: false, pesan: 'Gagal menyimpan perubahan. Coba lagi.' }
  }

  return { sukses: true }
}

export async function ubahAssigneeTask(
  divisionId: string,
  taskId: string,
  userIds: string[]
): Promise<HasilBuatTask> {
  const sesi = await pastikanAnggotaDivisi(divisionId)

  const admin = createAdminClient()

  const [{ data: assigneeLama }, { data: task }] = await Promise.all([
    admin.from('task_assignees').select('user_id').eq('task_id', taskId),
    admin.from('tasks').select('judul').eq('id', taskId).single(),
  ])

  const idLama = new Set((assigneeLama ?? []).map((a) => a.user_id))
  const assigneeBaru = userIds.filter((id) => !idLama.has(id))

  await admin.from('task_assignees').delete().eq('task_id', taskId)

  if (userIds.length > 0) {
    const baris = userIds.map((userId) => ({ task_id: taskId, user_id: userId, assigned_by: sesi.id }))
    const { error } = await admin.from('task_assignees').insert(baris)
    if (error) {
      return { sukses: false, pesan: 'Gagal menyimpan penanggung jawab. Coba lagi.' }
    }
  }

  await Promise.all(
    assigneeBaru
      .filter((userId) => userId !== sesi.id)
      .map((userId) =>
        kirimNotifikasi({
          userId,
          jenis: 'task_ditugaskan',
          pesan: `${sesi.nama} menugaskan Anda ke task "${task?.judul ?? 'Task'}"`,
          taskId,
          divisionId,
        })
      )
  )

  return { sukses: true }
}

// ---------- Checklist ----------

export type ChecklistItem = { id: string; isi: string; selesai: boolean; urutan: number }

export async function ambilChecklistTask(divisionId: string, taskId: string): Promise<ChecklistItem[]> {
  await pastikanAnggotaDivisi(divisionId)

  const admin = createAdminClient()
  const { data } = await admin
    .from('checklist_items')
    .select('id, isi, selesai, urutan')
    .eq('task_id', taskId)
    .order('urutan')

  return data ?? []
}

export type HasilChecklist = { sukses: true; item?: ChecklistItem } | { sukses: false; pesan: string }

export async function tambahChecklistItem(
  divisionId: string,
  taskId: string,
  isi: string
): Promise<HasilChecklist> {
  await pastikanAnggotaDivisi(divisionId)

  const teks = isi.trim()
  if (!teks) {
    return { sukses: false, pesan: 'Isi checklist tidak boleh kosong' }
  }
  if (teks.length > 200) {
    return { sukses: false, pesan: 'Isi checklist maksimal 200 karakter' }
  }

  const admin = createAdminClient()
  const { count } = await admin
    .from('checklist_items')
    .select('id', { count: 'exact', head: true })
    .eq('task_id', taskId)

  const { data: item, error } = await admin
    .from('checklist_items')
    .insert({ task_id: taskId, isi: teks, urutan: count ?? 0 })
    .select('id, isi, selesai, urutan')
    .single()

  if (error) {
    return { sukses: false, pesan: 'Gagal menambahkan checklist. Coba lagi.' }
  }

  return { sukses: true, item }
}

export async function toggleChecklistItem(
  divisionId: string,
  itemId: string,
  selesai: boolean
): Promise<HasilChecklist> {
  await pastikanAnggotaDivisi(divisionId)

  const admin = createAdminClient()
  const { error } = await admin.from('checklist_items').update({ selesai }).eq('id', itemId)

  if (error) {
    return { sukses: false, pesan: 'Gagal memperbarui checklist. Coba lagi.' }
  }

  return { sukses: true }
}

export async function hapusChecklistItem(divisionId: string, itemId: string): Promise<HasilChecklist> {
  await pastikanAnggotaDivisi(divisionId)

  const admin = createAdminClient()
  const { error } = await admin.from('checklist_items').delete().eq('id', itemId)

  if (error) {
    return { sukses: false, pesan: 'Gagal menghapus checklist. Coba lagi.' }
  }

  return { sukses: true }
}

// ---------- Lampiran ----------

const BUCKET_LAMPIRAN = 'task-attachments'
const MAKS_UKURAN_LAMPIRAN = 10 * 1024 * 1024 // 10MB
const TIPE_LAMPIRAN_DIIZINKAN = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'text/plain',
  'text/csv',
  'video/mp4',
]

export type Lampiran = {
  id: string
  namaFile: string
  ukuranBytes: number
  tipeMime: string | null
  pengunggahId: string
  pengunggahNama: string
  createdAt: string
}

export async function ambilLampiranTask(divisionId: string, taskId: string): Promise<Lampiran[]> {
  await pastikanAnggotaDivisi(divisionId)

  const admin = createAdminClient()
  const { data } = await admin
    .from('task_attachments')
    .select('id, nama_file, ukuran_bytes, tipe_mime, uploaded_by, created_at, profiles!task_attachments_uploaded_by_fkey(nama)')
    .eq('task_id', taskId)
    .order('created_at')

  type Baris = {
    id: string
    nama_file: string
    ukuran_bytes: number
    tipe_mime: string | null
    uploaded_by: string
    created_at: string
    profiles: { nama: string } | null
  }

  return ((data as unknown as Baris[] | null) ?? []).map((row) => ({
    id: row.id,
    namaFile: row.nama_file,
    ukuranBytes: row.ukuran_bytes,
    tipeMime: row.tipe_mime,
    pengunggahId: row.uploaded_by,
    pengunggahNama: row.profiles?.nama ?? 'Tidak diketahui',
    createdAt: row.created_at,
  }))
}

export type HasilLampiran =
  | { sukses: true; lampiran?: Lampiran }
  | { sukses: false; pesan: string }

export async function unggahLampiran(
  divisionId: string,
  taskId: string,
  file: File
): Promise<HasilLampiran> {
  const sesi = await pastikanAnggotaDivisi(divisionId)

  if (!file || file.size === 0) {
    return { sukses: false, pesan: 'File tidak boleh kosong' }
  }
  if (file.size > MAKS_UKURAN_LAMPIRAN) {
    return { sukses: false, pesan: 'Ukuran file maksimal 10MB' }
  }
  if (!TIPE_LAMPIRAN_DIIZINKAN.includes(file.type)) {
    return { sukses: false, pesan: 'Tipe file tidak didukung' }
  }

  const admin = createAdminClient()
  const ekstensi = file.name.includes('.') ? file.name.split('.').pop() : ''
  const path = `${divisionId}/${taskId}/${crypto.randomUUID()}${ekstensi ? '.' + ekstensi : ''}`

  const { error: errorUpload } = await admin.storage.from(BUCKET_LAMPIRAN).upload(path, file, {
    contentType: file.type,
  })

  if (errorUpload) {
    return { sukses: false, pesan: 'Gagal mengunggah file. Coba lagi.' }
  }

  const { data: lampiran, error } = await admin
    .from('task_attachments')
    .insert({
      task_id: taskId,
      nama_file: file.name,
      path,
      ukuran_bytes: file.size,
      tipe_mime: file.type,
      uploaded_by: sesi.id,
    })
    .select('id, nama_file, ukuran_bytes, tipe_mime, uploaded_by, created_at')
    .single()

  if (error) {
    await admin.storage.from(BUCKET_LAMPIRAN).remove([path])
    return { sukses: false, pesan: 'Gagal menyimpan data lampiran. Coba lagi.' }
  }

  await catatAktivitas({
    actorId: sesi.id,
    actorNama: sesi.nama,
    jenis: 'lampiran_ditambah',
    objekTipe: 'Task',
    objekId: taskId,
    objekNama: file.name,
    divisionId,
  })

  return {
    sukses: true,
    lampiran: {
      id: lampiran.id,
      namaFile: lampiran.nama_file,
      ukuranBytes: lampiran.ukuran_bytes,
      tipeMime: lampiran.tipe_mime,
      pengunggahId: lampiran.uploaded_by,
      pengunggahNama: sesi.nama,
      createdAt: lampiran.created_at,
    },
  }
}

export async function ambilUrlLampiran(divisionId: string, lampiranId: string): Promise<HasilLampiran & { url?: string }> {
  await pastikanAnggotaDivisi(divisionId)

  const admin = createAdminClient()
  const { data: row } = await admin
    .from('task_attachments')
    .select('path')
    .eq('id', lampiranId)
    .single()

  if (!row) {
    return { sukses: false, pesan: 'Lampiran tidak ditemukan' }
  }

  const { data, error } = await admin.storage.from(BUCKET_LAMPIRAN).createSignedUrl(row.path, 60)

  if (error || !data) {
    return { sukses: false, pesan: 'Gagal membuat tautan unduh. Coba lagi.' }
  }

  return { sukses: true, url: data.signedUrl }
}

export async function hapusLampiran(divisionId: string, lampiranId: string): Promise<HasilLampiran> {
  const sesi = await pastikanAnggotaDivisi(divisionId)

  const admin = createAdminClient()
  const { data: row } = await admin
    .from('task_attachments')
    .select('path, nama_file, uploaded_by')
    .eq('id', lampiranId)
    .single()

  if (!row) {
    return { sukses: false, pesan: 'Lampiran tidak ditemukan' }
  }

  const bolehHapus =
    row.uploaded_by === sesi.id || sesi.roleSistem === 'super_admin' || sesi.roleSistem === 'owner'

  if (!bolehHapus) {
    return { sukses: false, pesan: 'Anda hanya dapat menghapus lampiran sendiri' }
  }

  await admin.storage.from(BUCKET_LAMPIRAN).remove([row.path])

  const { error } = await admin.from('task_attachments').delete().eq('id', lampiranId)

  if (error) {
    return { sukses: false, pesan: 'Gagal menghapus lampiran. Coba lagi.' }
  }

  await catatAktivitas({
    actorId: sesi.id,
    actorNama: sesi.nama,
    jenis: 'lampiran_dihapus',
    objekTipe: 'Task',
    objekId: null,
    objekNama: row.nama_file,
    divisionId,
  })

  return { sukses: true }
}

// ---------- Komentar ----------

export type Komentar = {
  id: string
  isi: string
  isEdited: boolean
  createdAt: string
  penulisId: string
  penulisNama: string
}

export async function ambilKomentar(divisionId: string, taskId: string): Promise<Komentar[]> {
  await pastikanAnggotaDivisi(divisionId)

  const admin = createAdminClient()
  const { data } = await admin
    .from('comments')
    .select('id, isi, is_edited, created_at, user_id, profiles!comments_user_id_fkey(nama)')
    .eq('task_id', taskId)
    .is('deleted_at', null)
    .order('created_at')

  type Baris = {
    id: string
    isi: string
    is_edited: boolean
    created_at: string
    user_id: string
    profiles: { nama: string } | null
  }

  return ((data as unknown as Baris[] | null) ?? []).map((row) => ({
    id: row.id,
    isi: row.isi,
    isEdited: row.is_edited,
    createdAt: row.created_at,
    penulisId: row.user_id,
    penulisNama: row.profiles?.nama ?? 'Tidak diketahui',
  }))
}

export type HasilKomentar = { sukses: true } | { sukses: false; pesan: string }

export async function tambahKomentar(
  divisionId: string,
  taskId: string,
  isi: string
): Promise<HasilKomentar> {
  const sesi = await pastikanAnggotaDivisi(divisionId)

  const teks = isi.trim()
  if (!teks) {
    return { sukses: false, pesan: 'Komentar tidak boleh kosong' }
  }
  if (teks.length > 2000) {
    return { sukses: false, pesan: 'Komentar maksimal 2000 karakter' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('comments')
    .insert({ task_id: taskId, user_id: sesi.id, isi: teks })

  if (error) {
    return { sukses: false, pesan: 'Gagal mengirim komentar. Coba lagi.' }
  }

  const { data: task } = await admin.from('tasks').select('judul').eq('id', taskId).single()
  await catatAktivitas({
    actorId: sesi.id,
    actorNama: sesi.nama,
    jenis: 'komentar_ditambah',
    objekTipe: 'Task',
    objekId: taskId,
    objekNama: task?.judul ?? taskId,
    divisionId,
  })

  await kirimNotifikasiMention(divisionId, taskId, teks, sesi.id, sesi.nama, task?.judul ?? '')

  return { sukses: true }
}

async function kirimNotifikasiMention(
  divisionId: string,
  taskId: string,
  isiKomentar: string,
  penulisId: string,
  penulisNama: string,
  judulTask: string
) {
  const anggota = await ambilAnggotaDivisi(divisionId)
  const namaKeAnggota = [...anggota].sort((a, b) => b.nama.length - a.nama.length)

  const sudahDikirim = new Set<string>()
  for (const a of namaKeAnggota) {
    if (a.id === penulisId || sudahDikirim.has(a.id)) continue
    const pola = new RegExp(`@${a.nama.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    if (pola.test(isiKomentar)) {
      sudahDikirim.add(a.id)
      await kirimNotifikasi({
        userId: a.id,
        jenis: 'mention',
        pesan: `${penulisNama} menyebut kamu di komentar task "${judulTask}"`,
        taskId,
        divisionId,
      })
    }
  }
}

export async function hapusKomentar(divisionId: string, commentId: string): Promise<HasilKomentar> {
  const sesi = await pastikanAnggotaDivisi(divisionId)

  const admin = createAdminClient()

  const { data: komentar } = await admin
    .from('comments')
    .select('user_id')
    .eq('id', commentId)
    .single()

  if (!komentar) {
    return { sukses: false, pesan: 'Komentar tidak ditemukan' }
  }

  const bolehHapus =
    komentar.user_id === sesi.id || sesi.roleSistem === 'super_admin' || sesi.roleSistem === 'owner'

  if (!bolehHapus) {
    return { sukses: false, pesan: 'Anda hanya dapat menghapus komentar sendiri' }
  }

  const { error } = await admin
    .from('comments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', commentId)

  if (error) {
    return { sukses: false, pesan: 'Gagal menghapus komentar. Coba lagi.' }
  }

  return { sukses: true }
}

export async function ubahJudulTask(
  divisionId: string,
  taskId: string,
  judulBaru: string
): Promise<HasilBuatTask> {
  const sesi = await pastikanAnggotaDivisi(divisionId)

  const judulBersih = judulBaru.trim()
  if (!judulBersih) return { sukses: false, pesan: 'Judul task tidak boleh kosong' }
  if (judulBersih.length > 255) return { sukses: false, pesan: 'Judul task maksimal 255 karakter' }

  const admin = createAdminClient()
  const { data: task } = await admin
    .from('tasks')
    .select('judul, created_by, task_assignees(user_id)')
    .eq('id', taskId)
    .single()

  if (!task) return { sukses: false, pesan: 'Task tidak ditemukan' }

  type BarisAssignee = { user_id: string }
  const bolehUbah =
    sesi.roleSistem === 'super_admin' ||
    sesi.roleSistem === 'owner' ||
    task.created_by === sesi.id ||
    (task.task_assignees as unknown as BarisAssignee[]).some(a => a.user_id === sesi.id)

  if (!bolehUbah)
    return { sukses: false, pesan: 'Anda tidak memiliki izin mengubah judul task ini' }

  const judulLama = task.judul
  const { error } = await admin.from('tasks').update({ judul: judulBersih }).eq('id', taskId)
  if (error) return { sukses: false, pesan: 'Gagal menyimpan judul. Coba lagi.' }

  await catatAktivitas({
    actorId: sesi.id,
    actorNama: sesi.nama,
    jenis: 'task_judul_diubah',
    objekTipe: 'Task',
    objekId: taskId,
    objekNama: judulBersih,
    divisionId,
    detail: { old: judulLama, new: judulBersih },
  })

  return { sukses: true }
}

// ---------- Riwayat (Activity Log) ----------

export async function ubahUrutanBoard(
  divisionId: string,
  urutan: { boardId: string; urutan: number }[]
): Promise<HasilBuatTask> {
  const sesi = await pastikanOwner(divisionId)

  if (urutan.length === 0) return { sukses: true }

  const admin = createAdminClient()
  const hasilUpdate = await Promise.all(
    urutan.map((item) =>
      admin.from('boards').update({ urutan: item.urutan }).eq('id', item.boardId).eq('division_id', divisionId)
    )
  )

  const gagal = hasilUpdate.find((r) => r.error)
  if (gagal) return { sukses: false, pesan: 'Gagal menyimpan urutan board. Coba lagi.' }

  await catatAktivitas({
    actorId: sesi.id,
    actorNama: sesi.nama,
    jenis: 'board_diurutkan',
    objekTipe: 'Board',
    objekId: null,
    objekNama: `${urutan.length} board`,
    divisionId,
  })

  return { sukses: true }
}

const LABEL_AKTIVITAS: Record<string, string> = {
  task_dibuat: 'membuat task',
  task_diubah: 'mengubah task',
  task_dipindah: 'memindahkan task',
  task_diurutkan: 'mengurutkan task',
  task_selesai: 'menyelesaikan task',
  task_dihapus: 'menghapus task',
  komentar_ditambah: 'berkomentar',
  komentar_dihapus: 'menghapus komentar',
  anggota_ditambah: 'menambahkan',
  anggota_dikeluarkan: 'mengeluarkan',
  label_dibuat: 'membuat label',
  label_dihapus: 'menghapus label',
  lampiran_ditambah: 'melampirkan file',
  lampiran_dihapus: 'menghapus lampiran',
}

export type RiwayatItem = {
  id: string
  actorNama: string
  jenis: string
  label: string
  objekNama: string
  createdAt: string
}

export async function ambilRiwayatTask(divisionId: string, taskId: string): Promise<RiwayatItem[]> {
  await pastikanAnggotaDivisi(divisionId)

  const admin = createAdminClient()
  const { data } = await admin
    .from('activity_log')
    .select('id, actor_nama, jenis_aktivitas, objek_nama, created_at')
    .eq('objek_tipe', 'Task')
    .eq('objek_id', taskId)
    .order('created_at', { ascending: false })

  return (data ?? []).map((row) => ({
    id: row.id,
    actorNama: row.actor_nama,
    jenis: row.jenis_aktivitas,
    label: LABEL_AKTIVITAS[row.jenis_aktivitas] ?? row.jenis_aktivitas,
    objekNama: row.objek_nama,
    createdAt: row.created_at,
  }))
}

// ---------- Pengumpulan (Link Submission) ----------

export type Pengumpulan = {
  id: string
  linkUrl: string
  keterangan: string | null
  pengirimId: string
  pengirimNama: string
  createdAt: string
}

export type HasilPengumpulan = { sukses: true } | { sukses: false; pesan: string }

export async function ambilPengumpulan(divisionId: string, taskId: string): Promise<Pengumpulan[]> {
  await pastikanAnggotaDivisi(divisionId)
  const admin = createAdminClient()
  const { data } = await admin
    .from('task_submissions')
    .select('id, link_url, keterangan, user_id, created_at, profiles!task_submissions_user_id_fkey(nama)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })

  type Baris = {
    id: string; link_url: string; keterangan: string | null
    user_id: string; created_at: string; profiles: { nama: string } | null
  }

  return ((data as unknown as Baris[] | null) ?? []).map((row) => ({
    id: row.id, linkUrl: row.link_url, keterangan: row.keterangan,
    pengirimId: row.user_id, pengirimNama: row.profiles?.nama ?? 'Tidak diketahui',
    createdAt: row.created_at,
  }))
}

export async function kirimPengumpulan(
  divisionId: string, taskId: string, linkUrl: string, keterangan: string
): Promise<HasilPengumpulan> {
  const sesi = await pastikanAnggotaDivisi(divisionId)
  const link = linkUrl.trim()
  if (!link) return { sukses: false, pesan: 'Link tidak boleh kosong' }
  if (!link.startsWith('http://') && !link.startsWith('https://'))
    return { sukses: false, pesan: 'Link harus dimulai dengan http:// atau https://' }

  const admin = createAdminClient()
  const { error } = await admin.from('task_submissions').insert({
    task_id: taskId, user_id: sesi.id, link_url: link,
    keterangan: keterangan.trim() || null,
  })

  if (error) return { sukses: false, pesan: 'Tabel belum tersedia. Jalankan migration 0013 terlebih dahulu.' }
  return { sukses: true }
}

export async function hapusPengumpulan(divisionId: string, submissionId: string): Promise<HasilPengumpulan> {
  const sesi = await pastikanAnggotaDivisi(divisionId)
  const admin = createAdminClient()
  const { data: sub } = await admin.from('task_submissions').select('user_id').eq('id', submissionId).single()
  if (!sub) return { sukses: false, pesan: 'Pengumpulan tidak ditemukan' }

  const boleh = sub.user_id === sesi.id || sesi.roleSistem === 'super_admin' || sesi.roleSistem === 'owner'
  if (!boleh) return { sukses: false, pesan: 'Anda tidak dapat menghapus pengumpulan ini' }

  const { error } = await admin.from('task_submissions').delete().eq('id', submissionId)
  if (error) return { sukses: false, pesan: 'Gagal menghapus. Coba lagi.' }
  return { sukses: true }
}
