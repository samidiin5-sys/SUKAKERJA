import { ambilDataShell } from '@/lib/shell-data'
import { ambilSesiPengguna } from '@/lib/auth/otorisasi'
import { ambilLemburSaya } from './actions'
import FormLembur from './form-lembur'
import DaftarLemburSaya from './daftar-lembur-saya'

export default async function HalamanLembur() {
  const [data, sesi, lemburSaya] = await Promise.all([
    ambilDataShell(),
    ambilSesiPengguna(),
    ambilLemburSaya(),
  ])

  const isOwnerOrAdmin = sesi.roleSistem !== 'user'

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Header section */}
      <div className="mb-5 rounded-[24px] border border-cream-200 bg-white p-5 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">Operasional lembur</p>
        <h2 className="mt-1 text-lg font-black text-maroon-800">
          {isOwnerOrAdmin ? 'Tetapkan Lembur' : 'Pengajuan Lembur'}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {isOwnerOrAdmin
            ? 'Tetapkan lembur untuk staff divisimu — langsung disetujui.'
            : 'Ajukan lembur dan pantau status persetujuannya.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {isOwnerOrAdmin ? (
          <>
            {/* Left Column: Guidelines / Kebijakan */}
            <div className="lg:col-span-1 space-y-4">
              <div className="rounded-[24px] border border-cream-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-xs font-bold tracking-widest text-muted uppercase">Kebijakan Lembur</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4l3 3" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink">Persetujuan Instan</p>
                      <p className="mt-0.5 text-[11px] text-muted leading-relaxed font-semibold">
                        Lembur yang ditetapkan oleh Owner atau Admin langsung berstatus <strong className="text-orange-700">Disetujui</strong> tanpa proses review.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink">Notifikasi Otomatis</p>
                      <p className="mt-0.5 text-[11px] text-muted leading-relaxed font-semibold">
                        Staff yang didaftarkan lembur akan menerima pemberitahuan instan via sistem.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink">Rekap Bulanan</p>
                      <p className="mt-0.5 text-[11px] text-muted leading-relaxed font-semibold">
                        Seluruh jam kerja lembur akan langsung diakumulasikan ke laporan CSV bulanan divisi.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Form */}
            <div className="lg:col-span-2">
              <FormLembur
                divisiSaya={data.divisiSaya}
                sesiId={sesi.id}
                sesiNama={sesi.nama}
                isOwnerOrAdmin={true}
              />
            </div>
          </>
        ) : (
          <div className="lg:col-span-3 mx-auto w-full max-w-3xl">
            <FormLembur
              divisiSaya={data.divisiSaya}
              sesiId={sesi.id}
              sesiNama={sesi.nama}
              isOwnerOrAdmin={false}
            />
          </div>
        )}

        {/* Riwayat Section (Bottom spanning all columns) */}
        <div className="lg:col-span-3 mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold tracking-[0.24em] text-muted">RIWAYAT PENGAJUAN</h3>
            <span className="rounded-full bg-cream-100 px-2.5 py-1 text-[10px] font-semibold text-muted shadow-sm">Terbaru dulu</span>
          </div>
          <DaftarLemburSaya daftarAwal={lemburSaya} />
        </div>
      </div>
    </div>
  )
}
