'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  hapusPermanenTask, 
  restoreTask, 
  restoreTasks, 
  hapusPermanenTasks, 
  kosongkanTempatSampah, 
  type TaskTerhapus 
} from './actions'

function formatWaktu(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function hashWarnaDivisi(nama: string) {
  let hash = 0
  for (let i = 0; i < nama.length; i++) hash = nama.charCodeAt(i) + ((hash << 5) - hash)
  const colors = [
    'bg-blue-50 text-blue-700 border-blue-200/50',
    'bg-indigo-50 text-indigo-700 border-indigo-200/50',
    'bg-emerald-50 text-emerald-700 border-emerald-200/50',
    'bg-amber-50 text-amber-700 border-amber-200/50',
    'bg-rose-50 text-rose-700 border-rose-200/50',
    'bg-cyan-50 text-cyan-700 border-cyan-200/50',
    'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/50',
    'bg-teal-50 text-teal-700 border-teal-200/50',
  ]
  return colors[Math.abs(hash) % colors.length]
}

export default function DaftarTerhapus({ daftarAwal }: { daftarAwal: TaskTerhapus[] }) {
  const router = useRouter()
  const [cari, setCari] = useState('')
  const [sedangProses, setSedangProses] = useState<string | null>(null)
  const [terpilih, setTerpilih] = useState<Set<string>>(new Set())

  // State Konfirmasi Kustom
  const [konfirmasiTindakan, setKonfirmasiTindakan] = useState<{
    tipe: 'pulihkan' | 'hapus_permanen' | 'pulihkan_masal' | 'hapus_permanen_masal' | 'kosongkan_sampah'
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

  function togglePilih(id: string) {
    setTerpilih((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function togglePilihSemua() {
    if (terpilih.size === dataTerfilter.length) {
      setTerpilih(new Set())
    } else {
      setTerpilih(new Set(dataTerfilter.map((t) => t.id)))
    }
  }

  async function eksekusiTindakan() {
    if (!konfirmasiTindakan) return
    const { tipe, id } = konfirmasiTindakan
    
    setSedangProses(id)
    setKonfirmasiTindakan(null)
    
    let hasil
    if (tipe === 'pulihkan') {
      hasil = await restoreTask(id)
    } else if (tipe === 'hapus_permanen') {
      hasil = await hapusPermanenTask(id)
    } else if (tipe === 'pulihkan_masal') {
      hasil = await restoreTasks(Array.from(terpilih))
      setTerpilih(new Set())
    } else if (tipe === 'hapus_permanen_masal') {
      hasil = await hapusPermanenTasks(Array.from(terpilih))
      setTerpilih(new Set())
    } else if (tipe === 'kosongkan_sampah') {
      hasil = await kosongkanTempatSampah()
      setTerpilih(new Set())
    }
      
    setSedangProses(null)
    if (hasil && !hasil.sukses) {
      alert(hasil.pesan)
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Bilah Pencarian & Kosongkan Sampah */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari task terhapus..."
            className="w-full rounded-xl border border-cream-200 bg-white px-3.5 py-2.5 pl-9 text-xs font-semibold text-ink placeholder-muted/65 outline-none focus:border-maroon-800 focus:ring-2 focus:ring-maroon-800/10 transition shadow-inner"
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

        {daftarAwal.length > 0 && (
          <button
            onClick={() => setKonfirmasiTindakan({ tipe: 'kosongkan_sampah', id: 'all', judul: 'Semua task terhapus' })}
            className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-600 transition hover:border-red-400 hover:bg-red-50/20 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Kosongkan Sampah
          </button>
        )}
      </div>

      {/* Kontrol Pilihan Masal */}
      {dataTerfilter.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-cream-200 bg-cream-50/50 p-3 shadow-inner">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={terpilih.size === dataTerfilter.length && dataTerfilter.length > 0}
              onChange={togglePilihSemua}
              className="rounded border-cream-300 text-maroon-800 focus:ring-maroon-800"
            />
            <span className="text-xs font-bold text-ink">Pilih Semua</span>
          </label>
          
          {terpilih.size > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs font-bold text-muted">{terpilih.size} Terpilih:</span>
              <button
                onClick={() => setKonfirmasiTindakan({ tipe: 'pulihkan_masal', id: 'bulk', judul: `${terpilih.size} task` })}
                className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 active:scale-95 shadow-md shadow-emerald-600/10 transition-all cursor-pointer"
              >
                Pulihkan
              </button>
              <button
                onClick={() => setKonfirmasiTindakan({ tipe: 'hapus_permanen_masal', id: 'bulk', judul: `${terpilih.size} task` })}
                className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 active:scale-95 shadow-md shadow-red-600/10 transition-all cursor-pointer"
              >
                Hapus Permanen
              </button>
            </div>
          )}
        </div>
      )}

      {dataTerfilter.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-cream-200 bg-white p-8 text-center text-sm font-semibold text-muted">
          Tidak ada data terhapus ditemukan.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-cream-200/60 bg-white shadow-sm">
          <ul className="divide-y divide-cream-100">
            {dataTerfilter.map((t) => {
              const isChecked = terpilih.has(t.id)
              const warnaDivisi = hashWarnaDivisi(t.divisiNama)
              const namaPenghapus = t.dihapusOleh === 'Tidak diketahui' ? 'Sistem' : t.dihapusOleh
              
              return (
                <li key={t.id} className={`p-4 transition-all duration-200 ${isChecked ? 'bg-cream-50/30' : 'hover:bg-cream-50/20'}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePilih(t.id)}
                      className="mt-1.5 rounded border-cream-300 text-maroon-800 focus:ring-maroon-800 cursor-pointer"
                    />
                    
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between flex-1 min-w-0">
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-ink leading-snug">{t.judul}</h4>
                        
                        {/* Division & Board Pill Badges */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase ${warnaDivisi}`}>
                            {t.divisiNama}
                          </span>
                          <span className="rounded-full border border-cream-200 bg-cream-50 px-2.5 py-0.5 text-[9px] font-bold text-muted uppercase">
                            {t.boardNama}
                          </span>
                        </div>
                        
                        <p className="mt-2 text-[10px] font-semibold text-muted">
                          Dihapus oleh <span className="font-bold text-ink">{namaPenghapus}</span> &middot; {formatWaktu(t.deletedAt)}
                        </p>
                        
                        <div className="mt-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase ${
                              t.sisaHari <= 7 
                                ? 'bg-red-50 text-red-700 border border-red-200/50 animate-pulse' 
                                : 'bg-orange-50 text-orange-700 border border-orange-200/50'
                            }`}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            Sisa {t.sisaHari} hari sebelum permanen
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-shrink-0 items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => setKonfirmasiTindakan({ tipe: 'pulihkan', id: t.id, judul: t.judul })}
                          disabled={sedangProses === t.id}
                          className="rounded-xl border border-emerald-200 bg-white px-3.5 py-2 text-xs font-bold text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-50/15 disabled:opacity-50 active:scale-95 cursor-pointer shadow-sm"
                        >
                          Pulihkan
                        </button>
                        <button
                          onClick={() => setKonfirmasiTindakan({ tipe: 'hapus_permanen', id: t.id, judul: t.judul })}
                          disabled={sedangProses === t.id}
                          className="rounded-xl border border-transparent bg-red-50 px-3.5 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50 active:scale-95 cursor-pointer"
                        >
                          Hapus Permanen
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Modal Dialog Konfirmasi Kustom */}
      {konfirmasiTindakan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 border border-cream-200/30 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-black text-maroon-800">
              {konfirmasiTindakan.tipe.startsWith('pulihkan') ? 'Pulihkan task?' : 'Hapus permanen task?'}
            </h3>
            <p className="mt-1.5 text-xs text-muted/80 leading-relaxed font-semibold">
              {konfirmasiTindakan.tipe === 'pulihkan' && (
                <>
                  Apakah Anda yakin ingin memulihkan kembali task <span className="text-ink font-bold">&ldquo;{konfirmasiTindakan.judul}&rdquo;</span> ke papan Kanban divisi asal?
                </>
              )}
              {konfirmasiTindakan.tipe === 'pulihkan_masal' && (
                <>
                  Apakah Anda yakin ingin memulihkan kembali <span className="text-ink font-bold">{konfirmasiTindakan.judul}</span> yang terpilih ke divisi asal masing-masing?
                </>
              )}
              {konfirmasiTindakan.tipe === 'hapus_permanen' && (
                <>
                  Apakah Anda yakin ingin menghapus permanen task <span className="text-ink font-bold">&ldquo;{konfirmasiTindakan.judul}&rdquo;</span>? 
                  <span className="text-red-600 block mt-1 font-bold">⚠️ Tindakan ini TIDAK BISA dibatalkan — seluruh checklist, komentar, dan lampiran ikut terhapus selamanya.</span>
                </>
              )}
              {konfirmasiTindakan.tipe === 'hapus_permanen_masal' && (
                <>
                  Apakah Anda yakin ingin menghapus permanen <span className="text-ink font-bold">{konfirmasiTindakan.judul}</span> yang terpilih? 
                  <span className="text-red-600 block mt-1 font-bold">⚠️ Tindakan ini TIDAK BISA dibatalkan — data akan hilang selamanya.</span>
                </>
              )}
              {konfirmasiTindakan.tipe === 'kosongkan_sampah' && (
                <>
                  Apakah Anda yakin ingin **mengosongkan seluruh tempat sampah**?
                  <span className="text-red-600 block mt-1 font-bold">⚠️ Seluruh data terhapus saat ini akan dimusnahkan secara permanen. Tindakan ini tidak dapat dibatalkan.</span>
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
                  konfirmasiTindakan.tipe.startsWith('pulihkan')
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/10'
                    : 'bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/10'
                }`}
              >
                Ya, {konfirmasiTindakan.tipe.startsWith('pulihkan') ? 'Pulihkan' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
