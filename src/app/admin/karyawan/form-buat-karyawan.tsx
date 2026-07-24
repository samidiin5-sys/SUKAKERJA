'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { buatKaryawan } from './actions'

export default function FormBuatKaryawan({
  daftarDivisi,
}: {
  daftarDivisi: { id: string; nama: string }[]
}) {
  const router = useRouter()
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tampilPassword, setTampilPassword] = useState(false)
  const [roleSistem, setRoleSistem] = useState<'super_admin' | 'owner' | 'user'>('user')
  const [divisionId, setDivisionId] = useState('')
  const [pesanError, setPesanError] = useState<string | null>(null)
  const [berhasilDibuat, setBerhasilDibuat] = useState<string | null>(null)
  const [sedangProses, setSedangProses] = useState(false)
  const [menyalin, setMenyalin] = useState(false)

  async function tanganiSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPesanError(null)
    setBerhasilDibuat(null)

    if (roleSistem === 'user' && !divisionId) {
      setPesanError('Pilih divisi/job untuk role Staff')
      return
    }

    setSedangProses(true)
    const hasil = await buatKaryawan(nama, email, password, roleSistem, divisionId || undefined)
    setSedangProses(false)

    if (!hasil.sukses) {
      setPesanError(hasil.pesan)
      return
    }

    setBerhasilDibuat(hasil.passwordSementara)
    setNama('')
    setEmail('')
    setPassword('')
    setDivisionId('')
    router.refresh()
  }

  async function salinKeClipboard(teks: string) {
    try {
      await navigator.clipboard.writeText(teks)
      setMenyalin(true)
      setTimeout(() => setMenyalin(false), 2000)
    } catch (err) {
      console.error('Gagal menyalin:', err)
    }
  }

  return (
    <div className="rounded-3xl border border-cream-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-black text-maroon-800 uppercase tracking-wider">Tambah Karyawan Baru</h2>

      {berhasilDibuat && (
        <div className="mb-4 rounded-2xl bg-orange-50 border border-orange-200/40 p-4 text-xs font-semibold text-orange-950">
          <p className="font-black text-sm text-orange-900 mb-1">Akun berhasil dibuat!</p>
          <div className="flex items-center justify-between gap-3 bg-white/70 rounded-xl p-2.5 border border-orange-200/20 my-2">
            <span className="font-mono text-xs font-bold select-all">{berhasilDibuat}</span>
            <button
              onClick={() => salinKeClipboard(berhasilDibuat)}
              className="rounded-lg bg-orange-500 hover:bg-orange-600 px-3 py-1.5 text-[10px] font-bold text-white transition active:scale-95 cursor-pointer"
            >
              {menyalin ? 'Tersalin ✓' : 'Salin'}
            </button>
          </div>
          <p className="text-[10px] text-orange-800/80 leading-relaxed font-bold">
            Sampaikan password ini ke karyawan secara langsung, bukan lewat grup chat.
          </p>
        </div>
      )}

      <form onSubmit={tanganiSubmit} className="space-y-3.5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            type="text"
            placeholder="Nama lengkap"
            required
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="w-full rounded-xl border border-cream-200 bg-cream-50/40 px-3.5 py-2.5 text-xs font-semibold text-ink placeholder-muted/65 outline-none focus:border-maroon-800 focus:ring-2 focus:ring-maroon-800/10 transition"
          />
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-cream-200 bg-cream-50/40 px-3.5 py-2.5 text-xs font-semibold text-ink placeholder-muted/65 outline-none focus:border-maroon-800 focus:ring-2 focus:ring-maroon-800/10 transition"
          />
        </div>

        <div className="relative">
          <input
            type={tampilPassword ? 'text' : 'password'}
            placeholder="Password (min. 8 karakter)"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-cream-200 bg-cream-50/40 px-3.5 py-2.5 pr-10 text-xs font-semibold text-ink placeholder-muted/65 outline-none focus:border-maroon-800 focus:ring-2 focus:ring-maroon-800/10 transition"
          />
          <button
            type="button"
            onClick={() => setTampilPassword((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer outline-none"
            aria-label={tampilPassword ? 'Sembunyikan password' : 'Tampilkan password'}
          >
            {tampilPassword ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[10px] font-bold text-muted uppercase tracking-wider">Role</label>
            <select
              value={roleSistem}
              onChange={(e) => {
                const nilai = e.target.value as 'super_admin' | 'owner' | 'user'
                setRoleSistem(nilai)
                if (nilai !== 'user') setDivisionId('')
              }}
              className="w-full rounded-xl border border-cream-200 bg-cream-50/40 px-3 py-2.5 text-xs font-bold text-ink outline-none focus:border-maroon-800 cursor-pointer"
            >
              <option value="user">Staff</option>
              <option value="owner">Owner</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          {roleSistem === 'user' && (
            <div>
              <label className="mb-1 block text-[10px] font-bold text-muted uppercase tracking-wider">Divisi / Job</label>
              <select
                value={divisionId}
                onChange={(e) => setDivisionId(e.target.value)}
                className="w-full rounded-xl border border-cream-200 bg-cream-50/40 px-3 py-2.5 text-xs font-bold text-ink outline-none focus:border-maroon-800 cursor-pointer"
              >
                <option value="">Pilih divisi...</option>
                {daftarDivisi.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nama}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {pesanError && <p className="text-xs font-bold text-red-600">{pesanError}</p>}

        <button
          type="submit"
          disabled={sedangProses}
          className="rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/25 transition active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {sedangProses ? 'Membuat Akun...' : 'Buat Akun Karyawan'}
        </button>
      </form>
    </div>
  )
}
