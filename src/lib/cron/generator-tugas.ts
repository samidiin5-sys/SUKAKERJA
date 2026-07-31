import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { catatAktivitas } from '@/lib/aktivitas'

/** Dapatkan tanggal hari ini dalam WIB (YYYY-MM-DD) */
export function dapatkanTanggalWIB(offsetHari = 0): string {
  const d = new Date(Date.now() + 7 * 60 * 60 * 1000)
  if (offsetHari !== 0) {
    d.setDate(d.getDate() + offsetHari)
  }
  return d.toISOString().slice(0, 10)
}

/** Tambah hari pada dateStr (YYYY-MM-DD) */
export function tambahHari(dateStr: string, hari: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + hari)
  return d.toISOString().slice(0, 10)
}

/** Cek apakah tanggal (YYYY-MM-DD) cocok dengan pola pengulangan template */
export function cocokPola(
  pola: string,
  dayOfWeek: number | null,
  dayOfMonth: number | null,
  dateStr: string
): boolean {
  const d = new Date(dateStr)
  const day = d.getDay() // 0 = Minggu, 1 = Senin, ...
  switch (pola) {
    case 'daily_workday':
      return day >= 1 && day <= 6 // Senin s/d Sabtu
    case 'daily':
      return true
    case 'weekly':
      return day === dayOfWeek
    case 'monthly':
      return parseInt(dateStr.slice(8, 10)) === dayOfMonth
    default:
      return false
  }
}

export type TemplateRecord = {
  id: string
  division_id: string
  board_id: string
  judul: string
  deskripsi: string | null
  prioritas: string
  assignee_ids: string[]
  pola: string
  day_of_week: number | null
  day_of_month: number | null
  due_offset_hari: number
  tanggal_mulai: string
  tanggal_selesai: string | null
  created_by: string
}

/**
 * Generate semua tugas dari template untuk jangka waktu terhitung dari hariIni s/d 60 hari ke depan
 */
export async function generateTugasDariTemplate(
  template: TemplateRecord,
  customHariIni?: string
) {
  const admin = createAdminClient()
  const hariIni = customHariIni || dapatkanTanggalWIB(0)
  
  // Batas pemotongan: generate dari max(tanggal_mulai, hariIni - 7 hari)
  // s/d min(tanggal_selesai, hariIni + 60 hari)
  const limitMulai = dapatkanTanggalWIB(-7)
  const limitSelesai = dapatkanTanggalWIB(60)

  const startStr = template.tanggal_mulai > limitMulai ? template.tanggal_mulai : limitMulai
  const endStr = template.tanggal_selesai && template.tanggal_selesai < limitSelesai 
    ? template.tanggal_selesai 
    : limitSelesai

  // Dapatkan daftar tanggal di rentang tersebut
  const tanggalRentang: string[] = []
  let berjalan = new Date(startStr)
  const selesai = new Date(endStr)
  while (berjalan <= selesai) {
    tanggalRentang.push(berjalan.toISOString().slice(0, 10))
    berjalan.setDate(berjalan.getDate() + 1)
  }

  // Ambil list tugas yang sudah ada untuk template ini
  const { data: existingTasks } = await admin
    .from('tasks')
    .select('id, due_date')
    .eq('recurring_template_id', template.id)
    .is('deleted_at', null)

  // Mapping due_date yang sudah ada ke format YYYY-MM-DD WIB
  const existingDueDates = new Set(
    (existingTasks ?? []).map((t) => {
      return new Date(new Date(t.due_date).getTime() + 7 * 3600_000).toISOString().slice(0, 10)
    })
  )

  let dibuat = 0

  for (const tgl of tanggalRentang) {
    if (!cocokPola(template.pola, template.day_of_week, template.day_of_month, tgl)) {
      continue
    }

    // Hitung tanggal jatuh tempo (due_date)
    const dueTanggal = tambahHari(tgl, template.due_offset_hari)
    
    // Cek apakah due_date untuk jatuh tempo ini sudah pernah dibuat
    if (existingDueDates.has(dueTanggal)) {
      continue
    }

    // Set deadline jam 17:00 WIB
    const dueDateWIB = `${dueTanggal}T17:00:00+07:00`

    try {
      const { data: taskBaru, error } = await admin.from('tasks')
        .insert({
          board_id: template.board_id,
          judul: template.judul,
          deskripsi: template.deskripsi,
          prioritas: template.prioritas,
          due_date: dueDateWIB,
          created_by: template.created_by,
          recurring_template_id: template.id,
          is_recurring: true,
        })
        .select('id').single()

      if (error || !taskBaru) continue

      if (template.assignee_ids && template.assignee_ids.length > 0) {
        await admin.from('task_assignees').insert(
          template.assignee_ids.map((uid: string) => ({
            task_id: taskBaru.id,
            user_id: uid,
            assigned_by: template.created_by
          }))
        )
      }

      await catatAktivitas({
        actorId: template.created_by,
        actorNama: 'Sistem',
        jenis: 'task_auto_created',
        objekTipe: 'Task',
        objekId: taskBaru.id,
        objekNama: template.judul,
        divisionId: template.division_id,
      })

      dibuat++
    } catch (e) {
      console.error('Gagal generate task untuk tanggal:', tgl, e)
    }
  }

  return dibuat
}

/**
 * Hapus tugas masa depan yang belum selesai jika template dinonaktifkan / di-update
 */
export async function bersihkanTugasMasaDepan(
  templateId: string,
  dueOffsetHari: number
) {
  const admin = createAdminClient()
  const hariIni = dapatkanTanggalWIB(0)
  
  // Tugas masa depan didefinisikan sebagai tugas yang jatuh tempo setelah (hariIni + dueOffsetHari)
  // Contoh: hariIni 31 Jul, offset 0 -> hapus yang jatuh tempo >= 1 Aug (besok dst)
  const batasDueWIB = `${tambahHari(hariIni, dueOffsetHari)}T23:59:59+07:00`

  const { error } = await admin
    .from('tasks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('recurring_template_id', templateId)
    .is('completed_at', null)
    .gt('due_date', batasDueWIB)
    .is('deleted_at', null)

  if (error) {
    console.error('Gagal membersihkan tugas masa depan untuk template:', templateId, error)
    return false
  }

  return true
}
