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

  async function tanganiSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) {
      setPesanError('Pilih karyawan terlebih dahulu')
      return
    }
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
      <div className="rounded-2xl border border-cream-200 bg-white p-5 text-sm text-muted shadow-sm">
        Seluruh karyawan aktif sudah menjadi anggota divisi ini.
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-cream-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-bold text-ink">Tambah Anggota</h2>

      <form onSubmit={tanganiSubmit} className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-xs font-semibold text-muted">Karyawan</label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2.5 text-sm text-ink outline-none focus:border-orange-500"
          >
            <option value="">Pilih karyawan...</option>
            {kandidat.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama} {k.jabatan ? `(${k.jabatan})` : ''}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={sedangProses}
          className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/25 transition hover:bg-orange-600 disabled:opacity-50"
        >
          {sedangProses ? 'Menambah...' : 'Tambah'}
        </button>
      </form>

      {pesanError && <p className="mt-2 text-sm text-red-700">{pesanError}</p>}
    </div>
  )
}
