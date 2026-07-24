'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  akunSedangTerkunci,
  DURASI_KUNCI_MENIT,
  harusMenguncilAkun,
  hitungWaktuBukaKunci,
  sisaMenitTerkunci,
} from '@/lib/auth/lockout'

export type HasilLogin = { sukses: true } | { sukses: false; pesan: string }

export async function login(email: string, password: string): Promise<HasilLogin> {
  if (!email || !password) {
    return { sukses: false, pesan: 'Email dan password wajib diisi' }
  }

  const admin = createAdminClient()

  const { data: userId } = await admin.rpc('get_user_id_by_email', { cari_email: email })

  if (userId) {
    const { data: profil } = await admin
      .from('profiles')
      .select('locked_until, status')
      .eq('id', userId)
      .single()

    if (profil?.status === 'nonaktif') {
      return { sukses: false, pesan: 'Akun Anda tidak aktif. Hubungi Super Admin.' }
    }

    if (profil?.locked_until && akunSedangTerkunci(profil.locked_until, new Date())) {
      const sisaMenit = sisaMenitTerkunci(profil.locked_until, new Date())
      return {
        sukses: false,
        pesan: `Akun terkunci sementara karena terlalu banyak percobaan gagal. Coba lagi dalam ${sisaMenit} menit.`,
      }
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (userId) {
      const { data: profil } = await admin
        .from('profiles')
        .select('failed_login_count')
        .eq('id', userId)
        .single()

      const jumlahGagalBaru = (profil?.failed_login_count ?? 0) + 1
      const update: Record<string, unknown> = { failed_login_count: jumlahGagalBaru }
      const baruTerkunci = harusMenguncilAkun(jumlahGagalBaru)

      if (baruTerkunci) {
        update.locked_until = hitungWaktuBukaKunci(new Date()).toISOString()
      }

      await admin.from('profiles').update(update).eq('id', userId)

      if (baruTerkunci) {
        return {
          sukses: false,
          pesan: `Akun terkunci sementara karena terlalu banyak percobaan gagal. Coba lagi dalam ${DURASI_KUNCI_MENIT} menit.`,
        }
      }
    }

    return { sukses: false, pesan: 'Email atau password salah' }
  }

  if (userId) {
    await admin
      .from('profiles')
      .update({
        failed_login_count: 0,
        locked_until: null,
        last_login_at: new Date().toISOString(),
      })
      .eq('id', userId)
  }

  return { sukses: true }
}
