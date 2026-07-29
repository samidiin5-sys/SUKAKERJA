'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  aktifkanKembaliKaryawan,
  nonaktifkanKaryawan,
  resetPasswordKaryawan,
  hapusKaryawan,
  type Karyawan,
} from './actions'

function inisial(nama: string) {
  return nama
    .split(' ')
    .map((k) => k[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function DaftarKaryawan({ daftarAwal, isSuperAdmin = false }: { daftarAwal: Karyawan[]; isSuperAdmin?: boolean }) {
  const router = useRouter()
  
  // State Pencarian & Filter
  const [cari, setCari] = useState('')
  const [filterRole, setFilterRole] = useState('semua')
  const [filterStatus, setFilterStatus] = useState('semua')

  // State Aksi
  const [dialogReset, setDialogReset] = useState<{ id: string; nama: string } | null>(null)
  const [inputPassword, setInputPassword] = useState('')
  const [tampilPassword, setTampilPassword] = useState(false)
  const [pesanReset, setPesanReset] = useState<{ id: string; sukses: boolean; teks: string } | null>(null)
  
  // State Konfirmasi Kustom (Mengganti Confirm Browser)
  const [konfirmasiTindakan, setKonfirmasiTindakan] = useState<{
    tipe: 'aktifkan' | 'nonaktifkan' | 'hapus'
    id: string
    nama: string
  } | null>(null)

  const [sedangProses, setSedangProses] = useState<string | null>(null)
  const [menyalinId, setMenyalinId] = useState<string | null>(null)

  // Filter Data
  const dataTerfilter = useMemo(() => {
    return daftarAwal.filter((k) => {
      const cocokCari = k.nama.toLowerCase().includes(cari.toLowerCase()) || k.email.toLowerCase().includes(cari.toLowerCase())
      
      const roleTarget = k.role_sistem === 'super_admin' ? 'super_admin' : k.role_sistem === 'owner' ? 'owner' : 'user'
      const cocokRole = filterRole === 'semua' || roleTarget === filterRole
      
      const cocokStatus = filterStatus === 'semua' || k.status === filterStatus

      return cocokCari && cocokRole && cocokStatus
    })
  }, [daftarAwal, cari, filterRole, filterStatus])

  async function tanganiReset(e: React.FormEvent) {
    e.preventDefault()
    if (!dialogReset) return

    setSedangProses(dialogReset.id)
    const hasil = await resetPasswordKaryawan(dialogReset.id, inputPassword)
    setSedangProses(null)

    if (!hasil.sukses) {
      setPesanReset({ id: dialogReset.id, sukses: false, teks: hasil.pesan })
      return
    }

    setPesanReset({ id: dialogReset.id, sukses: true, teks: 'Password berhasil direset.' })
    setDialogReset(null)
    setInputPassword('')
    setTampilPassword(false)
    router.refresh()
  }

  function bukaDialogReset(id: string, nama: string) {
    setDialogReset({ id, nama })
    setInputPassword('')
    setTampilPassword(false)
    setPesanReset(null)
  }

  function tutupDialogReset() {
    setDialogReset(null)
    setInputPassword('')
    setTampilPassword(false)
    setPesanReset(null)
  }

  async function salinPassword(pass: string, id: string) {
    try {
      await navigator.clipboard.writeText(pass)
      setMenyalinId(id)
      setTimeout(() => setMenyalinId(null), 2000)
    } catch (err) {
      console.error('Gagal menyalin teks:', err)
    }
  }

  async function eksekusiTindakan() {
    if (!konfirmasiTindakan) return
    const { tipe, id } = konfirmasiTindakan
    
    setSedangProses(id)
    setKonfirmasiTindakan(null)
    
    const hasil = tipe === 'nonaktifkan' 
      ? await nonaktifkanKaryawan(id)
      : tipe === 'aktifkan'
      ? await aktifkanKembaliKaryawan(id)
      : await hapusKaryawan(id)
      
    setSedangProses(null)
    if (!hasil.sukses) {
      alert(hasil.pesan)
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters Panel */}
      <div className="flex flex-col gap-3 rounded-2xl border border-cream-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama atau email..."
            className="w-full rounded-xl border border-cream-200 bg-cream-50/40 px-3.5 py-2.5 pl-9 text-xs font-semibold text-ink placeholder-muted/65 outline-none focus:border-maroon-800 focus:ring-2 focus:ring-maroon-800/10 transition"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/60"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="rounded-xl border border-cream-200 bg-white px-3 py-2.5 text-xs font-bold text-ink outline-none focus:border-maroon-800 transition cursor-pointer"
          >
            <option value="semua">Semua Role</option>
            {isSuperAdmin && <option value="super_admin">Super Admin</option>}
            <option value="owner">Owner</option>
            <option value="user">Staff</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-cream-200 bg-white px-3 py-2.5 text-xs font-bold text-ink outline-none focus:border-maroon-800 transition cursor-pointer"
          >
            <option value="semua">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Tidak Aktif</option>
          </select>
        </div>
      </div>

      {/* Grid Karyawan */}
      {dataTerfilter.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-cream-200 bg-white p-8 text-center text-sm font-semibold text-muted">
          Karyawan tidak ditemukan.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-cream-200/60 bg-white shadow-sm">
          <ul className="divide-y divide-cream-100">
            {dataTerfilter.map((k) => (
              <li key={k.id} className="p-4 hover:bg-cream-50/20 transition-all duration-200">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    {/* Avatar Group */}
                    <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-maroon-800 text-xs font-black text-cream-50 ring-2 ring-cream-100/50 shadow-inner">
                      {k.fotoUrl ? (
                        <img src={k.fotoUrl} alt={k.nama} className="h-full w-full object-cover" />
                      ) : (
                        inisial(k.nama)
                      )}
                    </div>
                    <div className="min-w-0">
                      <a
                        href={`/admin/karyawan/${k.id}`}
                        className="text-sm font-black text-ink hover:text-orange-500 hover:underline transition leading-tight truncate block"
                      >
                        {k.nama}
                      </a>
                      <p className="text-xs text-muted/80 font-medium leading-none mt-0.5">{k.email}</p>
                      
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="rounded bg-cream-100/70 border border-cream-200/20 px-2 py-0.5 text-[9px] font-bold text-muted uppercase">
                          {k.jabatan ?? '-'}
                        </span>
                        <span className="rounded bg-maroon-50 border border-maroon-100/20 px-2 py-0.5 text-[9px] font-bold text-maroon-800 uppercase">
                          {k.role_sistem === 'super_admin' ? 'Super Admin' : k.role_sistem === 'owner' ? 'Owner' : 'Staff'}
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase ${
                          k.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {k.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                        </span>
                        {k.mustChangePassword && (
                          <span className="rounded bg-amber-50 border border-amber-200/30 px-2 py-0.5 text-[9px] font-bold text-amber-700 uppercase">
                            Belum Ganti Password
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tindakan — hanya Super Admin */}
                  {isSuperAdmin && <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => bukaDialogReset(k.id, k.nama)}
                      disabled={sedangProses === k.id}
                      className="rounded-xl border border-cream-200 bg-white px-3.5 py-2 text-xs font-bold text-maroon-700 transition hover:border-orange-500 hover:text-orange-600 disabled:opacity-50 active:scale-95 cursor-pointer"
                    >
                      Reset Password
                    </button>
                    {k.status === 'aktif' ? (
                      <button
                        onClick={() => setKonfirmasiTindakan({ tipe: 'nonaktifkan', id: k.id, nama: k.nama })}
                        disabled={sedangProses === k.id}
                        className="rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-bold text-red-600 transition hover:border-red-400 hover:bg-red-50/10 disabled:opacity-50 active:scale-95 cursor-pointer"
                      >
                        Nonaktifkan
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setKonfirmasiTindakan({ tipe: 'aktifkan', id: k.id, nama: k.nama })}
                          disabled={sedangProses === k.id}
                          className="rounded-xl border border-green-200 bg-white px-3.5 py-2 text-xs font-bold text-green-700 transition hover:border-green-400 hover:bg-green-50/10 disabled:opacity-50 active:scale-95 cursor-pointer"
                        >
                          Aktifkan
                        </button>
                        <button
                          onClick={() => setKonfirmasiTindakan({ tipe: 'hapus', id: k.id, nama: k.nama })}
                          disabled={sedangProses === k.id}
                          className="rounded-xl bg-red-600 hover:bg-red-700 px-3.5 py-2 text-xs font-bold text-white transition disabled:opacity-50 active:scale-95 cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    )}
                  </div>}
                </div>

                {/* Inline reset password form */}
                {dialogReset?.id === k.id && (
                  <form onSubmit={tanganiReset} className="mt-3.5 rounded-2xl border border-cream-200/80 bg-cream-50/40 p-4 shadow-inner">
                    <p className="mb-2 text-xs font-bold text-muted">
                      Password baru untuk <span className="text-maroon-800 font-extrabold">{dialogReset.nama}</span>
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <div className="relative flex-1">
                        <input
                          type={tampilPassword ? 'text' : 'password'}
                          placeholder="Password baru (min. 8 karakter)"
                          required
                          value={inputPassword}
                          onChange={(e) => setInputPassword(e.target.value)}
                          className="w-full rounded-xl border border-cream-200 bg-white px-3 py-2.5 pr-10 text-xs font-semibold text-ink outline-none focus:border-maroon-800 focus:ring-2 focus:ring-maroon-800/10 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setTampilPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
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

                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={sedangProses === k.id}
                          className="rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-xs font-bold text-white transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-md shadow-orange-500/10"
                        >
                          {sedangProses === k.id ? 'Memuat...' : 'Simpan'}
                        </button>
                        <button
                          type="button"
                          onClick={() => salinPassword(inputPassword, k.id)}
                          disabled={!inputPassword}
                          className="rounded-xl border border-cream-200 bg-white px-3.5 py-2.5 text-xs font-bold text-muted hover:bg-cream-50 active:scale-95 transition cursor-pointer"
                        >
                          {menyalinId === k.id ? 'Tersalin ✓' : 'Salin'}
                        </button>
                        <button
                          type="button"
                          onClick={tutupDialogReset}
                          className="rounded-xl border border-cream-200 bg-white px-3.5 py-2.5 text-xs font-bold text-muted hover:bg-cream-100 transition cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                    {pesanReset?.id === k.id && (
                      <p className={`mt-2 text-xs font-bold ${pesanReset.sukses ? 'text-green-700' : 'text-red-700'}`}>
                        {pesanReset.teks}
                      </p>
                    )}
                  </form>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modal Dialog Konfirmasi Kustom */}
      {konfirmasiTindakan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 border border-cream-200/30 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-black text-maroon-800">
              {konfirmasiTindakan.tipe === 'nonaktifkan' ? 'Nonaktifkan akun karyawan?' : konfirmasiTindakan.tipe === 'aktifkan' ? 'Aktifkan kembali akun?' : 'Hapus permanen akun karyawan?'}
            </h3>
            <p className="mt-1.5 text-xs text-muted/80 leading-relaxed font-semibold">
              Apakah Anda yakin ingin {konfirmasiTindakan.tipe === 'nonaktifkan' ? 'menonaktifkan' : konfirmasiTindakan.tipe === 'aktifkan' ? 'mengaktifkan kembali' : 'menghapus (soft delete)'} akun milik{' '}
              <span className="text-ink font-bold">{konfirmasiTindakan.nama}</span>?
              {konfirmasiTindakan.tipe === 'hapus' && ' Data riwayat pekerjaan akan tetap aman di log sistem.'}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setKonfirmasiTindakan(null)}
                className="rounded-xl border border-cream-200 px-4 py-2 text-xs font-bold text-muted transition hover:bg-cream-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={eksekusiTindakan}
                className={`rounded-xl px-4 py-2 text-xs font-bold text-white transition active:scale-95 cursor-pointer ${
                  konfirmasiTindakan.tipe === 'nonaktifkan'
                    ? 'bg-red-600 hover:bg-red-700'
                    : konfirmasiTindakan.tipe === 'aktifkan'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Ya, {konfirmasiTindakan.tipe === 'nonaktifkan' ? 'Nonaktifkan' : konfirmasiTindakan.tipe === 'aktifkan' ? 'Aktifkan' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
