import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

export type JenisAktivitas =
  | 'task_dibuat'
  | 'task_diubah'
  | 'task_dipindah'
  | 'task_diurutkan'
  | 'task_selesai'
  | 'task_dihapus'
  | 'komentar_ditambah'
  | 'komentar_dihapus'
  | 'anggota_ditambah'
  | 'anggota_dikeluarkan'
  | 'karyawan_dibuat'
  | 'karyawan_dinonaktifkan'
  | 'karyawan_diaktifkan'
  | 'karyawan_dihapus'
  | 'divisi_dibuat'
  | 'divisi_dinonaktifkan'
  | 'divisi_diaktifkan'
  | 'label_dibuat'
  | 'label_dihapus'
  | 'lampiran_ditambah'
  | 'lampiran_dihapus'
  | 'user_reactivated'
  | 'profile_updated'
  | 'division_deactivated'
  | 'division_reactivated'
  | 'task_restored'
  | 'task_permanently_deleted'
  | 'task_auto_created'
  | 'task_judul_diubah'
  | 'target_dibuat'
  | 'target_diubah'
  | 'target_dihapus'
  | 'template_dibuat'
  | 'template_diubah'
  | 'template_dihapus'
  | 'board_diurutkan'
  | 'tasks_archived'


/**
 * Mencatat satu baris activity log. Kegagalan pencatatan sengaja tidak
 * melempar error — aksi utama pengguna (misalnya membuat task) tidak boleh
 * gagal hanya karena pencatatan log gagal.
 */
export async function catatAktivitas(data: {
  actorId: string
  actorNama: string
  jenis: JenisAktivitas
  objekTipe: string
  objekId: string | null
  objekNama: string
  divisionId?: string | null
  detail?: Record<string, unknown>
}) {
  try {
    const admin = createAdminClient()
    await admin.from('activity_log').insert({
      actor_id: data.actorId,
      actor_nama: data.actorNama,
      jenis_aktivitas: data.jenis,
      objek_tipe: data.objekTipe,
      objek_id: data.objekId,
      objek_nama: data.objekNama,
      division_id: data.divisionId ?? null,
      detail: data.detail ?? null,
    })
  } catch {
    // Diamkan dengan sengaja, lihat catatan di atas.
  }
}
