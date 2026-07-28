import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { catatAktivitas } from '@/lib/aktivitas'

function hariIniJadwalTemplate(
  template: { pola: string; day_of_week: number | null; day_of_month: number | null },
  hariMinggu: number,
  tanggalHariIni: string
): boolean {
  switch (template.pola) {
    case 'daily_workday': return hariMinggu >= 1 && hariMinggu <= 6
    case 'daily': return true
    case 'weekly': return hariMinggu === template.day_of_week
    case 'monthly': return parseInt(tanggalHariIni.slice(8, 10)) === template.day_of_month
    default: return false
  }
}

export async function jalankanBuatTugasRutin() {
  const admin = createAdminClient()
  const hariIniWIB = new Date(Date.now() + 7 * 60 * 60 * 1000)
  const tanggalHariIni = hariIniWIB.toISOString().slice(0, 10)
  const hariMinggu = hariIniWIB.getDay()
  const hasil = { dibuat: 0, dilewati: 0, error: 0 }

  const { data: templates } = await admin
    .from('recurring_task_templates')
    .select('*')
    .eq('is_active', true)
    .is('deleted_at', null)
    .lte('tanggal_mulai', tanggalHariIni)
    .or(`tanggal_selesai.is.null,tanggal_selesai.gte.${tanggalHariIni}`)

  for (const template of templates ?? []) {
    if (!hariIniJadwalTemplate(template, hariMinggu, tanggalHariIni)) {
      hasil.dilewati++
      continue
    }

    const { count } = await admin.from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('recurring_template_id', template.id)
      .gte('created_at', `${tanggalHariIni}T00:00:00+07:00`)
      .lt('created_at', `${tanggalHariIni}T23:59:59+07:00`)

    if ((count ?? 0) > 0) { hasil.dilewati++; continue }

    try {
      const dueDate = new Date(tanggalHariIni)
      dueDate.setDate(dueDate.getDate() + template.due_offset_hari)

      const { data: taskBaru, error } = await admin.from('tasks')
        .insert({
          board_id: template.board_id,
          judul: template.judul,
          deskripsi: template.deskripsi,
          prioritas: template.prioritas,
          due_date: dueDate.toISOString().slice(0, 10),
          created_by: template.created_by,
          recurring_template_id: template.id,
          is_recurring: true,
        })
        .select('id').single()

      if (error || !taskBaru) { hasil.error++; continue }

      if (template.assignee_ids && template.assignee_ids.length > 0) {
        await admin.from('task_assignees').insert(
          template.assignee_ids.map((uid: string) => ({
            task_id: taskBaru.id, user_id: uid, assigned_by: template.created_by
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

      await admin.from('recurring_task_templates')
        .update({ last_generated_date: tanggalHariIni }).eq('id', template.id)

      hasil.dibuat++
    } catch {
      hasil.error++
    }
  }

  return hasil
}
