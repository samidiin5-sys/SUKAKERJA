'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { updateProfil, uploadFoto } from './actions'

const MAKS_UKURAN_FOTO = 5 * 1024 * 1024 // 5MB
const TIPE_FOTO_DIIZINKAN = ['image/jpeg', 'image/png', 'image/webp']

export default function FormProfil({
  profilAwal,
}: {
  profilAwal: { nama: string; fotoUrl: string | null }
}) {
  const router = useRouter()

  const [nama, setNama] = useState(profilAwal.nama)
  const [preview, setPreview] = useState<string | null>(profilAwal.fotoUrl)
  const [sedangMenyimpanNama, setSedangMenyimpanNama] = useState(false)
  const [sedangMenyimpanFoto, setSedangMenyimpanFoto] = useState(false)
  const [pesanNama, setPesanNama] = useState<{ sukses: boolean; teks: string } | null>(null)
  const [pesanFoto, setPesanFoto] = useState<{ sukses: boolean; teks: string } | null>(null)

  const inputFotoRef = useRef<HTMLInputElement>(null)

  async function tanganiSimpanNama(e: React.FormEvent) {
    e.preventDefault()
    setPesanNama(null)
    setSedangMenyimpanNama(true)
    const hasil = await updateProfil(nama)
    setSedangMenyimpanNama(false)
    if (!hasil.sukses) {
      setPesanNama({ sukses: false, teks: hasil.pesan })
      return
    }
    setPesanNama({ sukses: true, teks: 'Nama berhasil disimpan.' })
    router.refresh()
  }

  async function tanganiPilihFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPesanFoto(null)
    if (!TIPE_FOTO_DIIZINKAN.includes(file.type)) {
      setPesanFoto({ sukses: false, teks: 'Format foto harus JPG, PNG, atau WebP' })
      e.target.value = ''
      return
    }
    if (file.size > MAKS_UKURAN_FOTO) {
      setPesanFoto({ sukses: false, teks: 'Ukuran foto maksimal 5 MB' })
      e.target.value = ''
      return
    }
    setSedangMenyimpanFoto(true)
    const formData = new FormData()
    formData.append('foto', file)
    const hasil = await uploadFoto(formData)
    setSedangMenyimpanFoto(false)
    if (!hasil.sukses) {
      setPesanFoto({ sukses: false, teks: hasil.pesan })
      e.target.value = ''
      return
    }
    setPreview(URL.createObjectURL(file))
    setPesanFoto({ sukses: true, teks: 'Foto berhasil diperbarui.' })
    router.refresh()
  }

  function inisial(n: string) {
    return n.split(' ').map((k) => k[0]).slice(0, 2).join('').toUpperCase()
  }

  return (
    <div className="space-y-5">
      {/* Kartu foto profil */}
      <div className="rounded-2xl border border-cream-200 bg-white p-8 shadow-sm">
        <h2 className="mb-6 text-sm font-bold text-ink">Foto Profil</h2>

        <div className="flex flex-col items-center gap-5">
          {/* Avatar besar di tengah */}
          <div className="relative h-36 w-36 flex-shrink-0 overflow-hidden rounded-full bg-maroon-800 shadow-md">
            {preview ? (
              <Image
                src={preview}
                alt="Foto profil"
                fill
                className="object-cover"
                unoptimized={preview.startsWith('blob:')}
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-4xl font-black text-cream-50">
                {inisial(nama || 'U')}
              </span>
            )}
          </div>

          {/* Tombol & keterangan */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => inputFotoRef.current?.click()}
              disabled={sedangMenyimpanFoto}
              className="rounded-xl border border-cream-200 px-6 py-2.5 text-sm font-bold text-maroon-700 transition hover:border-orange-500 hover:text-orange-600 disabled:opacity-50"
            >
              {sedangMenyimpanFoto ? 'Mengunggah...' : 'Ganti Foto'}
            </button>
            <p className="mt-2 text-xs text-muted">JPG, PNG, atau WebP · maks. 5 MB</p>
          </div>
        </div>

        {pesanFoto && (
          <p className={`mt-5 rounded-xl px-4 py-2.5 text-sm font-semibold ${pesanFoto.sukses ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {pesanFoto.teks}
          </p>
        )}
      </div>

      {/* Kartu nama */}
      <div className="rounded-2xl border border-cream-200 bg-white p-8 shadow-sm">
        <h2 className="mb-1 text-sm font-bold text-ink">Nama Tampilan</h2>
        <p className="mb-5 text-xs text-muted">Nama ini yang akan tampil ke seluruh anggota tim.</p>

        <form onSubmit={tanganiSimpanNama} className="space-y-4">
          <div>
            <label htmlFor="nama" className="mb-1.5 block text-sm font-semibold text-ink">
              Nama
            </label>
            <input
              id="nama"
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              maxLength={100}
              className="w-full rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-sm text-ink outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          {pesanNama && (
            <p className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${pesanNama.sukses ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {pesanNama.teks}
            </p>
          )}

          <button
            type="submit"
            disabled={sedangMenyimpanNama}
            className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600 disabled:opacity-50"
          >
            {sedangMenyimpanNama ? 'Menyimpan...' : 'Simpan Nama'}
          </button>
        </form>
      </div>

      <input
        ref={inputFotoRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={tanganiPilihFoto}
      />
    </div>
  )
}
