'use client'

import type { RiwayatBonus } from '@/lib/bonus/bonus-service'

export default function RiwayatBonusView({ riwayat }: { riwayat: RiwayatBonus[] }) {
  if (riwayat.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm font-semibold text-muted">Belum ada riwayat tugas berbonus untuk Anda.</p>
      </div>
    )
  }

  const STYLE_STATUS = {
    'Menunggu Approval': 'bg-orange-100 text-orange-800',
    'Bonus Masuk': 'bg-green-100 text-green-800',
    'Ditolak': 'bg-red-100 text-red-800',
    'Belum Selesai': 'bg-cream-100 text-muted'
  }
  const ICON_STATUS = {
    'Menunggu Approval': '🟡',
    'Bonus Masuk': '🟢',
    'Ditolak': '🔴',
    'Belum Selesai': '⚪'
  }

  return (
    <div className="divide-y divide-cream-100">
      {riwayat.map((item) => (
        <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 transition hover:bg-cream-50/50">
          <div className="flex-1">
            <h4 className="text-base font-bold text-ink leading-snug">{item.namaTask}</h4>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-semibold text-muted">
              <span>{new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              {item.approverName && (
                <>
                  <span>&bull;</span>
                  <span>Disetujui oleh <span className="text-ink">{item.approverName}</span></span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center gap-2">
            <span className="text-lg font-black text-green-700">
              Rp{item.nominal.toLocaleString('id-ID')}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${STYLE_STATUS[item.status]}`}>
              <span>{ICON_STATUS[item.status]}</span>
              {item.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
