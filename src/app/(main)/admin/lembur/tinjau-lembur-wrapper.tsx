'use client'

import { useState } from 'react'
import TinjauLembur from './tinjau-lembur'
import RiwayatLemburAdmin from './riwayat-lembur-admin'
import type { LemburMenunggu, RiwayatLemburAdminItem } from '@/app/(main)/lembur/actions'

type Props = {
  daftarMenungguInitial: LemburMenunggu[]
  karyawanAktif: { id: string; nama: string }[]
  riwayatInitial: RiwayatLemburAdminItem[]
}

export default function TinjauLemburWrapper({
  daftarMenungguInitial,
  karyawanAktif,
  riwayatInitial,
}: Props) {
  const [activeTab, setActiveTab] = useState<'tinjau' | 'riwayat'>('tinjau')
  
  // Hitung jumlah pengajuan yang membutuhkan persetujuan
  const pendingCount = daftarMenungguInitial.length

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex border-b border-cream-200">
        <button
          onClick={() => setActiveTab('tinjau')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition cursor-pointer ${
            activeTab === 'tinjau'
              ? 'border-maroon-800 text-maroon-800 font-extrabold'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          <span>Menunggu Persetujuan</span>
          {pendingCount > 0 && (
            <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-black text-white">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('riwayat')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition cursor-pointer ${
            activeTab === 'riwayat'
              ? 'border-maroon-800 text-maroon-800 font-extrabold'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          Riwayat Lembur Karyawan
        </button>
      </div>

      {/* Tab Contents */}
      <div className="transition-all duration-350">
        {activeTab === 'tinjau' ? (
          <TinjauLembur daftarAwal={daftarMenungguInitial} />
        ) : (
          <RiwayatLemburAdmin karyawanAktif={karyawanAktif} riwayatAwal={riwayatInitial} />
        )}
      </div>
    </div>
  )
}
