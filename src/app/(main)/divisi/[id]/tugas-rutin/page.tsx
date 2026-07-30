import Link from 'next/link'
import { redirect } from 'next/navigation'
import { pastikanAnggotaDivisi } from '@/lib/auth/otorisasi'
import { ambilAnggotaDivisi, ambilDetailDivisi } from '../actions'
import { ambilTemplates } from './actions'
import DaftarTemplate from './daftar-template'

export default async function HalamanTugasRutin({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let sesi
  try {
    sesi = await pastikanAnggotaDivisi(id)
  } catch {
    redirect('/dashboard')
  }

  const divisi = await ambilDetailDivisi(id)
  if (!divisi) {
    redirect('/dashboard')
  }

  const [templates, anggota] = await Promise.all([
    ambilTemplates(id),
    ambilAnggotaDivisi(id),
  ])

  const bolehKelola = sesi.roleSistem === 'super_admin' || sesi.roleSistem === 'owner'

  return (
    <div className="mx-auto w-full max-w-6xl">
      <Link
        href={`/divisi/${id}`}
        className="mb-4 inline-flex items-center gap-1 text-xs font-bold text-maroon-700 hover:text-maroon-900 transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Kembali ke Papan {divisi.nama}
      </Link>

      {/* Header section */}
      <div className="mb-5 rounded-[24px] border border-cream-200 bg-white p-5 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">Otomatisasi Pekerjaan</p>
        <h2 className="mt-1 text-lg font-black text-maroon-800">Tugas Rutin — {divisi.nama}</h2>
        <p className="mt-1 text-sm text-muted">
          Template tugas yang dibuat secara otomatis sesuai jadwal berulang.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Guidelines / Kebijakan */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-[24px] border border-cream-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-xs font-bold tracking-widest text-muted uppercase">Ketentuan Tugas Rutin</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-ink">Jadwal Berulang</p>
                  <p className="mt-0.5 text-[11px] text-muted leading-relaxed font-semibold">
                    Tugas akan digenerate secara otomatis pada kolom papan yang dituju sesuai pola pengulangan (Harian, Mingguan, atau Bulanan).
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-ink">Pembuat Template</p>
                  <p className="mt-0.5 text-[11px] text-muted leading-relaxed font-semibold">
                    Setiap tugas rutin otomatis dibuat atas nama pembuat template, dengan staff/assignee yang telah ditetapkan di template.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-ink">Jalankan Instan</p>
                  <p className="mt-0.5 text-[11px] text-muted leading-relaxed font-semibold">
                    Gunakan tombol "Jalankan Sekarang" untuk memicu pembuatan tugas secara manual saat ini juga tanpa perlu menunggu waktu cron-job.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Templates List / Create Form */}
        <div className="lg:col-span-2">
          <DaftarTemplate
            divisionId={id}
            templatesAwal={templates}
            anggota={anggota}
            bolehKelola={bolehKelola}
          />
        </div>
      </div>
    </div>
  )
}
