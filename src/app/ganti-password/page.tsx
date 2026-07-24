'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/auth-layout'
import { gantiPassword } from './actions'

export default function HalamanGantiPassword() {
  const router = useRouter()
  const [passwordBaru, setPasswordBaru] = useState('')
  const [konfirmasi, setKonfirmasi] = useState('')
  const [pesanError, setPesanError] = useState<string[]>([])
  const [sedangProses, setSedangProses] = useState(false)

  async function tanganiSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPesanError([])
    setSedangProses(true)

    const hasil = await gantiPassword(passwordBaru, konfirmasi)

    setSedangProses(false)

    if (!hasil.sukses) {
      setPesanError(hasil.pesan)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl shadow-maroon-950/10">
        <h1 className="text-2xl font-black text-maroon-800">Ganti Password</h1>
        <p className="mt-1 mb-6 text-sm text-muted">
          Minimal 8 karakter, mengandung huruf dan angka.
        </p>

        <form onSubmit={tanganiSubmit} className="space-y-4">
          <div>
            <label htmlFor="passwordBaru" className="mb-1 block text-sm font-semibold text-ink">
              Password Baru
            </label>
            <input
              id="passwordBaru"
              type="password"
              required
              value={passwordBaru}
              onChange={(e) => setPasswordBaru(e.target.value)}
              className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2.5 text-sm text-ink outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div>
            <label htmlFor="konfirmasi" className="mb-1 block text-sm font-semibold text-ink">
              Konfirmasi Password Baru
            </label>
            <input
              id="konfirmasi"
              type="password"
              required
              value={konfirmasi}
              onChange={(e) => setKonfirmasi(e.target.value)}
              className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2.5 text-sm text-ink outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          {pesanError.length > 0 && (
            <ul className="space-y-1 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {pesanError.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}

          <button
            type="submit"
            disabled={sedangProses}
            className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600 disabled:opacity-50"
          >
            {sedangProses ? 'Menyimpan...' : 'Simpan Password Baru'}
          </button>
        </form>
      </div>
    </AuthLayout>
  )
}
