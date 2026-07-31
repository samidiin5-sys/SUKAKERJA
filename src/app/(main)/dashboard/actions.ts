'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { ambilSesiPengguna } from '@/lib/auth/otorisasi'

export type TenggatTerdekatItem = {
  id: string
  judul: string
  dueDate: string
  divisiId: string
  divisiNama: string
  boardNama: string
}

export type StatistikPersonal = {
  taskAktif: number
  selesaiHariIni: number
  selesaiMingguIni: number
  terlambat: number
  jatuhTempoHariIni: number
  tenggatTerdekat: TenggatTerdekatItem[]
}

export async function ambilStatistikPersonal(): Promise<StatistikPersonal> {
  const sesi = await ambilSesiPengguna()
  const admin = createAdminClient()

  const { data } = await admin
    .from('task_assignees')
    .select(
      'task:tasks!inner(id, judul, due_date, completed_at, deleted_at, board:boards!inner(nama, division_id, division:divisions!inner(nama)))'
    )
    .eq('user_id', sesi.id)

  type Baris = {
    task: {
      id: string
      judul: string
      due_date: string | null
      completed_at: string | null
      deleted_at: string | null
      board: { nama: string; division_id: string; division: { nama: string } }
    }
  }

  const tasks = ((data as unknown as Baris[] | null) ?? [])
    .map((row) => row.task)
    .filter((t) => t.deleted_at === null)

  const sekarang = new Date()
  const awalHariIni = new Date(sekarang)
  awalHariIni.setHours(0, 0, 0, 0)
  const akhirHariIni = new Date(awalHariIni)
  akhirHariIni.setDate(akhirHariIni.getDate() + 1)
  const tujuhHariLalu = new Date(awalHariIni)
  tujuhHariLalu.setDate(tujuhHariLalu.getDate() - 6)

  const aktif = tasks.filter((t) => t.completed_at === null)
  const selesai = tasks.filter((t) => t.completed_at !== null)

  const jatuhTempoHariIni = aktif.filter((t) => {
    if (!t.due_date) return false
    const d = new Date(t.due_date).getTime()
    return d >= awalHariIni.getTime() && d < akhirHariIni.getTime()
  })

  const terlambat = aktif.filter((t) => t.due_date && new Date(t.due_date).getTime() < awalHariIni.getTime())

  const selesaiHariIni = selesai.filter((t) => {
    const d = new Date(t.completed_at as string).getTime()
    return d >= awalHariIni.getTime() && d < akhirHariIni.getTime()
  })

  const selesaiMingguIni = selesai.filter((t) => {
    const d = new Date(t.completed_at as string).getTime()
    return d >= tujuhHariLalu.getTime() && d < akhirHariIni.getTime()
  })

  const tenggatTerdekat = aktif
    .filter((t) => t.due_date !== null)
    .sort((a, b) => new Date(a.due_date as string).getTime() - new Date(b.due_date as string).getTime())
    .slice(0, 5)
    .map((t) => ({
      id: t.id,
      judul: t.judul,
      dueDate: t.due_date as string,
      divisiId: t.board.division_id,
      divisiNama: t.board.division.nama,
      boardNama: t.board.nama,
    }))

  return {
    taskAktif: aktif.length,
    selesaiHariIni: selesaiHariIni.length,
    selesaiMingguIni: selesaiMingguIni.length,
    terlambat: terlambat.length,
    jatuhTempoHariIni: jatuhTempoHariIni.length,
    tenggatTerdekat,
  }
}

export type PerbandinganDivisi = {
  id: string
  nama: string
  totalAktif: number
  selesai: number
  terlambat: number
  tingkatPenyelesaian: number
}

export type StatistikOrganisasi = {
  totalKaryawanAktif: number
  totalDivisiAktif: number
  totalTaskAktif: number
  totalTaskTerlambat: number
  perbandinganDivisi: PerbandinganDivisi[]
}

export async function ambilStatistikOrganisasi(): Promise<StatistikOrganisasi> {
  const sesi = await ambilSesiPengguna()
  if (sesi.roleSistem !== 'super_admin' && sesi.roleSistem !== 'owner') {
    throw new Error('Hanya Super Admin atau Owner yang dapat melihat statistik organisasi')
  }
  const admin = createAdminClient()

  const [{ count: totalKaryawanAktif }, { data: divisiAktif }] = await Promise.all([
    admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'aktif')
      .is('deleted_at', null),
    admin.from('divisions').select('id, nama').eq('status', 'aktif').is('deleted_at', null),
  ])

  const daftarDivisi = divisiAktif ?? []
  if (daftarDivisi.length === 0) {
    return {
      totalKaryawanAktif: totalKaryawanAktif ?? 0,
      totalDivisiAktif: 0,
      totalTaskAktif: 0,
      totalTaskTerlambat: 0,
      perbandinganDivisi: [],
    }
  }

  const { data: boards } = await admin
    .from('boards')
    .select('id, division_id')
    .in(
      'division_id',
      daftarDivisi.map((d) => d.id)
    )
    .is('deleted_at', null)

  const boardKeDivisi = new Map((boards ?? []).map((b) => [b.id, b.division_id]))
  const boardIds = (boards ?? []).map((b) => b.id)

  const { data: tasks } =
    boardIds.length > 0
      ? await admin
          .from('tasks')
          .select('id, board_id, due_date, completed_at')
          .in('board_id', boardIds)
          .is('deleted_at', null)
      : { data: [] as { id: string; board_id: string; due_date: string | null; completed_at: string | null }[] }

  const semuaTask = tasks ?? []
  const awalHariIni = new Date()
  awalHariIni.setHours(0, 0, 0, 0)

  const perbandinganDivisi: PerbandinganDivisi[] = daftarDivisi.map((d) => {
    const tugasDivisi = semuaTask.filter((t) => boardKeDivisi.get(t.board_id) === d.id)
    const aktif = tugasDivisi.filter((t) => t.completed_at === null)
    const selesai = tugasDivisi.filter((t) => t.completed_at !== null)
    const terlambat = aktif.filter((t) => t.due_date && new Date(t.due_date).getTime() < awalHariIni.getTime())
    const total = tugasDivisi.length

    return {
      id: d.id,
      nama: d.nama,
      totalAktif: aktif.length,
      selesai: selesai.length,
      terlambat: terlambat.length,
      tingkatPenyelesaian: total > 0 ? Math.round((selesai.length / total) * 100) : 0,
    }
  })

  const totalTaskAktif = semuaTask.filter((t) => t.completed_at === null).length
  const totalTaskTerlambat = semuaTask.filter(
    (t) => t.completed_at === null && t.due_date && new Date(t.due_date).getTime() < awalHariIni.getTime()
  ).length

  return {
    totalKaryawanAktif: totalKaryawanAktif ?? 0,
    totalDivisiAktif: daftarDivisi.length,
    totalTaskAktif,
    totalTaskTerlambat,
    perbandinganDivisi,
  }
}

export type TugasDikirimOwner = {
  id: string
  judul: string
  divisiId: string
  divisiNama: string
  staff: string[]
  deadline: string | null
  selesai: boolean
  terlambat: boolean
}

/** Daftar tugas yang dikirim Owner (lewat modal "Kirim Tugas") beserta status penyelesaiannya. */
export async function ambilTugasDikirimOwner(): Promise<TugasDikirimOwner[]> {
  const sesi = await ambilSesiPengguna()
  if (sesi.roleSistem !== 'owner') {
    throw new Error('Hanya Owner yang dapat melihat daftar ini')
  }

  const admin = createAdminClient()
  const { data } = await admin
    .from('tasks')
    .select(
      'id, judul, due_date, completed_at, board:boards!inner(division_id, divisions!inner(id, nama)), task_assignees(profiles!task_assignees_user_id_fkey(nama))'
    )
    .eq('created_by', sesi.id)
    .eq('hanya_assignee', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  type Baris = {
    id: string
    judul: string
    due_date: string | null
    completed_at: string | null
    board: { division_id: string; divisions: { id: string; nama: string } }
    task_assignees: { profiles: { nama: string } }[]
  }

  const sekarang = Date.now()

  return ((data as unknown as Baris[] | null) ?? []).map((t) => ({
    id: t.id,
    judul: t.judul,
    divisiId: t.board.divisions.id,
    divisiNama: t.board.divisions.nama,
    staff: t.task_assignees.map((a) => a.profiles.nama),
    deadline: t.due_date,
    selesai: t.completed_at !== null,
    terlambat: t.completed_at === null && !!t.due_date && new Date(t.due_date).getTime() < sekarang,
  }))
}

export type TaskDashboardItem = {
  id: string
  judul: string
  prioritas: string
  dueDate: string | null
  completedAt: string | null
  boardNama: string
  isCompletionBoard: boolean
  divisiId: string
  divisiNama: string
  divisiWarna: string
  ditugaskanOleh: string
  checklistTotal: number
  checklistSelesai: number
  isRecurring: boolean
}

export type DivisiSayaItem = {
  id: string
  nama: string
  deskripsi: string | null
  warna: string
  jumlahAnggota: number
  jumlahTugasAktif: number
  anggotaAvatars: { id: string; nama: string; fotoUrl: string | null }[]
}

export type AktivitasDashboardItem = {
  id: string
  actorId: string
  actorNama: string
  jenis: string
  objekTipe: string
  objekId: string | null
  objekNama: string
  divisionId: string | null
  createdAt: string
}

export type DetailDashboardStaff = {
  statistik: {
    taskAktif: number
    jatuhTempoHariIni: number
    selesaiMingguIni: number
    terlambat: number
  }
  tugasPrioritas: TaskDashboardItem[]
  deadlineTerdekat: TaskDashboardItem[]
  tugasSemua: TaskDashboardItem[]
  divisiList: DivisiSayaItem[]
  aktivitas: AktivitasDashboardItem[]
}

export async function ambilDetailDashboardStaff(): Promise<DetailDashboardStaff> {
  const sesi = await ambilSesiPengguna()
  const admin = createAdminClient()

  // 1. Ambil divisi di mana staff bergabung
  const { data: memberDivisions } = await admin
    .from('division_members')
    .select('division_id, role, division:divisions!inner(id, nama, deskripsi, warna, status, deleted_at)')
    .eq('user_id', sesi.id)

  const activeDivisions = ((memberDivisions as any) ?? [])
    .filter((row: any) => row.division.status === 'aktif' && row.division.deleted_at === null)
    .map((row: any) => row.division)

  const divIds = activeDivisions.map((d: any) => d.id)

  // 2. Ambil detail anggota divisi & jumlah task aktif
  let divisiList: DivisiSayaItem[] = []
  if (divIds.length > 0) {
    const [{ data: allMembers }, { data: allBoards }] = await Promise.all([
      admin
        .from('division_members')
        .select('division_id, profiles!inner(id, nama, foto_url)')
        .in('division_id', divIds),
      admin
        .from('boards')
        .select('id, division_id')
        .in('division_id', divIds)
        .is('deleted_at', null)
    ])

    const boardIds = allBoards?.map((b: any) => b.id) ?? []
    const { data: activeTasks } = boardIds.length > 0
      ? await admin
          .from('tasks')
          .select('id, board_id')
          .in('board_id', boardIds)
          .is('deleted_at', null)
          .is('completed_at', null)
      : { data: [] }

    divisiList = activeDivisions.map((div: any) => {
      const members = (allMembers ?? []).filter((m: any) => m.division_id === div.id)
      const boards = (allBoards ?? []).filter((b: any) => b.division_id === div.id)
      const boardIdsForDiv = boards.map((b: any) => b.id)
      const tasksInDiv = (activeTasks ?? []).filter((t: any) => boardIdsForDiv.includes(t.board_id))

      return {
        id: div.id,
        nama: div.nama,
        deskripsi: div.deskripsi,
        warna: div.warna,
        jumlahAnggota: members.length,
        jumlahTugasAktif: tasksInDiv.length,
        anggotaAvatars: members.slice(0, 5).map((m: any) => ({
          id: m.profiles.id,
          nama: m.profiles.nama,
          fotoUrl: m.profiles.foto_url
        }))
      }
    })
  }

  // 3. Ambil semua task yang di-assign ke staff ini (yang aktif atau selesai maksimal 30 hari terakhir)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: assigneesData } = await admin
    .from('task_assignees')
    .select(`
      assigned_by,
      pemberi:profiles!task_assignees_assigned_by_fkey(nama),
      task:tasks!inner(
        id,
        judul,
        prioritas,
        due_date,
        completed_at,
        deleted_at,
        is_recurring,
        board:boards!inner(
          id,
          nama,
          is_completion_board,
          division:divisions!inner(
            id,
            nama,
            warna
          )
        ),
        checklist_items(id, selesai)
      )
    `)
    .eq('user_id', sesi.id)

  const rows = ((assigneesData as any) ?? [])
    .filter((row: any) => row.task && row.task.deleted_at === null)
    .filter((row: any) => row.task.completed_at === null || new Date(row.task.completed_at) >= thirtyDaysAgo)

  const tasks: TaskDashboardItem[] = rows.map((row: any) => {
    const t = row.task
    return {
      id: t.id,
      judul: t.judul,
      prioritas: t.prioritas,
      dueDate: t.due_date,
      completedAt: t.completed_at,
      boardNama: t.board.nama,
      isCompletionBoard: t.board.is_completion_board,
      divisiId: t.board.division.id,
      divisiNama: t.board.division.nama,
      divisiWarna: t.board.division.warna,
      ditugaskanOleh: row.pemberi?.nama ?? 'Tidak diketahui',
      checklistTotal: t.checklist_items?.length ?? 0,
      checklistSelesai: t.checklist_items?.filter((c: any) => c.selesai).length ?? 0,
      isRecurring: t.is_recurring
    }
  })

  // 4. Hitung statistik
  const sekarang = new Date()
  const awalHariIni = new Date(sekarang)
  awalHariIni.setHours(0, 0, 0, 0)
  const akhirHariIni = new Date(awalHariIni)
  akhirHariIni.setDate(akhirHariIni.getDate() + 1)
  const tujuhHariLalu = new Date(awalHariIni)
  tujuhHariLalu.setDate(tujuhHariLalu.getDate() - 6)

  const aktif = tasks.filter((t) => t.completedAt === null && !t.isCompletionBoard)
  const selesai = tasks.filter((t) => t.completedAt !== null || t.isCompletionBoard)

  const jatuhTempoHariIni = aktif.filter((t) => {
    if (!t.dueDate) return false
    const d = new Date(t.dueDate).getTime()
    return d >= awalHariIni.getTime() && d < akhirHariIni.getTime()
  })

  const terlambat = aktif.filter((t) => t.dueDate && new Date(t.dueDate).getTime() < awalHariIni.getTime())

  const selesaiMingguIni = selesai.filter((t) => {
    const d = new Date(t.completedAt as string).getTime()
    return d >= tujuhHariLalu.getTime() && d < akhirHariIni.getTime()
  })

  // 5. Urutkan Tugas Prioritas (maksimal 5)
  const priorityWeight: Record<string, number> = {
    mendesak: 4,
    tinggi: 3,
    sedang: 2,
    rendah: 1
  }

  const tugasPrioritas = [...aktif]
    .sort((a, b) => {
      const aOverdue = a.dueDate && new Date(a.dueDate).getTime() < awalHariIni.getTime() ? 1 : 0
      const bOverdue = b.dueDate && new Date(b.dueDate).getTime() < awalHariIni.getTime() ? 1 : 0
      if (aOverdue !== bOverdue) return bOverdue - aOverdue

      const aDueToday = a.dueDate && new Date(a.dueDate).getTime() >= awalHariIni.getTime() && new Date(a.dueDate).getTime() < akhirHariIni.getTime() ? 1 : 0
      const bDueToday = b.dueDate && new Date(b.dueDate).getTime() >= awalHariIni.getTime() && new Date(b.dueDate).getTime() < akhirHariIni.getTime() ? 1 : 0
      if (aDueToday !== bDueToday) return bDueToday - aDueToday

      const aWeight = priorityWeight[a.prioritas] ?? 0
      const bWeight = priorityWeight[b.prioritas] ?? 0
      if (aWeight !== bWeight) return bWeight - aWeight

      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      if (a.dueDate) return -1
      if (b.dueDate) return 1
      return 0
    })
    .slice(0, 5)

  // 6. Ambil Deadline Terdekat (maksimal 5)
  const deadlineTerdekat = [...aktif]
    .filter(t => t.dueDate !== null)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5)

  // 7. Ambil Aktivitas Terbaru terkait Staff
  let aktivitas: AktivitasDashboardItem[] = []
  if (divIds.length > 0) {
    const { data: logs } = await admin
      .from('activity_log')
      .select('id, actor_id, actor_nama, jenis_aktivitas, objek_tipe, objek_id, objek_nama, division_id, created_at')
      .in('division_id', divIds)
      .order('created_at', { ascending: false })
      .limit(50)

    const allAssignedTaskIds = new Set(tasks.map(t => t.id))

    aktivitas = ((logs as any) ?? [])
      .filter((log: any) => {
        return log.actor_id === sesi.id || (log.objek_tipe === 'Task' && log.objek_id && allAssignedTaskIds.has(log.objek_id))
      })
      .slice(0, 5)
      .map((log: any) => ({
        id: log.id,
        actorId: log.actor_id,
        actorNama: log.actor_nama,
        jenis: log.jenis_aktivitas,
        objekTipe: log.objek_tipe,
        objekId: log.objek_id,
        objekNama: log.objek_nama,
        divisionId: log.division_id,
        createdAt: log.created_at
      }))
  }

  return {
    statistik: {
      taskAktif: jatuhTempoHariIni.length + terlambat.length,
      jatuhTempoHariIni: jatuhTempoHariIni.length,
      selesaiMingguIni: selesaiMingguIni.length,
      terlambat: terlambat.length,
    },
    tugasPrioritas,
    deadlineTerdekat,
    tugasSemua: tasks,
    divisiList,
    aktivitas
  }
}

export type AdminDashboardData = {
  statistik: {
    totalKaryawanAktif: number
    totalDivisiAktif: number
    totalTaskAktif: number
    totalTaskTerlambat: number
  }
  divisiList: {
    id: string
    nama: string
    deskripsi: string | null
    warna: string
    jumlahAnggota: number
    taskAktif: number
    taskSelesai: number
    taskTerlambat: number
    tingkatPenyelesaian: number
    anggotaAvatars: { id: string; nama: string; fotoUrl: string | null }[]
  }[]
  tugasPerhatian: {
    id: string
    judul: string
    prioritas: string
    dueDate: string | null
    completedAt: string | null
    boardNama: string
    divisiId: string
    divisiNama: string
    divisiWarna: string
    ditugaskanOleh: string | null
    assignees: { id: string; nama: string; fotoUrl: string | null }[]
    selisihTerlambat: number | null
  }[]
  distribusiStatus: {
    todo: number
    dikerjakan: number
    review: number
    selesai: number
    terlambat: number
    total: number
  }
  karyawanTerbaru: {
    id: string
    nama: string
    roleSistem: string
    status: string
    createdAt: string
    divisi: string[]
  }[]
  aktivitasTerbaru: {
    id: string
    actorId: string
    actorNama: string
    jenis: string
    objekTipe: string
    objekId: string | null
    objekNama: string
    createdAt: string
  }[]
  trendTask: {
    tanggal: string
    dibuat: number
    selesai: number
    terlambat: number
  }[]
}

export async function ambilDetailDashboardAdmin(): Promise<AdminDashboardData> {
  const sesi = await ambilSesiPengguna()
  if (sesi.roleSistem !== 'super_admin') {
    throw new Error('Hanya Super Admin yang dapat mengakses data ini')
  }

  const admin = createAdminClient()

  // 1. Ambil statistik organisasi
  const [{ count: totalKaryawanAktif }, { count: totalDivisiAktif }] = await Promise.all([
    admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'aktif')
      .is('deleted_at', null),
    admin
      .from('divisions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'aktif')
      .is('deleted_at', null),
  ])

  // 2. Ambil semua divisi aktif
  const { data: divisions } = await admin
    .from('divisions')
    .select('id, nama, deskripsi, warna')
    .eq('status', 'aktif')
    .is('deleted_at', null)
    .order('nama')

  const activeDivisions = divisions ?? []
  const divIds = activeDivisions.map((d) => d.id)

  // 3. Ambil boards di divisi aktif
  const { data: allBoards } = divIds.length > 0
    ? await admin
        .from('boards')
        .select('id, name:nama, division_id, is_completion_board')
        .in('division_id', divIds)
        .is('deleted_at', null)
    : { data: [] }

  const boardMap = new Map((allBoards ?? []).map((b: any) => [b.id, b]))
  const boardIds = (allBoards ?? []).map((b: any) => b.id)

  // 4. Ambil anggota divisi & avatar
  const { data: allMembers } = divIds.length > 0
    ? await admin
        .from('division_members')
        .select('division_id, profiles!inner(id, nama, foto_url)')
        .in('division_id', divIds)
    : { data: [] }

  // 5. Ambil semua task yang aktif (tidak terhapus)
  const { data: allTasks } = boardIds.length > 0
    ? await admin
        .from('tasks')
        .select('id, board_id, judul, prioritas, due_date, completed_at, created_at, task_assignees(user_id, profiles!task_assignees_user_id_fkey(id, nama, foto_url)), comments(id), task_attachments(id)')
        .in('board_id', boardIds)
        .is('deleted_at', null)
    : { data: [] }

  const tasksList = (allTasks as any) ?? []

  // 6. Pengelompokan status task & hitung stat untuk divisi
  const sekarang = new Date()
  const awalHariIni = new Date(sekarang)
  awalHariIni.setHours(0, 0, 0, 0)
  const akhirHariIni = new Date(awalHariIni)
  akhirHariIni.setDate(akhirHariIni.getDate() + 1)

  // Distribusi Status Task global
  let todoCount = 0
  let dikerjakanCount = 0
  let reviewCount = 0
  let selesaiCount = 0
  let terlambatCount = 0

  const divisiSummary = activeDivisions.map((div) => {
    const boardsInDiv = (allBoards ?? []).filter((b: any) => b.division_id === div.id)
    const boardIdsInDiv = boardsInDiv.map((b: any) => b.id)
    const tasksInDiv = tasksList.filter((t: any) => boardIdsInDiv.includes(t.board_id))

    const membersInDiv = (allMembers ?? []).filter((m: any) => m.division_id === div.id)

    let divAktif = 0
    let divSelesai = 0
    let divTerlambat = 0

    tasksInDiv.forEach((t: any) => {
      const board = boardMap.get(t.board_id)
      const isSelesai = t.completed_at !== null || board?.is_completion_board === true
      const isTerlambat = !isSelesai && t.due_date && new Date(t.due_date).getTime() < awalHariIni.getTime()

      if (isSelesai) {
        divSelesai++
      } else {
        divAktif++
        if (isTerlambat) {
          divTerlambat++
        }
      }
    })

    const totalTask = divAktif + divSelesai
    const tingkatPenyelesaian = totalTask > 0 ? Math.round((divSelesai / totalTask) * 100) : 0

    return {
      id: div.id,
      nama: div.nama,
      deskripsi: div.deskripsi,
      warna: div.warna,
      jumlahAnggota: membersInDiv.length,
      taskAktif: divAktif,
      taskSelesai: divSelesai,
      taskTerlambat: divTerlambat,
      tingkatPenyelesaian,
      anggotaAvatars: membersInDiv.slice(0, 5).map((m: any) => ({
        id: m.profiles.id,
        nama: m.profiles.nama,
        fotoUrl: m.profiles.foto_url
      }))
    }
  })

  // Urutkan divisi berdasarkan beban tugas terlambat terbanyak atau aktif terbanyak
  divisiSummary.sort((a, b) => {
    if (b.taskTerlambat !== a.taskTerlambat) return b.taskTerlambat - a.taskTerlambat
    return b.taskAktif - a.taskAktif
  })

  // Hitung status distribusi global
  tasksList.forEach((t: any) => {
    const board = boardMap.get(t.board_id)
    const isSelesai = t.completed_at !== null || board?.is_completion_board === true
    const isTerlambat = !isSelesai && t.due_date && new Date(t.due_date).getTime() < awalHariIni.getTime()

    if (isSelesai) {
      selesaiCount++
    } else {
      if (isTerlambat) {
        terlambatCount++
      }
      
      const namaBoard = (board?.name ?? '').toLowerCase()
      if (namaBoard.includes('to do') || namaBoard.includes('rencana') || namaBoard.includes('backlog')) {
        todoCount++
      } else if (namaBoard.includes('review') || namaBoard.includes('periksa') || namaBoard.includes('uji')) {
        reviewCount++
      } else {
        dikerjakanCount++
      }
    }
  })

  const totalTaskAktif = todoCount + dikerjakanCount + reviewCount
  const totalTaskTerlambat = terlambatCount

  // 7. Cari Task Prioritas / Perlu Perhatian (Maksimal 5)
  const priorityWeight: Record<string, number> = {
    mendesak: 4,
    tinggi: 3,
    sedang: 2,
    rendah: 1
  }

  const tasksAktifSaja = tasksList.filter((t: any) => {
    const board = boardMap.get(t.board_id)
    return t.completed_at === null && board?.is_completion_board !== true
  })

  const tugasPerhatian = tasksAktifSaja
    .map((t: any) => {
      const board = boardMap.get(t.board_id)
      const divisionId = board?.division_id ?? null
      const division = activeDivisions.find(d => d.id === divisionId)
      
      const isTerlambat = t.due_date && new Date(t.due_date).getTime() < awalHariIni.getTime()
      let selisihTerlambat: number | null = null
      if (isTerlambat && t.due_date) {
        const diff = awalHariIni.getTime() - new Date(t.due_date).getTime()
        selisihTerlambat = Math.floor(diff / (1000 * 60 * 60 * 24))
      }

      return {
        id: t.id,
        judul: t.judul,
        prioritas: t.prioritas,
        dueDate: t.due_date,
        completedAt: t.completed_at,
        boardNama: board?.name ?? 'Kanban',
        divisiId: division?.id ?? '',
        divisiNama: division?.nama ?? 'Umum',
        divisiWarna: division?.warna ?? '#7a2b1c',
        ditugaskanOleh: null,
        assignees: (t.task_assignees ?? []).map((ta: any) => ({
          id: ta.profiles.id,
          nama: ta.profiles.nama,
          fotoUrl: ta.profiles.foto_url
        })),
        selisihTerlambat
      }
    })
    .sort((a: any, b: any) => {
      const aOverdue = a.selisihTerlambat !== null ? 1 : 0
      const bOverdue = b.selisihTerlambat !== null ? 1 : 0
      if (aOverdue !== bOverdue) return bOverdue - aOverdue

      const aWeight = priorityWeight[a.prioritas] ?? 0
      const bWeight = priorityWeight[b.prioritas] ?? 0
      if (aWeight !== bWeight) return bWeight - aWeight

      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      if (a.dueDate) return -1
      if (b.dueDate) return 1
      return 0
    })
    .slice(0, 5)

  // 8. Karyawan Terbaru
  const { data: latestUsers } = await admin
    .from('profiles')
    .select('id, nama, role_sistem, status, created_at, division_members(divisions(nama))')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(5)

  const karyawanTerbaru = (latestUsers ?? []).map((u: any) => {
    const divs = (u.division_members ?? []).map((dm: any) => dm.divisions?.nama).filter(Boolean)
    return {
      id: u.id,
      nama: u.nama,
      roleSistem: u.role_sistem,
      status: u.status,
      createdAt: u.created_at,
      divisi: divs
    }
  })

  // 9. Aktivitas Terbaru
  const { data: logs } = await admin
    .from('activity_log')
    .select('id, actor_id, actor_nama, jenis_aktivitas, objek_tipe, objek_id, objek_nama, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  const aktivitasTerbaru = (logs ?? []).map((log: any) => ({
    id: log.id,
    actorId: log.actor_id,
    actorNama: log.actor_nama,
    jenis: log.jenis_aktivitas,
    objekTipe: log.objek_tipe,
    objekId: log.objek_id,
    objekNama: log.objek_nama,
    createdAt: log.created_at
  }))

  // 10. Perhitungan Trend Task (7 hari terakhir)
  const trendTask = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - idx))
    const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    const dayStart = new Date(d)
    dayStart.setHours(0,0,0,0)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const dibuat = tasksList.filter((t: any) => {
      const c = new Date(t.created_at)
      return c >= dayStart && c < dayEnd
    }).length

    const selesai = tasksList.filter((t: any) => {
      if (!t.completed_at) return false
      const c = new Date(t.completed_at)
      return c >= dayStart && c < dayEnd
    }).length

    const terlambat = tasksList.filter((t: any) => {
      if (t.completed_at) return false
      if (!t.due_date) return false
      const due = new Date(t.due_date)
      return due >= dayStart && due < dayEnd
    }).length

    return {
      tanggal: dateStr,
      dibuat,
      selesai,
      terlambat
    }
  })

  return {
    statistik: {
      totalKaryawanAktif: totalKaryawanAktif ?? 0,
      totalDivisiAktif: totalDivisiAktif ?? 0,
      totalTaskAktif,
      totalTaskTerlambat
    },
    divisiList: divisiSummary,
    tugasPerhatian,
    distribusiStatus: {
      todo: todoCount,
      dikerjakan: dikerjakanCount,
      review: reviewCount,
      selesai: selesaiCount,
      terlambat: totalTaskTerlambat,
      total: tasksList.length
    },
    karyawanTerbaru,
    aktivitasTerbaru,
    trendTask
  }
}


export type HasilEksporCSV = { sukses: true; csv: string } | { sukses: false; pesan: string }

export async function eksporRekapCSV(dari: string, sampai: string): Promise<HasilEksporCSV> {
  const sesi = await ambilSesiPengguna()
  if (sesi.roleSistem !== 'super_admin' && sesi.roleSistem !== 'owner') {
    return { sukses: false, pesan: 'Tidak memiliki akses' }
  }

  const admin = createAdminClient()

  // Ambil semua divisi aktif
  const { data: divisions } = await admin
    .from('divisions')
    .select('id, nama')
    .eq('status', 'aktif')
    .is('deleted_at', null)
    .order('nama')

  if (!divisions || divisions.length === 0) {
    return { sukses: false, pesan: 'Tidak ada divisi aktif' }
  }

  const divIds = divisions.map((d) => d.id)

  // Ambil boards
  const { data: boards } = await admin
    .from('boards')
    .select('id, division_id')
    .in('division_id', divIds)
    .is('deleted_at', null)

  const boardIds = (boards ?? []).map((b) => b.id)
  const boardToDivisi = new Map((boards ?? []).map((b) => [b.id, b.division_id]))
  const divisiNamaMap = new Map(divisions.map((d) => [d.id, d.nama]))

  // Ambil semua task dalam rentang waktu
  const { data: tasks } = boardIds.length > 0
    ? await admin
        .from('tasks')
        .select('id, board_id, judul, prioritas, due_date, completed_at, created_at, task_assignees(profiles!task_assignees_user_id_fkey(nama))')
        .in('board_id', boardIds)
        .is('deleted_at', null)
        .gte('created_at', `${dari}T00:00:00Z`)
        .lte('created_at', `${sampai}T23:59:59Z`)
    : { data: [] }

  type BarisTask = {
    id: string
    board_id: string
    judul: string
    prioritas: string
    due_date: string | null
    completed_at: string | null
    created_at: string
    task_assignees: { profiles: { nama: string } }[]
  }

  const rows = (tasks as unknown as BarisTask[] | null) ?? []
  const awalHariIni = new Date()
  awalHariIni.setHours(0, 0, 0, 0)

  function esc(v: string) { return `"${(v ?? '').replace(/"/g, '""')}"` }

  const BOM = '\uFEFF'
  const header = 'Divisi,Judul,Prioritas,Assignee,Tgl Dibuat,Deadline,Status\r\n'

  const baris = rows.map((t) => {
    const divisiId = boardToDivisi.get(t.board_id) ?? ''
    const divisiNama = divisiNamaMap.get(divisiId) ?? '-'
    const assignees = t.task_assignees.map((a) => a.profiles.nama).join('; ') || '-'
    const tglDibuat = new Date(t.created_at).toLocaleDateString('id-ID')
    const deadline = t.due_date ? new Date(t.due_date).toLocaleDateString('id-ID') : '-'
    const status = t.completed_at
      ? 'Selesai'
      : t.due_date && new Date(t.due_date).getTime() < awalHariIni.getTime()
      ? 'Terlambat'
      : 'Berjalan'

    return [
      esc(divisiNama),
      esc(t.judul),
      esc(t.prioritas),
      esc(assignees),
      esc(tglDibuat),
      esc(deadline),
      esc(status),
    ].join(',')
  }).join('\r\n')

  return { sukses: true, csv: BOM + header + baris }
}
