'use client'

import { useState } from 'react'
import PapanDivisi from '../../papan-divisi'
import HistoriTugasView from './histori-tugas-view'
import type { BoardDenganTask, AnggotaDivisi, TaskHistori } from '../../actions'

export default function PantauStaffTabs({
  divisionId,
  boardsAwal,
  anggota,
  currentUserId,
  defaultAssigneeId,
  pantauNama,
  histori,
}: {
  divisionId: string
  boardsAwal: BoardDenganTask[]
  anggota: AnggotaDivisi[]
  currentUserId: string
  defaultAssigneeId: string
  pantauNama: string
  histori: TaskHistori[]
}) {
  const [tab, setTab] = useState<'papan' | 'histori'>('papan')

  return (
    <div className="space-y-6">
      {/* Tab Selector */}
      <div className="flex border-b border-cream-200 bg-white px-4 pt-1 rounded-t-2xl shadow-sm border-t border-x">
        <button
          onClick={() => setTab('papan')}
          className={`px-4 py-3.5 text-xs font-black uppercase tracking-wider transition-all border-b-2 -mb-px flex items-center gap-2 cursor-pointer ${
            tab === 'papan'
              ? 'border-maroon-800 text-maroon-800'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="3" width="7" height="9" />
            <rect x="14" y="3" width="7" height="5" />
            <rect x="14" y="12" width="7" height="9" />
            <rect x="3" y="16" width="7" height="5" />
          </svg>
          Papan Kerja Aktif
        </button>
        <button
          onClick={() => setTab('histori')}
          className={`px-4 py-3.5 text-xs font-black uppercase tracking-wider transition-all border-b-2 -mb-px flex items-center gap-2 cursor-pointer ${
            tab === 'histori'
              ? 'border-maroon-800 text-maroon-800'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 8v4l3 3" />
            <circle cx="12" cy="12" r="10" />
          </svg>
          Histori Tugas Selesai
          <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-black ${
            tab === 'histori' ? 'bg-maroon-100 text-maroon-800' : 'bg-cream-100 text-muted'
          }`}>
            {histori.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="transition-all duration-300">
        {tab === 'papan' ? (
          <PapanDivisi
            divisionId={divisionId}
            boardsAwal={boardsAwal}
            anggota={anggota}
            bolehReorderBoard={true}
            bolehTambahTask={true}
            bolehKelola={true}
            bolehKirimTugas={false}
            currentUserId={currentUserId}
            isStaff={false}
            defaultAssigneeId={defaultAssigneeId}
            pantauNama={pantauNama}
          />
        ) : (
          <HistoriTugasView historiAwal={histori} />
        )}
      </div>
    </div>
  )
}
