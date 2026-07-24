'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { aktifkanKembaliDivisi, nonaktifkanDivisi, type Divisi } from './actions'

export default function DaftarDivisi({ daftarAwal }: { daftarAwal: Divisi[] }) {
  const router = useRouter()
  const [sedangProses, setSedangProses] = useState<string | null>(null)
  const [dialogNonaktifkan, setDialogNonaktifkan] = useState<{ id: string; nama: string } | null>(null)
  const [inputKonfirmasi, setInputKonfirmasi] = useState('')
  const [warningTaskAktif, setWarningTaskAktif] = useState<number | null>(null)

  async function tanganiNonaktifkan() {
    if (!dialogNonaktifkan) return
    setSedangProses(dialogNonaktifkan.id)
    const hasil = await nonaktifkanDivisi(dialogNonaktifkan.id, inputKonfirmasi)
    setSedangProses(null)
    if (!hasil.sukses) {
      alert(hasil.pesan)
      return
    }
    if (hasil.jumlahTaskAktif > 0) {
      setWarningTaskAktif(hasil.jumlahTaskAktif)
      // Close dialog after short delay
      setTimeout(() => {
        setDialogNonaktifkan(null)
        setInputKonfirmasi('')
        setWarningTaskAktif(null)
        router.refresh()
      }, 2500)
    } else {
      setDialogNonaktifkan(null)
      setInputKonfirmasi('')
      router.refresh()
    }
  }

  async function tanganiAktifkan(id: string) {
    setSedangProses(id)
    const hasil = await aktifkanKembaliDivisi(id)
    setSedangProses(null)
    if (!hasil.sukses) {
      alert(hasil.pesan)
      return
    }
    router.refresh()
  }

  if (daftarAwal.length === 0) {
    return <p className="text-sm font-semibold text-muted/70 italic py-6 text-center">Belum ada divisi.</p>
  }

  return (
    <>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {daftarAwal.map((d) => (
          <li
            key={d.id}
            className={`rounded-3xl border border-cream-200 bg-white p-5 shadow-sm transition hover:shadow-md ${
              d.status !== 'aktif' ? 'opacity-65' : ''
            }`}
          >
            <a href={`/divisi/${d.id}`} className="block transition group">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: d.warna }} aria-hidden />
                <p className="font-black text-ink group-hover:text-orange-500 transition leading-snug">{d.nama}</p>
                {d.status !== 'aktif' && (
                  <span className="rounded-full bg-cream-200 px-2.5 py-0.5 text-[9px] font-extrabold text-muted uppercase">
                    Nonaktif
                  </span>
                )}
              </div>
              
              <p className="mt-2 text-xs font-semibold text-muted/80 leading-relaxed min-h-[40px]">
                {d.deskripsi ? d.deskripsi : 'Tidak ada deskripsi.'}
              </p>
              
              <div className="mt-3 flex items-center justify-between border-t border-cream-100 pt-2.5">
                <span className="text-[10px] font-bold text-muted bg-cream-50 px-2 py-0.5 rounded border border-cream-200/20">
                  {d.jumlahAnggota} Anggota
                </span>
                <span className="text-[9px] font-extrabold text-maroon-800 uppercase tracking-wide group-hover:underline">
                  Buka Papan &rarr;
                </span>
              </div>
            </a>

            <div className="mt-4 flex justify-end">
              {d.status === 'aktif' ? (
                <button
                  onClick={() => { setDialogNonaktifkan({ id: d.id, nama: d.nama }); setInputKonfirmasi('') }}
                  disabled={sedangProses === d.id}
                  className="rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-bold text-red-600 transition hover:border-red-400 hover:bg-red-50/15 disabled:opacity-50 active:scale-95 cursor-pointer"
                >
                  {sedangProses === d.id ? 'Memproses...' : 'Nonaktifkan'}
                </button>
              ) : (
                <button
                  onClick={() => tanganiAktifkan(d.id)}
                  disabled={sedangProses === d.id}
                  className="rounded-xl border border-green-200 bg-white px-3.5 py-2 text-xs font-bold text-green-700 transition hover:border-green-400 hover:bg-green-50/15 disabled:opacity-50 active:scale-95 cursor-pointer"
                >
                  {sedangProses === d.id ? 'Memproses...' : 'Aktifkan'}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {dialogNonaktifkan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 border border-cream-200/30 shadow-2xl animate-in zoom-in-95 duration-150">
            <h2 className="text-base font-black text-maroon-800 mb-1.5">Nonaktifkan Divisi</h2>
            <p className="text-xs text-muted/80 leading-relaxed font-semibold mb-4">
              Ketik nama divisi <span className="font-extrabold text-ink">{dialogNonaktifkan.nama}</span> di bawah ini untuk konfirmasi tindakan.
            </p>
            <input
              type="text"
              value={inputKonfirmasi}
              onChange={(e) => setInputKonfirmasi(e.target.value)}
              placeholder="Nama divisi..."
              className="mb-4 w-full rounded-xl border border-cream-200 bg-cream-50/40 px-3.5 py-2.5 text-xs font-semibold text-ink placeholder-muted/65 outline-none focus:border-maroon-800 focus:ring-2 focus:ring-maroon-800/10 transition"
            />
            {warningTaskAktif !== null && (
              <div className="mb-4 rounded-xl bg-yellow-50 border border-yellow-200/30 px-3 py-2 text-xs font-bold text-yellow-800">
                ⚠️ Terdapat {warningTaskAktif} task aktif di divisi ini.
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => { setDialogNonaktifkan(null); setInputKonfirmasi('') }}
                className="flex-1 rounded-xl border border-cream-200 px-4 py-2.5 text-xs font-bold text-muted hover:bg-cream-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={tanganiNonaktifkan}
                disabled={inputKonfirmasi !== dialogNonaktifkan.nama || sedangProses === dialogNonaktifkan.id}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-40 transition active:scale-95 cursor-pointer shadow-md shadow-red-600/10"
              >
                {sedangProses === dialogNonaktifkan.id ? 'Memproses...' : 'Nonaktifkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
