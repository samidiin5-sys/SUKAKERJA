import { redirect } from 'next/navigation'
import { ambilDataShell } from '@/lib/shell-data'
import { ambilTaskTerhapus } from './actions'
import DaftarTerhapus from './daftar-terhapus'

export default async function HalamanDataTerhapus() {
  const data = await ambilDataShell()

  if (data.roleSistem !== 'super_admin') {
    redirect('/dashboard')
  }

  const daftar = await ambilTaskTerhapus()

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Header section */}
      <div className="mb-5 rounded-[24px] border border-cream-200 bg-white p-5 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">Pemulihan data</p>
        <h2 className="mt-1 text-lg font-black text-maroon-800">Data Terhapus</h2>
        <p className="mt-1 text-sm text-muted">
          Task yang sudah dihapus disimpan di sini selama 90 hari sebelum terhapus permanen.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Guidelines / Kebijakan */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-[24px] border border-cream-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-xs font-bold tracking-widest text-muted uppercase">Ketentuan Sampah</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4l3 3" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-ink">Retensi 90 Hari</p>
                  <p className="mt-0.5 text-[11px] text-muted leading-relaxed font-semibold">
                    Setiap tugas yang dihapus akan disimpan selama 90 hari sebelum dihapus permanen oleh sistem secara otomatis.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-ink">Pemulihan Instan</p>
                  <p className="mt-0.5 text-[11px] text-muted leading-relaxed font-semibold">
                    Tugas yang dipulihkan akan dikembalikan ke posisi papan dan kolom asalnya beserta dengan data checklist & komentar.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-ink">Penghapusan Permanen</p>
                  <p className="mt-0.5 text-[11px] text-muted leading-relaxed font-semibold">
                    Tindakan hapus permanen akan memusnahkan data tugas beserta seluruh lampiran selamanya dari database dan cloud storage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Search Bar & Daftar Terhapus */}
        <div className="lg:col-span-2">
          <DaftarTerhapus daftarAwal={daftar} />
        </div>
      </div>
    </div>
  )
}
