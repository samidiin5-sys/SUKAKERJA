'use client'

import { useState, useCallback } from 'react'
import { ambilTaskKalenderSaya, type TaskKalenderSaya } from './actions'

const HARI = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const WARNA_PRIORITAS: Record<string, string> = {
  mendesak: 'bg-red-100 text-red-700 border-red-200',
  tinggi: 'bg-orange-100 text-orange-700 border-orange-200',
  sedang: 'bg-maroon-50 text-maroon-700 border-maroon-100',
  rendah: 'bg-cream-100 text-muted border-cream-200',
}

function mulaiMinggu(d: Date): Date {
  const x = new Date(d)
  const hari = (x.getDay() + 6) % 7
  x.setDate(x.getDate() - hari)
  x.setHours(0, 0, 0, 0)
  return x
}

function formatLokal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatJam(iso: string): string {
  const d = new Date(iso)
  if (d.getHours() === 0 && d.getMinutes() === 0) return ''
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function isHariIni(d: Date): boolean {
  return formatLokal(d) === formatLokal(new Date())
}

export default function KalenderSaya({ tasksAwal, awalMingguIso }: { tasksAwal: TaskKalenderSaya[]; awalMingguIso: string }) {
  const [mode, setMode] = useState<'minggu' | 'bulan'>('minggu')
  const [awalMinggu, setAwalMinggu] = useState(() => new Date(awalMingguIso))
  const [bulanSaat, setBulanSaat] = useState(() => { const d = new Date(awalMingguIso); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [tasks, setTasks] = useState<TaskKalenderSaya[]>(tasksAwal)
  const [sedangMuat, setSedangMuat] = useState(false)
  const [dipilih, setDipilih] = useState<TaskKalenderSaya | null>(null)

  const muat = useCallback(async (mulai: Date, selesai: Date) => {
    setSedangMuat(true)
    const data = await ambilTaskKalenderSaya(mulai.toISOString(), selesai.toISOString())
    setTasks(data)
    setSedangMuat(false)
  }, [])

  function naviMinggu(arah: -1 | 1) {
    const baru = new Date(awalMinggu)
    baru.setDate(baru.getDate() + arah * 7)
    setAwalMinggu(baru)
    const selesai = new Date(baru); selesai.setDate(baru.getDate() + 6); selesai.setHours(23, 59, 59, 999)
    muat(baru, selesai)
  }

  function naviBulan(arah: -1 | 1) {
    const baru = new Date(bulanSaat.getFullYear(), bulanSaat.getMonth() + arah, 1)
    setBulanSaat(baru)
    const selesai = new Date(baru.getFullYear(), baru.getMonth() + 1, 0, 23, 59, 59, 999)
    muat(baru, selesai)
  }

  function hariIni() {
    if (mode === 'minggu') {
      const baru = mulaiMinggu(new Date()); setAwalMinggu(baru)
      const selesai = new Date(baru); selesai.setDate(baru.getDate() + 6); selesai.setHours(23, 59, 59, 999)
      muat(baru, selesai)
    } else {
      const s = new Date(); const baru = new Date(s.getFullYear(), s.getMonth(), 1); setBulanSaat(baru)
      const selesai = new Date(baru.getFullYear(), baru.getMonth() + 1, 0, 23, 59, 59, 999)
      muat(baru, selesai)
    }
  }

  const hariMingguArr = Array.from({ length: 7 }, (_, i) => { const d = new Date(awalMinggu); d.setDate(awalMinggu.getDate() + i); return d })
  const akhirMinggu = hariMingguArr[6]
  const labelMinggu = awalMinggu.getMonth() === akhirMinggu.getMonth()
    ? `${awalMinggu.getDate()}–${akhirMinggu.getDate()} ${BULAN[awalMinggu.getMonth()]} ${awalMinggu.getFullYear()}`
    : `${awalMinggu.getDate()} ${BULAN[awalMinggu.getMonth()]} – ${akhirMinggu.getDate()} ${BULAN[akhirMinggu.getMonth()]} ${akhirMinggu.getFullYear()}`

  const hariDalamBulan = (() => {
    const tahun = bulanSaat.getFullYear(); const bulan = bulanSaat.getMonth()
    const awal = new Date(tahun, bulan, 1); const akhir = new Date(tahun, bulan + 1, 0)
    const offset = (awal.getDay() + 6) % 7
    const arr: (Date | null)[] = []
    for (let i = 0; i < offset; i++) arr.push(null)
    for (let i = 1; i <= akhir.getDate(); i++) arr.push(new Date(tahun, bulan, i))
    while (arr.length % 7 !== 0) arr.push(null)
    return arr
  })()

  function taskHari(d: Date) { return tasks.filter((t) => formatLokal(new Date(t.dueDate)) === formatLokal(d)) }

  return (
    <div>
      {/* Modal detail */}
      {dipilih && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setDipilih(null)}>
          <div className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap gap-1.5">
                  <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold capitalize ${WARNA_PRIORITAS[dipilih.prioritas] ?? ''}`}>{dipilih.prioritas}</span>
                  <span className="rounded bg-cream-100 px-1.5 py-0.5 text-[10px] text-muted">{dipilih.divisiNama} · {dipilih.boardNama}</span>
                </div>
                <h3 className={`mt-2 text-base font-black text-maroon-800 ${dipilih.completedAt ? 'line-through opacity-60' : ''}`}>{dipilih.judul}</h3>
                <p className="mt-1 text-xs text-muted">
                  {new Date(dipilih.dueDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  {formatJam(dipilih.dueDate) ? ` · ${formatJam(dipilih.dueDate)}` : ''}
                </p>
              </div>
              <button onClick={() => setDipilih(null)} className="text-muted hover:text-ink">✕</button>
            </div>
            {dipilih.completedAt && (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                ✓ Selesai · {new Date(dipilih.completedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            )}
            <a href={`/divisi/${dipilih.divisiId}`} onClick={() => setDipilih(null)}
              className="block w-full rounded-xl bg-maroon-800 py-2.5 text-center text-sm font-bold text-white hover:bg-maroon-700">
              Lihat di Papan Divisi
            </a>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button onClick={() => mode === 'minggu' ? naviMinggu(-1) : naviBulan(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-cream-200 bg-white text-muted hover:bg-cream-50">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <span className="min-w-[140px] text-center text-sm font-bold text-maroon-800">
          {mode === 'minggu' ? labelMinggu : `${BULAN[bulanSaat.getMonth()]} ${bulanSaat.getFullYear()}`}
        </span>
        <button onClick={() => mode === 'minggu' ? naviMinggu(1) : naviBulan(1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-cream-200 bg-white text-muted hover:bg-cream-50">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
        </button>
        <button onClick={hariIni}
          className="rounded-lg border border-cream-200 bg-white px-3 py-1.5 text-xs font-bold text-muted hover:bg-cream-50">
          Hari Ini
        </button>
        <div className="flex rounded-lg border border-cream-200 bg-white p-0.5">
          <button onClick={() => { setMode('minggu'); const b = mulaiMinggu(new Date(bulanSaat.getFullYear(), bulanSaat.getMonth(), 1)); setAwalMinggu(b); const s = new Date(b); s.setDate(b.getDate() + 6); s.setHours(23, 59, 59, 999); muat(b, s) }}
            className={`rounded-md px-3 py-1 text-xs font-bold transition ${mode === 'minggu' ? 'bg-maroon-800 text-white' : 'text-muted hover:bg-cream-50'}`}>
            Minggu
          </button>
          <button onClick={() => { setMode('bulan'); const b = new Date(awalMinggu.getFullYear(), awalMinggu.getMonth(), 1); setBulanSaat(b); const s = new Date(b.getFullYear(), b.getMonth() + 1, 0, 23, 59, 59, 999); muat(b, s) }}
            className={`rounded-md px-3 py-1 text-xs font-bold transition ${mode === 'bulan' ? 'bg-maroon-800 text-white' : 'text-muted hover:bg-cream-50'}`}>
            Bulan
          </button>
        </div>
        {sedangMuat && <span className="text-xs text-muted animate-pulse">Memuat...</span>}
      </div>

      {/* View Mingguan */}
      {mode === 'minggu' && (
        <div className="overflow-x-auto rounded-2xl border border-cream-200 bg-white">
          <div className="grid min-w-[560px]" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {hariMingguArr.map((d, i) => (
              <div key={i} className={`border-r border-cream-200 last:border-r-0 ${isHariIni(d) ? 'bg-maroon-800' : 'bg-cream-50'}`}>
                <div className={`border-b border-cream-200 px-2 py-2 text-center ${isHariIni(d) ? 'border-maroon-700' : ''}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${isHariIni(d) ? 'text-cream-200' : 'text-muted'}`}>{HARI[i]}</p>
                  <p className={`text-lg font-black ${isHariIni(d) ? 'text-white' : 'text-ink'}`}>{d.getDate()}</p>
                </div>
                <div className="min-h-[120px] space-y-1 p-1.5">
                  {taskHari(d).map((t) => (
                    <button key={t.id} onClick={() => setDipilih(t)}
                      className={`w-full rounded-lg border p-1.5 text-left transition hover:shadow-sm ${t.completedAt ? 'border-emerald-200 bg-emerald-50 opacity-70' : 'border-cream-200 bg-white hover:border-orange-300'}`}>
                      <p className={`text-[11px] font-semibold leading-tight ${t.completedAt ? 'line-through text-muted' : 'text-ink'}`}>{t.judul}</p>
                      {formatJam(t.dueDate) && <p className="mt-0.5 text-[9px] text-muted">{formatJam(t.dueDate)}</p>}
                      <span className={`mt-1 inline-block rounded border px-1 py-0.5 text-[9px] font-bold capitalize ${WARNA_PRIORITAS[t.prioritas] ?? ''}`}>{t.prioritas}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Bulanan */}
      {mode === 'bulan' && (
        <div className="overflow-x-auto rounded-2xl border border-cream-200 bg-white">
          <div className="grid min-w-[560px]" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {HARI.map((h) => (
              <div key={h} className="border-b border-r border-cream-200 bg-cream-50 px-2 py-1.5 text-center last:border-r-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{h}</p>
              </div>
            ))}
            {hariDalamBulan.map((d, i) => (
              <div key={i} className={`min-h-[80px] border-b border-r border-cream-200 p-1 last:border-r-0 ${d && isHariIni(d) ? 'bg-orange-50' : ''}`}>
                {d && (
                  <>
                    <p className={`mb-1 text-xs font-bold ${isHariIni(d) ? 'text-orange-600' : 'text-muted'}`}>{d.getDate()}</p>
                    <div className="space-y-0.5">
                      {taskHari(d).slice(0, 3).map((t) => (
                        <button key={t.id} onClick={() => setDipilih(t)}
                          className={`w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-semibold ${t.completedAt ? 'bg-emerald-100 text-emerald-700' : 'bg-maroon-50 text-maroon-800 hover:bg-maroon-100'}`}>
                          {t.judul}
                        </button>
                      ))}
                      {taskHari(d).length > 3 && (
                        <p className="text-[9px] text-muted">+{taskHari(d).length - 3} lagi</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-[11px] text-muted"><span className="h-2 w-2 rounded-full bg-emerald-400" />Selesai</span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted"><span className="h-2 w-2 rounded-full bg-orange-400" />Hari ini</span>
      </div>
    </div>
  )
}
