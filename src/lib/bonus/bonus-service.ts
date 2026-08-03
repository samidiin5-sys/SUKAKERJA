import { createAdminClient } from '../supabase/admin'

export type RiwayatBonus = {
  id: string
  taskId: string
  tanggal: string
  namaTask: string
  deskripsiTask: string | null
  nominal: number
  status: 'Menunggu Approval' | 'Bonus Masuk' | 'Ditolak' | 'Belum Selesai'
  approverName: string | null
  catatan: string | null
}

export async function hitungSaldoBonusStaff(userId: string): Promise<number> {
  const admin = createAdminClient()

  // Ambil semua task yang diassign ke user ini, yang punya bonus, dan sudah disetujui (completed_at is not null)
  const { data, error } = await admin
    .from('task_assignees')
    .select(`
      task_id,
      tasks!inner (
        has_bonus,
        bonus_amount,
        completed_at,
        deleted_at
      )
    `)
    .eq('user_id', userId)
    .eq('tasks.has_bonus', true)
    .not('tasks.completed_at', 'is', null)
    .is('tasks.deleted_at', null)

  if (error || !data) {
    console.error('Error hitungSaldoBonusStaff:', error)
    return 0
  }

  return data.reduce((total, item) => {
    const task = item.tasks as any
    return total + (task.bonus_amount || 0)
  }, 0)
}

export async function ambilRiwayatBonusStaff(userId: string): Promise<RiwayatBonus[]> {
  const admin = createAdminClient()

  // Ambil semua task dengan bonus yang di-assign ke staff ini
  const { data, error } = await admin
    .from('task_assignees')
    .select(`
      assigned_at,
      tasks!inner (
        id,
        judul,
        deskripsi,
        has_bonus,
        bonus_amount,
        completed_at,
        updated_at,
        boards (
          nama
        ),
        completed_by_profile:profiles!completed_by (
          nama
        )
      )
    `)
    .eq('user_id', userId)
    .eq('tasks.has_bonus', true)
    .is('tasks.deleted_at', null)
    .order('assigned_at', { ascending: false })

  if (error || !data) {
    console.error('Error ambilRiwayatBonusStaff:', error)
    return []
  }

  return data.map((item) => {
    const task = item.tasks as any
    const boardName = task.boards?.nama?.toLowerCase() || ''
    
    let status: RiwayatBonus['status'] = 'Belum Selesai'
    let tanggal = task.updated_at
    let approverName = null

    if (task.completed_at) {
      status = 'Bonus Masuk'
      tanggal = task.completed_at
      approverName = task.completed_by_profile?.nama || null
    } else if (boardName === 'review') {
      status = 'Menunggu Approval'
    } else {
      status = 'Belum Selesai'
    }

    return {
      id: `${task.id}-${userId}`,
      taskId: task.id,
      tanggal,
      namaTask: task.judul,
      deskripsiTask: task.deskripsi,
      nominal: task.bonus_amount || 0,
      status,
      approverName,
      catatan: null, // belum ada kolom catatan khusus bonus
    }
  })
}
