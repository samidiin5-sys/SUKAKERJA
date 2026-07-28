'use client'

import { useState } from 'react'
import type { TugasSaya, TaskKalenderSaya } from './actions'
import DaftarTugasSaya from './daftar-tugas-saya'
import KalenderSaya from './kalender-saya'

export default function TugasSayaView({
  tugasAwal,
  tasksKalenderAwal,
  awalMingguIso,
}: {
  tugasAwal: TugasSaya[]
  tasksKalenderAwal: TaskKalenderSaya[]
  awalMingguIso: string
}) {
  const [view, setView] = useState<'daftar' | 'kalender'>('daftar')

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-maroon-800">Tugas Saya</h2>
          <p className="text-sm text-muted">Semua tugas yang ditugaskan ke kamu.</p>
        </div>
        <div className="flex rounded-xl border border-cream-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setView('daftar')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${view === 'daftar' ? 'bg-maroon-800 text-white shadow-sm' : 'text-muted hover:text-ink'}`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
            Daftar
          </button>
          <button
            onClick={() => setView('kalender')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${view === 'kalender' ? 'bg-maroon-800 text-white shadow-sm' : 'text-muted hover:text-ink'}`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            Kalender
          </button>
        </div>
      </div>

      {view === 'daftar' ? (
        <DaftarTugasSaya tugasAwal={tugasAwal} />
      ) : (
        <KalenderSaya tasksAwal={tasksKalenderAwal} awalMingguIso={awalMingguIso} />
      )}
    </div>
  )
}
