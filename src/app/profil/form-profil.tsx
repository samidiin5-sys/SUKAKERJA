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
      <div className="rounded-2xl border border-cream-200 bg-white shadow-sm overflow-hidden">
        {/* Banner atas */}
        <div className="h-28 bg-gradient-to-br from-maroon-950 via-maroon-800 to-maroon-700" />

        {/* Avatar + info */}
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-14 mb-4">
            {/* Avatar besar dengan overlay kamera */}
            <button
              type="button"
              onClick={() => inputFotoRef.current?.click()}
              disabled={sedangMenyimpanFoto}
              className="group relative h-28 w-28 flex-shrink-0 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-maroon-800 disabled:opacity-70 transition"
              title="Klik untuk ganti foto"
            >
              {preview ? (
                <Image
                  src={preview}
                  alt="Foto profil"
                  fill
                  className="object-cover"
                  unoptimized={preview.startsWith('blob:')}
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-3xl font-black text-cream-50">
                  {inisial(nama || 'U')}
                </span>
              )}
              {/* Overlay kamera saat hover */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                {sedangMenyimpanFoto ? (
                  <svg className="h-6 w-6 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : (
                  <>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    <span className="mt-1 text-[10px] font-bold text-white/90">Ganti Foto</span>
                  </>
                )}
              </div>
            </button>

            <div className="pb-1 min-w-0">
              <p className="text-lg font-black text-maroon-800 truncate">{nama}</p>
              <p className="text-xs text-muted mt-0.5">JPG, PNG, atau WebP · maks. 5 MB</p>
            </div>
          </div>

          {pesanFoto && (
            <p className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${pesanFoto.sukses ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {pesanFoto.teks}
            </p>
          )}
        </div>
      </div>

      {/* Kartu nama */}
      <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-black text-maroon-800">Nama Tampilan</h2>
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
            className="w-full rounded-xl bg-maroon-800 px-4 py-3 text-sm font-bold text-white shadow-md shadow-maroon-900/20 transition hover:bg-maroon-700 active:scale-[0.99] disabled:opacity-50"
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
