'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validasiKekuatanPassword } from '@/lib/validation/password'

export type HasilGantiPassword = { sukses: true } | { sukses: false; pesan: string[] }

export async function gantiPassword(
  passwordBaru: string,
  konfirmasiPassword: string
): Promise<HasilGantiPassword> {
  if (passwordBaru !== konfirmasiPassword) {
    return { sukses: false, pesan: ['Konfirmasi password tidak sesuai'] }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { sukses: false, pesan: ['Sesi Anda telah berakhir. Silakan masuk kembali.'] }
  }

  const { data: profil } = await supabase
    .from('profiles')
    .select('nama')
    .eq('id', user.id)
    .single()

  const validasi = validasiKekuatanPassword(passwordBaru, user.email ?? '', profil?.nama ?? '')

  if (!validasi.valid) {
    return { sukses: false, pesan: validasi.alasan }
  }

  const { error: errorPassword } = await supabase.auth.updateUser({ password: passwordBaru })

  if (errorPassword) {
    return { sukses: false, pesan: ['Gagal menyimpan password baru. Coba lagi.'] }
  }

  // Update lewat admin client: tidak ada kebijakan RLS yang mengizinkan
  // pengguna biasa (bukan super_admin) meng-update baris profiles miliknya
  // sendiri. Identitas pengguna sudah diverifikasi lewat getUser() di atas,
  // jadi elevasi ini aman — hanya dipakai untuk kolom must_change_password.
  const admin = createAdminClient()
  const { error: errorProfil } = await admin
    .from('profiles')
    .update({ must_change_password: false })
    .eq('id', user.id)

  if (errorProfil) {
    return {
      sukses: false,
      pesan: ['Password tersimpan, namun terjadi kendala pada sistem. Hubungi Super Admin.'],
    }
  }

  return { sukses: true }
}
