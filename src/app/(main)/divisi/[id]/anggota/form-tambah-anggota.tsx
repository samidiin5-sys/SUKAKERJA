'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { tambahAnggota, type KaryawanTersedia } from '../actions'

export default function FormTambahAnggota({
  divisionId,
  kandidat,
}: {
  divisionId: string
  kandidat: KaryawanTersedia[]
}) {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [pesanError, setPesanError] = useState<string | null>(null)
  const [sedangProses, setSedangProses] = useState(false)
  const [errStaff, setErrStaff] = useState(false)

  async function tanganiSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) {
      setErrStaff(true)
      return
    }
    setErrStaff(false)
    setPesanError(null)
    setSedangProses(true)

    const hasil = await tambahAnggota(divisionId, userId, 'staff')

    setSedangProses(false)

    if (!hasil.sukses) {
      setPesanError(hasil.pesan)
      return
    }

    setUserId('')
    router.refresh()
  }

  if (kandidat.length === 0) {
    return (
      <div className="rounded-[24px] border border-cream-200 bg-white p-5 text-xs font-bold text-muted shadow-sm leading-relaxed">
        Seluruh karyawan aktif sudah menjadi anggota divisi ini.
      </div>
    )
  }

  return (
    <div className="rounded-[24px] border border-cream-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-xs font-bold tracking-widest text-muted uppercase">Tambah Anggota Baru</h2>

      <form onSubmit={tanganiSubmit} className="flex flex-col gap-3" noValidate>
        <div>
          <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-muted uppercase">
            Pilih Staff
          </label>
          <select
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value)
              if (e.target.value) setErrStaff(false)
            }}
            className={`w-full rounded-xl border bg-cream-50/50 px-3.5 py-2.5 text-xs font-bold text-ink outline-none cursor-pointer shadow-inner ${
              errStaff ? 'border-red-500 ring-2 ring-red-500/10' : 'border-cream-200 focus:border-maroon-800'
            }`}
          >
            <option value="">Pilih karyawan...</option>
            {kandidat.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama} {k.jabatan ? `(${k.jabatan})` : ''}
              </option>
            ))}
          </select>
          {errStaff && (
            <p className="mt-1 text-[10px] font-bold text-red-600">Pilih staff terlebih dahulu!</p>
          )}
        </div>

        <button
          type="submit"
          disabled={sedangProses}
          className="w-full rounded-xl bg-maroon-800 px-4 py-2.5 text-xs font-bold text-cream-50 hover:bg-maroon-900 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all shadow-md shadow-maroon-800/10"
        >
          {sedangProses ? 'Memproses...' : 'Tambahkan Ke Divisi'}
        </button>
      </form>

      {pesanError && <p className="mt-2 text-xs font-semibold text-red-700">{pesanError}</p>}
    </div>
  )
}
