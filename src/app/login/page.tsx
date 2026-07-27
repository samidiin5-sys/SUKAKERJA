'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/auth-layout'
import { login } from './actions'

export default function HalamanLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tampilPassword, setTampilPassword] = useState(false)
  const [pesanError, setPesanError] = useState<string | null>(null)
  const [sedangProses, setSedangProses] = useState(false)
  const [pesanNonaktif, setPesanNonaktif] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('nonaktif') === '1') {
      setPesanNonaktif(true)
    }
  }, [])

  async function tanganiSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPesanError(null)
    setSedangProses(true)

    const hasil = await login(email, password)

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
        <h1 className="text-2xl font-black text-maroon-800">Masuk Sistem</h1>
        <p className="mt-1 mb-6 text-sm text-muted">Masuk dengan email dan password akun Anda</p>

        {pesanNonaktif && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            Akun Anda telah dinonaktifkan. Hubungi Super Admin.
          </p>
        )}

        <form onSubmit={tanganiSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold text-ink">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2.5 text-sm text-ink outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-semibold text-ink">
              Kata Sandi
            </label>
            <div className="relative">
              <input
                id="password"
                type={tampilPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2.5 pr-10 text-sm text-ink outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
              <button
                type="button"
                onClick={() => setTampilPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition"
                tabIndex={-1}
                aria-label={tampilPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {tampilPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {pesanError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{pesanError}</p>
          )}

          <button
            type="submit"
            disabled={sedangProses}
            className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600 disabled:opacity-50"
          >
            {sedangProses ? 'Memproses...' : 'Masuk ke Portal →'}
          </button>
        </form>
      </div>
    </AuthLayout>
  )
}
