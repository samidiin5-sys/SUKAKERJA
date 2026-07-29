'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ambilSesiPengguna } from '@/lib/auth/otorisasi'
import { catatAktivitas } from '@/lib/aktivitas'

const MAKS_UKURAN_FOTO = 5 * 1024 * 1024 // 5MB
const TIPE_FOTO_DIIZINKAN = ['image/jpeg', 'image/png', 'image/webp']
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

// Step 1: server buat signed URL, browser upload langsung ke Supabase
export type HasilSignedUrl =
  | { sukses: true; signedUrl: string; path: string }
  | { sukses: false; pesan: string }

export async function buatSignedUrlUpload(
  tipe: string,
  ukuran: number
): Promise<HasilSignedUrl> {
  const sesi = await ambilSesiPengguna()
  if (ukuran > MAKS_UKURAN_FOTO) return { sukses: false, pesan: 'Ukuran foto maksimal 5 MB' }
  if (!TIPE_FOTO_DIIZINKAN.includes(tipe)) return { sukses: false, pesan: 'Format foto harus JPG, PNG, atau WebP' }

  const ext = tipe === 'image/png' ? 'png' : tipe === 'image/webp' ? 'webp' : 'jpg'
  const path = `${sesi.id}/${crypto.randomUUID()}.${ext}`
  const admin = createAdminClient()
  const { data, error } = await admin.storage.from(BUCKET_AVATAR).createSignedUploadUrl(path)
  if (error || !data) return { sukses: false, pesan: 'Gagal membuat URL upload. Coba lagi.' }
  return { sukses: true, signedUrl: data.signedUrl, path }
}

// Step 2: setelah browser selesai upload, simpan URL ke profil
export async function simpanFotoUrl(path: string): Promise<HasilUploadFoto> {
  const sesi = await ambilSesiPengguna()
  const admin = createAdminClient()
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
