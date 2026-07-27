'use client'

import dynamic from 'next/dynamic'
import KartuTilt from './kartu-tilt'

const KebabHero = dynamic(() => import('./kebab-hero'), { ssr: false })

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-stretch bg-cream-100">
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-maroon-950 via-maroon-800 to-maroon-700 p-12 text-cream-50 lg:flex lg:flex-col lg:justify-between">
        <KebabHero />

        <div className="relative z-10">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cream-50 text-lg font-black text-maroon-800 shadow-sm">
              SK
            </div>
            <div>
              <p className="text-lg font-black tracking-tight">SUKAKERJA</p>
              <p className="text-xs font-semibold tracking-widest text-orange-400">
                PORTAL KARYAWAN
              </p>
            </div>
          </div>

          <h1 className="text-4xl font-black leading-tight tracking-tight">
            Satu Tempat untuk
          </h1>
          <h1 className="mb-6 text-4xl font-black leading-tight tracking-tight text-orange-400">
            Semua Tugas Tim
          </h1>

          <p className="max-w-sm text-sm leading-relaxed text-cream-200/80">
            SukaKerja membantu tim kamu membagi tugas, memantau tenggat,
            dan melihat progres pekerjaan — semua dalam satu portal kantor
            tanpa perlu bolak-balik grup chat.
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          <FiturItem
            judul="Satu Akun untuk Semua Divisi"
            deskripsi="Login sekali, akses seluruh papan tugas divisi tempat kamu tergabung."
          />
          <FiturItem
            judul="Progres Real-Time"
            deskripsi="Atasan melihat pekerjaan selesai tanpa perlu menagih satu per satu."
          />
        </div>

        <div className="relative z-10 mt-10 flex items-center justify-between border-t border-cream-50/10 pt-4 text-xs text-cream-200/60">
          <span>SukaKerja &middot; 2026</span>
          <span>Portal Internal Kantor</span>
        </div>
      </div>

      {/* Mobile: tampilkan logo minimal di atas form */}
      <div className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2">
        <div className="mb-6 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-maroon-800 text-sm font-black text-cream-50">
            SK
          </div>
          <div>
            <p className="text-sm font-black tracking-tight text-ink">SUKAKERJA</p>
            <p className="text-[10px] font-semibold tracking-widest text-muted">PORTAL KARYAWAN</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

function FiturItem({ judul, deskripsi }: { judul: string; deskripsi: string }) {
  return (
    <KartuTilt className="rounded-xl bg-cream-50/5 p-4" tiltDegree={6} perspective={500}>
      <p className="text-sm font-bold text-cream-50">{judul}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-cream-200/70">{deskripsi}</p>
    </KartuTilt>
  )
}
