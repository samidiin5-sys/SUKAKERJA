import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateTugasDariTemplate, dapatkanTanggalWIB } from './generator-tugas'

export async function jalankanBuatTugasRutin() {
  const admin = createAdminClient()
  const hariIni = dapatkanTanggalWIB(0)
  const hasil = { dibuat: 0, dilewati: 0, error: 0 }

  // Ambil semua template aktif
  const { data: templates, error } = await admin
    .from('recurring_task_templates')
    .select('*')
    .eq('is_active', true)
    .is('deleted_at', null)

  if (error || !templates) {
    return { dibuat: 0, dilewati: 0, error: templates ? 0 : 1 }
  }

  for (const template of templates) {
    try {
      const templateRecord = {
        id: template.id,
        division_id: template.division_id,
        board_id: template.board_id,
        judul: template.judul,
        deskripsi: template.deskripsi,
        prioritas: template.prioritas,
        assignee_ids: template.assignee_ids ?? [],
        pola: template.pola,
        day_of_week: template.day_of_week,
        day_of_month: template.day_of_month,
        due_offset_hari: template.due_offset_hari,
        tanggal_mulai: template.tanggal_mulai,
        tanggal_selesai: template.tanggal_selesai,
        created_by: template.created_by,
      }
      const count = await generateTugasDariTemplate(templateRecord)
      
      // Update last_generated_date jika ada task yang terbuat
      if (count > 0) {
        await admin.from('recurring_task_templates')
          .update({ last_generated_date: hariIni })
          .eq('id', template.id)
      }
      
      hasil.dibuat += count
    } catch (e) {
      console.error('Error generating tasks for template:', template.id, e)
      hasil.error++
    }
  }

  return hasil
}

