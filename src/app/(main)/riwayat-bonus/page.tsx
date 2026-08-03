import { Suspense } from 'react'
import { ambilSesiPengguna } from '@/lib/auth/otorisasi'
import { hitungSaldoBonusStaff, ambilRiwayatBonusStaff } from '@/lib/bonus/bonus-service'
import RiwayatBonusView from './riwayat-bonus-view'

export const dynamic = 'force-dynamic'

export default async function HalamanRiwayatBonus() {
  const sesi = await ambilSesiPengguna()

  const [totalBonus, riwayat] = await Promise.all([
    hitungSaldoBonusStaff(sesi.id),
    ambilRiwayatBonusStaff(sesi.id),
  ])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-6 shadow-sm">
        <h2 className="text-sm font-bold tracking-wider text-green-800 uppercase">Total Bonus Diterima</h2>
        <p className="mt-2 text-4xl font-black text-green-900">
          Rp{totalBonus.toLocaleString('id-ID')}
        </p>
        <p className="mt-2 text-xs font-semibold text-green-700/80">
          Total bonus yang berhasil Anda kumpulkan dari penyelesaian tugas-tugas.
        </p>
      </div>

      <div className="rounded-2xl border border-cream-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-cream-100 px-6 py-4">
          <h3 className="text-lg font-black text-maroon-800">Riwayat Tugas Berbonus</h3>
        </div>
        <Suspense fallback={<p className="p-6 text-sm text-muted">Memuat riwayat...</p>}>
          <RiwayatBonusView riwayat={riwayat} />
        </Suspense>
      </div>
    </div>
  )
}
