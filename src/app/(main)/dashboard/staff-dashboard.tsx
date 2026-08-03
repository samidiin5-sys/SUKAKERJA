'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ambilDetailDashboardStaff, type DetailDashboardStaff, type TaskDashboardItem } from './actions'
import type { DataShell } from '@/lib/shell-data'
import KartuTilt from '@/components/kartu-tilt'

// --- LIGHTWEIGHT UTILITIES ---

function CountUp({ value }: { value: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let start = 0
    const end = value
    if (start === end) {
      setCount(end)
      return
    }
    const duration = 1000 // 1 second
    const startTime = performance.now()

    function update(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const ease = progress * (2 - progress) // Ease out quad
      setCount(Math.floor(ease * (end - start) + start))
      if (progress < 1) {
        requestAnimationFrame(update)
      } else {
        setCount(end)
      }
    }
    requestAnimationFrame(update)
  }, [value])

  return <span>{count}</span>
}

function formatTanggalIndonesia(date: Date = new Date()): string {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function dapatkanSapaan(): string {
  const jam = new Date().getHours()
  if (jam >= 4 && jam < 11) return 'Selamat pagi'
  if (jam >= 11 && jam < 15) return 'Selamat siang'
  if (jam >= 15 && jam < 18) return 'Selamat sore'
  return 'Selamat malam'
}

function dapatkanSelisihWaktu(isoString: string): string {
  const sekarang = new Date()
  const target = new Date(isoString)
  
  // Set both to midnight locally to calculate the actual calendar day difference
  const d1 = new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate())
  const d2 = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  const diffMs = d2.getTime() - d1.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    const hariTerlambat = Math.abs(diffDays)
    return `Terlambat ${hariTerlambat} hari`
  }

  if (diffDays === 0) {
    const selisihMs = target.getTime() - sekarang.getTime()
    if (selisihMs < 0) {
      return 'Terlambat hari ini'
    }
    const jam = target.getHours().toString().padStart(2, '0')
    const menit = target.getMinutes().toString().padStart(2, '0')
    return `Hari ini · ${jam}:${menit}`
  }

  if (diffDays === 1) return 'Besok'
  return `${diffDays} hari lagi`
}

function dapatkanWaktuRelatifAktivitas(isoString: string): string {
  const sekarang = new Date()
  const dibuat = new Date(isoString)
  const selisihDetik = Math.floor((sekarang.getTime() - dibuat.getTime()) / 1000)

  if (selisihDetik < 60) return 'Baru saja'
  const selisihMenit = Math.floor(selisihDetik / 60)
  if (selisihMenit < 60) return `${selisihMenit} menit lalu`
  const selisihJam = Math.floor(selisihMenit / 60)
  if (selisihJam < 24) return `${selisihJam} jam lalu`
  const selisihHari = Math.floor(selisihJam / 24)
  if (selisihHari === 1) return 'Kemarin'
  return `${selisihHari} hari lalu`
}

// --- SVG ICONS ---

function IconTaskAktif() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )
}

function IconJatuhTempo() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function IconSelesai() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function IconTerlambat() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}

function IconChevronKanan() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-32 bg-cream-200/60 rounded-2xl"></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-cream-200/60 rounded-2xl"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-72 bg-cream-200/60 rounded-2xl"></div>
        </div>
        <div className="space-y-4">
          <div className="h-72 bg-cream-200/60 rounded-2xl"></div>
        </div>
      </div>
    </div>
  )
}

function ErrorState({ pesan, onRetry }: { pesan: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-red-200 bg-red-50 text-red-800">
      <IconTerlambat />
      <h4 className="font-bold text-base mt-2 mb-1">Gagal Memuat Data</h4>
      <p className="text-xs text-red-700 max-w-md mb-4">{pesan}</p>
      <button
        onClick={onRetry}
        className="rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition"
      >
        Coba Lagi
      </button>
    </div>
  )
}

function EmptyState({ pesan }: { pesan: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center rounded-2xl border border-dashed border-cream-200/80 bg-gradient-to-br from-white to-cream-50/30">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream-50 text-cream-400 mb-2.5 border border-cream-100 shadow-sm">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <p className="text-xs text-muted/95 font-semibold">{pesan}</p>
    </div>
  )
}

function BadgePrioritas({ prioritas }: { prioritas: string }) {
  const styles: Record<string, string> = {
    mendesak: 'bg-red-50 text-red-700 border-red-100',
    tinggi: 'bg-orange-50 text-orange-700 border-orange-100',
    sedang: 'bg-amber-50 text-amber-700 border-amber-100',
    rendah: 'bg-cream-50 text-muted border-cream-200',
  }
  const label: Record<string, string> = {
    mendesak: 'Urgent',
    tinggi: 'High',
    sedang: 'Medium',
    rendah: 'Low',
  }

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${styles[prioritas] ?? styles.sedang}`}>
      {label[prioritas] ?? prioritas}
    </span>
  )
}

// --- MAIN STAFF DASHBOARD COMPONENT ---

export default function StaffDashboard({ data }: { data: DataShell }) {
  const [detail, setDetail] = useState<DetailDashboardStaff | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const muatData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await ambilDetailDashboardStaff()
      setDetail(res)
    } catch (e: any) {
      setError(e.message || 'Gagal mengambil data dari server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    muatData()
  }, [])

  // 1. FILTER TUGAS HARI INI (HERO SECTION)
  const tugasHariIni = useMemo(() => {
    if (!detail) return []
    const sekarang = new Date()
    const d1 = new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate()).getTime()

    return detail.tugasSemua.filter((t) => {
      if (t.completedAt !== null || t.isCompletionBoard) return false
      if (!t.dueDate) return false
      
      const target = new Date(t.dueDate)
      const d2 = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime()
      const diffMs = d2 - d1
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
      
      // Only show tasks due today (diffDays === 0) or overdue (diffDays < 0).
      return diffDays <= 0
    })
  }, [detail])

  // 2. STATISTICS CALCULATIONS
  const totalSelesaiCount = useMemo(() => {
    if (!detail) return 0
    return detail.tugasSemua.filter(t => t.completedAt !== null || t.isCompletionBoard).length
  }, [detail])

  const statistikList = useMemo(() => {
    if (!detail) return []
    return [
      {
        label: 'Perlu Dikerjakan',
        nilai: detail.statistik.taskAktif,
        sub: 'Hari ini & terlambat',
        icon: <IconTaskAktif />,
        bgIcon: 'bg-maroon-50 text-maroon-800',
        borderColor: 'border-cream-200'
      },
      {
        label: 'Deadline Hari Ini',
        nilai: detail.statistik.jatuhTempoHariIni,
        sub: 'Perlu selesai hari ini',
        icon: <IconJatuhTempo />,
        bgIcon: 'bg-orange-50 text-orange-600',
        borderColor: 'border-orange-200'
      },
      {
        label: 'Task Selesai',
        nilai: totalSelesaiCount,
        sub: 'Selesai 30 hari terakhir',
        icon: <IconSelesai />,
        bgIcon: 'bg-green-50 text-green-600',
        borderColor: 'border-green-200'
      },
      {
        label: 'Task Terlambat',
        nilai: detail.statistik.terlambat,
        sub: 'Melewati batas tenggat',
        icon: <IconTerlambat />,
        bgIcon: 'bg-red-50 text-red-600',
        borderColor: 'border-red-200',
        isRed: detail.statistik.terlambat > 0
      }
    ]
  }, [detail, totalSelesaiCount])

  // 3. PROGRESS PER DIVISI
  const progressPerDivisi = useMemo(() => {
    if (!detail) return []
    const map: Record<string, { nama: string; total: number; selesai: number }> = {}
    detail.tugasSemua.forEach((t) => {
      if (!map[t.divisiNama]) {
        map[t.divisiNama] = { nama: t.divisiNama, total: 0, selesai: 0 }
      }
      map[t.divisiNama].total++
      if (t.completedAt !== null || t.isCompletionBoard) {
        map[t.divisiNama].selesai++
      }
    })
    return Object.values(map).map((p) => ({
      ...p,
      persentase: p.total > 0 ? Math.round((p.selesai / p.total) * 100) : 0,
    }))
  }, [detail])

  // 4. GET TIMELINE EMOJI & CLASSES FOR DEADLINES
  const dapatkanDeadlineStatus = (dueDate: string) => {
    const sekarang = new Date()
    const target = new Date(dueDate)
    
    const d1 = new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate()).getTime()
    const d2 = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime()
    
    const diffMs = d2 - d1
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return { emoji: '🔴', style: 'text-red-700 bg-red-50 border-red-200' }
    } else if (diffDays === 0) {
      const selisihMs = target.getTime() - sekarang.getTime()
      if (selisihMs < 0) {
        return { emoji: '🔴', style: 'text-red-700 bg-red-50 border-red-200' }
      }
      return { emoji: '🟠', style: 'text-orange-700 bg-orange-50 border-orange-200' }
    } else if (diffDays === 1) {
      return { emoji: '🟡', style: 'text-yellow-700 bg-yellow-50 border-yellow-200' }
    } else {
      return { emoji: '🟢', style: 'text-green-700 bg-green-50 border-green-200' }
    }
  }

  // 5. FIND FIRST ACTIVE TASK FOR CONTINUE ACTIONS
  const lastActiveTask = useMemo(() => {
    if (!detail) return null
    return detail.tugasSemua.find(t => t.completedAt === null && !t.isCompletionBoard)
  }, [detail])

  const lanjutkanHref = lastActiveTask 
    ? `/divisi/${lastActiveTask.divisiId}?task=${lastActiveTask.id}`
    : '/tugas-saya'

  if (loading) return <LoadingSkeleton />
  if (error || !detail) return <ErrorState pesan={error || 'Data kosong'} onRetry={muatData} />

  return (
    <div className="space-y-6">
      
      {/* 1. HERO SECTION: FOKUS HARI INI */}
      <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 p-6 text-white shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-maroon-500/10 blur-3xl" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-bold text-blue-200/70 uppercase tracking-widest">{dapatkanSapaan()}</span>
              <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">
                Halo, {data.nama.split(' ')[0]} 👋
              </h2>
              <p className="text-xs font-semibold text-slate-300 mt-1">{formatTanggalIndonesia()}</p>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-xs bg-white/10 border border-white/15 px-3 py-1.5 rounded-full inline-block font-semibold">
                🎯 Fokus Hari Ini
              </span>
            </div>
          </div>

          <div>
            {tugasHariIni.length === 0 ? (
              <div className="py-2 text-sm text-slate-300 leading-relaxed max-w-xl">
                ✨ Hebat! Tidak ada tugas mendesak atau yang jatuh tempo hari ini. Kamu bisa bersantai sejenak atau melanjutkan pekerjaan lainnya.
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-2">TUGAS HARI INI ({tugasHariIni.length})</p>
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1.5 custom-scrollbar">
                  {tugasHariIni.map((task) => {
                    const status = dapatkanDeadlineStatus(task.dueDate!)
                    return (
                      <div
                        key={task.id}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition duration-150"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <BadgePrioritas prioritas={task.prioritas} />
                            <span className={`text-[10px] font-bold rounded-full border px-2.5 py-0.5 ${status.style}`}>
                              {status.emoji} {task.dueDate ? dapatkanSelisihWaktu(task.dueDate) : ''}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-1.5 truncate">
                            {task.judul}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {task.divisiNama} • {task.boardNama}
                          </p>
                        </div>
                        <a
                          href={`/divisi/${task.divisiId}?task=${task.id}`}
                          className="w-full sm:w-auto text-center shrink-0 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 shadow-sm transition active:scale-95 cursor-pointer"
                        >
                          Mulai Kerjakan →
                        </a>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. STATISTIC CARDS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statistikList.map((card, idx) => (
          <KartuTilt
            key={idx}
            className={`rounded-2xl border p-4 shadow-sm bg-white transition duration-150 ${
              card.isRed ? 'bg-red-50/40 border-red-200' : card.borderColor
            }`}
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${card.bgIcon}`}>
              {card.icon}
            </div>
            <p className={`text-2xl sm:text-3xl font-black mt-3 ${card.isRed ? 'text-red-700' : 'text-ink'}`}>
              <CountUp value={card.nilai} />
            </p>
            <p className="text-[11px] font-bold text-muted mt-1 uppercase tracking-wider">{card.label}</p>
            <p className="text-[10px] text-muted/80 mt-0.5">{card.sub}</p>
          </KartuTilt>
        ))}
      </div>

      {/* 3. TWO-COLUMN GRID */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:items-start">
        
        {/* KOLOM KIRI (2/3): DEADLINE TERDEKAT & PROGRESS PEKERJAAN */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* DEADLINE TERDEKAT */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold tracking-widest text-muted uppercase">Deadline Terdekat</h3>
            <div className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm space-y-2">
              {detail.deadlineTerdekat.length === 0 ? (
                <EmptyState pesan="Bagus! Tidak ada deadline terdekat." />
              ) : (
                detail.deadlineTerdekat.map((t) => {
                  const status = dapatkanDeadlineStatus(t.dueDate!)
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-cream-50 bg-cream-50/20 hover:bg-cream-50/50 transition duration-150"
                    >
                      <div className="min-w-0 flex-1">
                        <a
                          href={`/divisi/${t.divisiId}?task=${t.id}`}
                          className="text-xs font-bold text-ink hover:text-orange-600 truncate block transition"
                        >
                          {t.judul}
                        </a>
                        <p className="text-[10px] text-muted mt-0.5">{t.divisiNama} • {t.boardNama}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-bold rounded-full border px-2.5 py-0.5 inline-block ${status.style}`}>
                          {status.emoji} {t.dueDate ? dapatkanSelisihWaktu(t.dueDate) : ''}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* PROGRESS PEKERJAAN */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-widest text-muted uppercase">Progress Pekerjaan</h3>
              {progressPerDivisi.length > 0 && (
                <span className="text-[10px] font-semibold text-muted">
                  {progressPerDivisi.reduce((a, b) => a + b.selesai, 0)}/{progressPerDivisi.reduce((a, b) => a + b.total, 0)} selesai
                </span>
              )}
            </div>
            <div className="rounded-2xl border border-cream-200 bg-white shadow-sm overflow-hidden">
              {progressPerDivisi.length === 0 ? (
                <div className="p-4">
                  <EmptyState pesan="Belum ada data tugas untuk menghitung progress." />
                </div>
              ) : (
                <div className="divide-y divide-cream-100">
                  {progressPerDivisi.map((p) => {
                    const isSelesai = p.persentase === 100
                    const isKritis = p.persentase < 30 && p.total > 0
                    const barColor = isSelesai
                      ? 'from-green-400 to-green-500'
                      : isKritis
                      ? 'from-red-400 to-red-500'
                      : 'from-orange-400 to-orange-500'
                    const badgeBg = isSelesai
                      ? 'bg-green-50 text-green-700'
                      : isKritis
                      ? 'bg-red-50 text-red-600'
                      : 'bg-orange-50 text-orange-600'

                    return (
                      <div key={p.nama} className="px-4 py-3.5 hover:bg-cream-50/40 transition">
                        <div className="flex items-center justify-between gap-3 mb-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`h-2 w-2 rounded-full flex-shrink-0 ${isSelesai ? 'bg-green-500' : isKritis ? 'bg-red-500' : 'bg-orange-500'}`} />
                            <p className="text-sm font-bold text-ink truncate">{p.nama}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-muted font-medium">{p.selesai}/{p.total}</span>
                            <span className={`text-xs font-black rounded-full px-2 py-0.5 ${badgeBg}`}>
                              {p.persentase}%
                            </span>
                          </div>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-cream-200">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`}
                            style={{ width: `${p.persentase}%` }}
                          />
                        </div>
                        {isSelesai && (
                          <p className="text-[10px] text-green-600 font-semibold mt-1.5">✓ Semua tugas selesai!</p>
                        )}
                        {isKritis && (
                          <p className="text-[10px] text-red-500 font-semibold mt-1.5">⚠ Progress rendah — perlu perhatian</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* KOLOM KANAN (1/3): QUICK ACTIONS & AKTIVITAS TERBARU */}
        <div className="space-y-5">
          
          {/* QUICK ACTIONS */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold tracking-widest text-muted uppercase">Aksi Cepat</h3>
            <div className="grid grid-cols-1 gap-2.5">
              
              {/* Lanjutkan Task */}
              <a
                href={lanjutkanHref}
                className="flex items-center gap-3.5 rounded-2xl border border-cream-200 bg-white px-4 py-3.5 shadow-sm hover:border-orange-200 hover:bg-orange-50/10 transition duration-150 group"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-100 shrink-0">
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-ink leading-snug">Lanjutkan Task</p>
                  <p className="text-[10px] text-muted mt-0.5 leading-none truncate">
                    {lastActiveTask ? lastActiveTask.judul : 'Belum ada task aktif'}
                  </p>
                </div>
                <span className="text-muted group-hover:text-ink transition-transform duration-150 group-hover:translate-x-1 shrink-0">
                  <IconChevronKanan />
                </span>
              </a>

              {/* Upload Hasil */}
              <a
                href="/tugas-saya"
                className="flex items-center gap-3.5 rounded-2xl border border-cream-200 bg-white px-4 py-3.5 shadow-sm hover:border-orange-200 hover:bg-orange-50/10 transition duration-150 group"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-maroon-50 text-maroon-800 group-hover:bg-maroon-100 shrink-0">
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-ink leading-snug">Upload Hasil</p>
                  <p className="text-[10px] text-muted mt-0.5 leading-none">Kirim laporan penyelesaian task</p>
                </div>
                <span className="text-muted group-hover:text-ink transition-transform duration-150 group-hover:translate-x-1 shrink-0">
                  <IconChevronKanan />
                </span>
              </a>

              {/* Lihat Kalender */}
              <a
                href="/tugas-saya?view=kalender"
                className="flex items-center gap-3.5 rounded-2xl border border-cream-200 bg-white px-4 py-3.5 shadow-sm hover:border-orange-200 hover:bg-orange-50/10 transition duration-150 group"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 shrink-0">
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-ink leading-snug">Lihat Kalender</p>
                  <p className="text-[10px] text-muted mt-0.5 leading-none">Cek jadwal tenggat tugas</p>
                </div>
                <span className="text-muted group-hover:text-ink transition-transform duration-150 group-hover:translate-x-1 shrink-0">
                  <IconChevronKanan />
                </span>
              </a>

              {/* Lihat Semua Task */}
              <a
                href="/tugas-saya"
                className="flex items-center gap-3.5 rounded-2xl border border-cream-200 bg-white px-4 py-3.5 shadow-sm hover:border-orange-200 hover:bg-orange-50/10 transition duration-150 group"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cream-100 text-muted group-hover:bg-cream-200 shrink-0">
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-ink leading-snug">Lihat Semua Task</p>
                  <p className="text-[10px] text-muted mt-0.5 leading-none">Daftar lengkap seluruh tugas</p>
                </div>
                <span className="text-muted group-hover:text-ink transition-transform duration-150 group-hover:translate-x-1 shrink-0">
                  <IconChevronKanan />
                </span>
              </a>

            </div>
          </div>

          {/* AKTIVITAS TERBARU */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold tracking-widest text-muted uppercase">Aktivitas Terbaru</h3>
            <div className="rounded-2xl border border-cream-200 bg-white p-4.5 shadow-sm">
              {detail.aktivitas.length === 0 ? (
                <EmptyState pesan="Belum ada aktivitas baru." />
              ) : (
                <div className="relative border-l border-cream-200 pl-4 space-y-4">
                  {detail.aktivitas.map((act) => (
                    <div key={act.id} className="relative text-xs">
                      {/* Timeline dot */}
                      <span className="absolute -left-[23px] top-1 flex h-2 w-2 items-center justify-center rounded-full bg-orange-400 ring-4 ring-white" />
                      
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="text-ink font-medium leading-relaxed">
                            <span className="font-bold text-maroon-800">{act.actorNama}</span>{' '}
                            {act.jenis === 'task_dibuat' && 'membuat tugas'}
                            {act.jenis === 'task_diubah' && 'mengubah tugas'}
                            {act.jenis === 'task_dipindah' && 'memindahkan tugas'}
                            {act.jenis === 'task_selesai' && 'menyelesaikan tugas'}
                            {act.jenis === 'task_dihapus' && 'menghapus tugas'}
                            {act.jenis === 'komentar_ditambah' && 'menambahkan komentar pada'}
                            {act.jenis === 'lampiran_ditambah' && 'mengunggah lampiran untuk'}
                            {act.jenis === 'template_dibuat' && 'membuat template tugas'}
                            {!['task_dibuat','task_diubah','task_dipindah','task_selesai','task_dihapus','komentar_ditambah','lampiran_ditambah','template_dibuat'].includes(act.jenis) && 'melakukan aktivitas pada'}{' '}
                            <span className="font-bold text-ink">{act.objekNama}</span>
                          </p>
                          <p className="text-[9px] text-muted mt-0.5">{dapatkanWaktuRelatifAktivitas(act.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
