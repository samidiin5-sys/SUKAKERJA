'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { hapusPermanenTask, restoreTask, type TaskTerhapus } from './actions'

function formatWaktu(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function DaftarTerhapus({ daftarAwal }: { daftarAwal: TaskTerhapus[] }) {
  const router = useRouter()
  const [cari, setCari] = useState('')
  const [sedangProses, setSedangProses] = useState<string | null>(null)

  // State Konfirmasi Kustom (Mengganti Confirm Browser)
  const [konfirmasiTindakan, setKonfirmasiTindakan] = useState<{
    tipe: 'pulihkan' | 'hapus_permanen'
    id: string
    judul: string
  } | null>(null)

  const dataTerfilter = useMemo(() => {
    return daftarAwal.filter((t) =>
      t.judul.toLowerCase().includes(cari.toLowerCase()) ||
      t.divisiNama.toLowerCase().includes(cari.toLowerCase()) ||
      t.boardNama.toLowerCase().includes(cari.toLowerCase())
    )
  }, [daftarAwal, cari])

  async function eksekusiTindakan() {
    if (!konfirmasiTindakan) return
    const { tipe, id } = konfirmasiTindakan
    
    setSedangProses(id)
    setKonfirmasiTindakan(null)
    
    const hasil = tipe === 'pulihkan' 
      ? await restoreTask(id)
      : await hapusPermanenTask(id)
      
    setSedangProses(null)
    if (!hasil.sukses) {
      alert(hasil.pesan)
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Bilah Pencarian */}
      <div className="relative">
        <input
          type="text"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="Cari task terhapus..."
          className="w-full rounded-xl border border-cream-200 bg-white px-3.5 py-2.5 pl-9 text-xs font-semibold text-ink placeholder-muted/65 outline-none focus:border-maroon-800 focus:ring-2 focus:ring-maroon-800/10 transition"
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

      {dataTerfilter.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-cream-200 bg-white p-8 text-center text-sm font-semibold text-muted">
          Tidak ada data terhapus ditemukan.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-cream-200/60 bg-white shadow-sm">
          <ul className="divide-y divide-cream-100">
            {dataTerfilter.map((t) => (
              <li key={t.id} className="p-4 hover:bg-cream-50/20 transition-all duration-200">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-ink leading-snug">{t.judul}</h4>
                    <p className="mt-1 text-[10px] font-bold text-muted uppercase">
                      {t.divisiNama} &middot; {t.boardNama}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold text-muted/80">
                      Dihapus oleh <span className="font-extrabold text-ink">{t.dihapusOleh}</span> &middot; {formatWaktu(t.deletedAt)}
                    </p>
                    <span
                      className={`mt-2 inline-block rounded border px-2 py-0.5 text-[9px] font-bold uppercase ${
                        t.sisaHari <= 7 
                          ? 'bg-red-50 text-red-600 border-red-200/40 animate-pulse' 
                          : 'bg-cream-100 text-muted border-cream-200/20'
                      }`}
                    >
                      Sisa {t.sisaHari} hari sebelum terhapus permanen
                    </span>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => setKonfirmasiTindakan({ tipe: 'pulihkan', id: t.id, judul: t.judul })}
                      disabled={sedangProses === t.id}
                      className="rounded-xl border border-green-200 bg-white px-3.5 py-2 text-xs font-bold text-green-700 transition hover:border-green-400 hover:bg-green-50/15 disabled:opacity-50 active:scale-95 cursor-pointer"
                    >
                      Pulihkan
                    </button>
                    <button
                      onClick={() => setKonfirmasiTindakan({ tipe: 'hapus_permanen', id: t.id, judul: t.judul })}
                      disabled={sedangProses === t.id}
                      className="rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-bold text-red-600 transition hover:border-red-400 hover:bg-red-50/15 disabled:opacity-50 active:scale-95 cursor-pointer"
                    >
                      Hapus Permanen
                    </button>
                  </div>
                </div>
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
              {konfirmasiTindakan.tipe === 'pulihkan' ? 'Pulihkan task?' : 'Hapus permanen task?'}
            </h3>
            <p className="mt-1.5 text-xs text-muted/80 leading-relaxed font-semibold">
              {konfirmasiTindakan.tipe === 'pulihkan' ? (
                <>
                  Apakah Anda yakin ingin memulihkan kembali task <span className="text-ink font-bold">&ldquo;{konfirmasiTindakan.judul}&rdquo;</span> ke papan Kanban divisi asal?
                </>
              ) : (
                <>
                  Apakah Anda yakin ingin menghapus permanen task <span className="text-ink font-bold">&ldquo;{konfirmasiTindakan.judul}&rdquo;</span>? 
                  <span className="text-red-600 block mt-1 font-bold">⚠️ Tindakan ini TIDAK BISA dibatalkan — seluruh checklist, komentar, dan lampiran ikut terhapus selamanya.</span>
                </>
              )}
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
                  konfirmasiTindakan.tipe === 'pulihkan'
                    ? 'bg-green-600 hover:bg-green-700 shadow-md shadow-green-600/10'
                    : 'bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/10'
                }`}
              >
                Ya, {konfirmasiTindakan.tipe === 'pulihkan' ? 'Pulihkan' : 'Hapus Permanen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
