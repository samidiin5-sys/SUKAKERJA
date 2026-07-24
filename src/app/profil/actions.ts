'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ambilSesiPengguna } from '@/lib/auth/otorisasi'
import { catatAktivitas } from '@/lib/aktivitas'

const MAKS_UKURAN_FOTO = 2 * 1024 * 1024 // 2MB
const TIPE_FOTO_DIIZINKAN = ['image/jpeg', 'image/png']
const BUCKET_AVATAR = 'avatars'

export type HasilProfil = { sukses: true } | { sukses: false; pesan: string }

export async function updateProfil(nama: string): Promise<HasilProfil> {
  const sesi = await ambilSesiPengguna()
  const namaBersih = nama.trim()
  if (!namaBersih) return { sukses: false, pesan: 'Nama tidak boleh kosong' }
  if (namaBersih.length > 100) return { sukses: false, pesan: 'Nama maksimal 100 karakter' }
  const admin = createAdminClient()
  const { error } = await admin.from('profiles').update({ nama: namaBersih }).eq('id', sesi.id)
  if (error) return { sukses: false, pesan: 'Gagal menyimpan nama. Coba lagi.' }
  await catatAktivitas({
    actorId: sesi.id,
    actorNama: sesi.nama,
    jenis: 'profile_updated',
    objekTipe: 'User',
    objekId: sesi.id,
    objekNama: namaBersih,
  })
  return { sukses: true }
}

export type HasilUploadFoto =
  | { sukses: true; fotoUrl: string }
  | { sukses: false; pesan: string }

export async function uploadFoto(formData: FormData): Promise<HasilUploadFoto> {
  const sesi = await ambilSesiPengguna()
  const file = formData.get('foto') as File | null
  if (!file || file.size === 0) return { sukses: false, pesan: 'File tidak boleh kosong' }
  if (file.size > MAKS_UKURAN_FOTO) return { sukses: false, pesan: 'Ukuran foto maksimal 2 MB' }
  if (!TIPE_FOTO_DIIZINKAN.includes(file.type))
    return { sukses: false, pesan: 'Format foto harus JPG atau PNG' }
  const admin = createAdminClient()
  const path = `${sesi.id}/${crypto.randomUUID()}.jpg`
  const { error: errUpload } = await admin.storage.from(BUCKET_AVATAR).upload(path, file, {
    contentType: file.type,
    upsert: true,
  })
  if (errUpload) return { sukses: false, pesan: 'Gagal mengunggah foto. Coba lagi.' }
  const { data: urlData } = admin.storage.from(BUCKET_AVATAR).getPublicUrl(path)
  const fotoUrl = urlData.publicUrl
  await admin.from('profiles').update({ foto_url: fotoUrl }).eq('id', sesi.id)
  await catatAktivitas({
    actorId: sesi.id,
    actorNama: sesi.nama,
    jenis: 'profile_updated',
    objekTipe: 'User',
    objekId: sesi.id,
    objekNama: sesi.nama,
  })
  return { sukses: true, fotoUrl }
}
