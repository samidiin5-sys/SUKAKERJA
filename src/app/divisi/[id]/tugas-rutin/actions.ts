'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { pastikanAnggotaDivisi, pastikanOwner } from '@/lib/auth/otorisasi'
import { catatAktivitas } from '@/lib/aktivitas'
import { jalankanBuatTugasRutin } from '@/lib/cron/buat-tugas-rutin'

export async function triggerBuatTugasRutin(divisionId: string): Promise<{ sukses: boolean; dibuat: number; pesan?: string }> {
  await pastikanOwner(divisionId)
  try {
    const hasil = await jalankanBuatTugasRutin()
    return { sukses: true, dibuat: hasil.dibuat }
  } catch (e) {
    return { sukses: false, dibuat: 0, pesan: String(e) }
  }
}

export type PolaUlang = 'daily_workday' | 'daily' | 'weekly' | 'monthly'

export type RecurringTemplate = {
  id: string
  divisionId: string
  boardId: string
  boardNama: string
  judul: string
  deskripsi: string | null
  prioritas: string
  assigneeIds: string[]
  pola: PolaUlang
  dayOfWeek: number | null
  dayOfMonth: number | null
  dueOffsetHari: number
  tanggalMulai: string
  tanggalSelesai: string | null
  isActive: boolean
  lastGeneratedDate: string | null
  createdAt: string
}

export type HasilTemplate = { sukses: true } | { sukses: false; pesan: string }

export async function ambilTemplates(divisionId: string): Promise<RecurringTemplate[]> {
  await pastikanAnggotaDivisi(divisionId)
  const admin = createAdminClient()
  const { data } = await admin
    .from('recurring_task_templates')
    .select('*, boards!inner(nama)')
    .eq('division_id', divisionId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  type Baris = {
    id: string; division_id: string; board_id: string
    judul: string; deskripsi: string | null; prioritas: string
    assignee_ids: string[]; pola: string
    day_of_week: number | null; day_of_month: number | null
    due_offset_hari: number; tanggal_mulai: string; tanggal_selesai: string | null
    is_active: boolean; last_generated_date: string | null; created_at: string
    boards: { nama: string }
  }

  return ((data as unknown as Baris[] | null) ?? []).map(r => ({
    id: r.id, divisionId: r.division_id, boardId: r.board_id,
    boardNama: r.boards.nama, judul: r.judul, deskripsi: r.deskripsi,
    prioritas: r.prioritas, assigneeIds: r.assignee_ids ?? [],
    pola: r.pola as PolaUlang, dayOfWeek: r.day_of_week, dayOfMonth: r.day_of_month,
    dueOffsetHari: r.due_offset_hari, tanggalMulai: r.tanggal_mulai,
    tanggalSelesai: r.tanggal_selesai, isActive: r.is_active,
    lastGeneratedDate: r.last_generated_date, createdAt: r.created_at,
  }))
}

type DataTemplate = {
  judul: string; deskripsi: string; prioritas: string
  assigneeIds: string[]; pola: PolaUlang; dayOfWeek: number | null
  dayOfMonth: number | null; dueOffsetHari: number
  tanggalMulai: string; tanggalSelesai: string
}

async function ambilBoardPertama(admin: ReturnType<typeof createAdminClient>, divisionId: string) {
  const { data } = await admin
    .from('boards')
    .select('id')
    .eq('division_id', divisionId)
    .is('deleted_at', null)
    .order('urutan')
    .limit(1)
    .single()
  return data
}

export async function buatTemplate(divisionId: string, data: DataTemplate): Promise<HasilTemplate> {
  const sesi = await pastikanOwner(divisionId)
  if (!data.judul.trim()) return { sukses: false, pesan: 'Judul tidak boleh kosong' }
  if (data.judul.length > 255) return { sukses: false, pesan: 'Judul maksimal 255 karakter' }
  if (data.pola === 'weekly' && data.dayOfWeek === null)
    return { sukses: false, pesan: 'Hari dalam minggu wajib diisi untuk pola mingguan' }
  if (data.pola === 'monthly' && data.dayOfMonth === null)
    return { sukses: false, pesan: 'Tanggal dalam bulan wajib diisi untuk pola bulanan' }

  const admin = createAdminClient()
  const boardPertama = await ambilBoardPertama(admin, divisionId)
  if (!boardPertama) return { sukses: false, pesan: 'Divisi ini belum memiliki board' }

  const { data: tmpl, error } = await admin.from('recurring_task_templates').insert({
    division_id: divisionId, board_id: boardPertama.id,
    judul: data.judul.trim(), deskripsi: data.deskripsi.trim() || null,
    prioritas: data.prioritas, assignee_ids: data.assigneeIds,
    pola: data.pola, day_of_week: data.dayOfWeek, day_of_month: data.dayOfMonth,
    due_offset_hari: data.dueOffsetHari,
    tanggal_mulai: data.tanggalMulai, tanggal_selesai: data.tanggalSelesai || null,
    created_by: sesi.id,
  }).select('id').single()
  if (error) return { sukses: false, pesan: 'Gagal membuat template. Coba lagi.' }
  await catatAktivitas({ actorId: sesi.id, actorNama: sesi.nama, jenis: 'template_dibuat',
    objekTipe: 'Template', objekId: tmpl.id, objekNama: data.judul, divisionId })
  return { sukses: true }
}

export async function ubahTemplate(divisionId: string, templateId: string, data: DataTemplate): Promise<HasilTemplate> {
  const sesi = await pastikanOwner(divisionId)
  if (!data.judul.trim()) return { sukses: false, pesan: 'Judul tidak boleh kosong' }
  if (data.pola === 'weekly' && data.dayOfWeek === null)
    return { sukses: false, pesan: 'Hari dalam minggu wajib diisi untuk pola mingguan' }
  if (data.pola === 'monthly' && data.dayOfMonth === null)
    return { sukses: false, pesan: 'Tanggal dalam bulan wajib diisi untuk pola bulanan' }

  const admin = createAdminClient()
  const boardPertama = await ambilBoardPertama(admin, divisionId)
  if (!boardPertama) return { sukses: false, pesan: 'Divisi ini belum memiliki board' }

  const { error } = await admin.from('recurring_task_templates').update({
    board_id: boardPertama.id, judul: data.judul.trim(),
    deskripsi: data.deskripsi.trim() || null, prioritas: data.prioritas,
    assignee_ids: data.assigneeIds, pola: data.pola,
    day_of_week: data.dayOfWeek, day_of_month: data.dayOfMonth,
    due_offset_hari: data.dueOffsetHari, tanggal_mulai: data.tanggalMulai,
    tanggal_selesai: data.tanggalSelesai || null,
  }).eq('id', templateId).eq('division_id', divisionId)
  if (error) return { sukses: false, pesan: 'Gagal menyimpan perubahan. Coba lagi.' }
  await catatAktivitas({ actorId: sesi.id, actorNama: sesi.nama, jenis: 'template_diubah',
    objekTipe: 'Template', objekId: templateId, objekNama: data.judul, divisionId })
  return { sukses: true }
}

export async function hapusTemplate(divisionId: string, templateId: string): Promise<HasilTemplate> {
  const sesi = await pastikanOwner(divisionId)
  const admin = createAdminClient()
  const { data: tmpl } = await admin.from('recurring_task_templates').select('judul').eq('id', templateId).single()
  const { error } = await admin.from('recurring_task_templates')
    .update({ deleted_at: new Date().toISOString() }).eq('id', templateId)
  if (error) return { sukses: false, pesan: 'Gagal menghapus template. Coba lagi.' }
  await catatAktivitas({ actorId: sesi.id, actorNama: sesi.nama, jenis: 'template_dihapus',
    objekTipe: 'Template', objekId: templateId, objekNama: tmpl?.judul ?? templateId, divisionId })
  return { sukses: true }
}

export async function toggleAktifTemplate(divisionId: string, templateId: string, isActive: boolean): Promise<HasilTemplate> {
  await pastikanOwner(divisionId)
  const admin = createAdminClient()
  const { error } = await admin.from('recurring_task_templates')
    .update({ is_active: isActive }).eq('id', templateId)
  if (error) return { sukses: false, pesan: 'Gagal mengubah status template. Coba lagi.' }
  return { sukses: true }
}

export type TaskDariTemplate = { id: string; judul: string; createdAt: string; completedAt: string | null }

export async function ambilRiwayatTemplate(divisionId: string, templateId: string): Promise<TaskDariTemplate[]> {
  await pastikanAnggotaDivisi(divisionId)
  const admin = createAdminClient()
  const { data } = await admin.from('tasks')
    .select('id, judul, created_at, completed_at')
    .eq('recurring_template_id', templateId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  return (data ?? []).map(r => ({ id: r.id, judul: r.judul, createdAt: r.created_at, completedAt: r.completed_at }))
}
