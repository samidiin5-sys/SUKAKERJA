import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

export type JenisNotifikasi =
  | 'task_ditugaskan'
  | 'user_reactivated'
  | 'mention'
  | 'task_terlambat'
  | 'task_pool_baru'
  | 'lembur_disetujui'
  | 'lembur_ditolak'

/**
 * Mengirim satu notifikasi. Kegagalan pengiriman sengaja tidak melempar
 * error — aksi utama pengguna tidak boleh gagal hanya karena notifikasi
 * gagal terkirim. Lihat pola yang sama di catatAktivitas.
 */
export async function kirimNotifikasi(data: {
  userId: string
  jenis: JenisNotifikasi
  pesan: string
  taskId?: string | null
  divisionId?: string | null
}) {
  try {
    const admin = createAdminClient()
    await admin.from('notifications').insert({
      user_id: data.userId,
      jenis: data.jenis,
      pesan: data.pesan,
      task_id: data.taskId ?? null,
      division_id: data.divisionId ?? null,
    })
  } catch {
    // Diamkan dengan sengaja, lihat catatan di atas.
  }
}
