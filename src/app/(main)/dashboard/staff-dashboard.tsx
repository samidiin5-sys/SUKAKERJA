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
  const selisihMs = target.getTime() - sekarang.getTime()
  const selisihHari = Math.ceil(selisihMs / (1000 * 60 * 60 * 24))

  if (selisihMs < 0) {
    const hariTerlambat = Math.abs(Math.floor(selisihMs / (1000 * 60 * 60 * 24)))
    return hariTerlambat === 0 ? 'Terlambat hari ini' : `Terlambat ${hariTerlambat} hari`
  }

  if (selisihHari === 0) return 'Hari ini'
  if (selisihHari === 1) return 'Besok'
  return `${selisihHari} hari lagi`
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

// Reused simple check icon
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

// --- SUB-COMPONENTS ---

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
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-2xl border border-dashed border-cream-200/80 bg-gradient-to-br from-white to-cream-50/30 shadow-inner">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cream-50 text-cream-400 mb-3 border border-cream-100 shadow-sm transition-transform duration-300 hover:scale-105">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <p className="text-xs text-muted/95 font-semibold tracking-wide">{pesan}</p>
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

function BadgeStatus({ status, terlambat }: { status: string; terlambat: boolean }) {
  if (terlambat) {
    return <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-700 border border-red-200">Terlambat</span>
  }

  const styles: Record<string, string> = {
    'Selesai': 'bg-green-50 text-green-700 border-green-200',
    'Review': 'bg-blue-50 text-blue-700 border-blue-200',
    'Dikerjakan': 'bg-orange-50 text-orange-700 border-orange-200',
    'To Do': 'bg-cream-50 text-muted border-cream-200',
  }

  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${styles[status] ?? 'bg-cream-50 text-muted border-cream-200'}`}>
      {status}
    </span>
  )
}

// --- MAIN STAFF DASHBOARD COMPONENT ---

export default function StaffDashboard({ data }: { data: DataShell }) {
  const [detail, setDetail] = useState<DetailDashboardStaff | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [progressPeriod, setProgressPeriod] = useState<'week' | 'month'>('week')

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

  // hitung progress data berdasarkan filter periode
  const progressData = useMemo(() => {
    if (!detail) return { total: 0, selesai: 0, dikerjakan: 0, belumMulai: 0, persentase: 0 }

    const sekarang = new Date()
    const awalHariIni = new Date(sekarang)
    awalHariIni.setHours(0, 0, 0, 0)
    const threshold = new Date(awalHariIni)

    if (progressPeriod === 'week') {
      threshold.setDate(threshold.getDate() - 6)
    } else {
      threshold.setDate(threshold.getDate() - 29)
    }

    const filtered = detail.tugasSemua.filter(t => {
      if (t.completedAt === null) return true
      return new Date(t.completedAt) >= threshold
    })

    const selesai = filtered.filter(t => t.completedAt !== null || t.isCompletionBoard || t.boardNama.toLowerCase().includes('review')).length
    const dikerjakan = filtered.filter(t => t.completedAt === null && !t.isCompletionBoard && !t.boardNama.toLowerCase().includes('review') && !t.boardNama.toLowerCase().includes('to do') && !t.boardNama.toLowerCase().includes('belum dimulai')).length
    const belumMulai = filtered.length - selesai - dikerjakan

    const totalProgress = filtered.reduce((acc, t) => {
      if (t.completedAt !== null || t.isCompletionBoard || t.boardNama.toLowerCase().includes('review')) {
        return acc + 100
      }
      if (t.boardNama.toLowerCase().includes('to do') || t.boardNama.toLowerCase().includes('belum dimulai')) {
        return acc + 0
      }
      if (t.checklistTotal > 0) {
        return acc + (t.checklistSelesai / t.checklistTotal) * 100
      }
      return acc + 50
    }, 0)
    const persentase = filtered.length > 0 ? Math.round(totalProgress / filtered.length) : 0

    return {
      total: filtered.length,
      selesai,
      dikerjakan,
      belumMulai,
      persentase
    }
  }, [detail, progressPeriod])

  if (loading) return <LoadingSkeleton />
  if (error || !detail) return <ErrorState pesan={error || 'Data kosong'} onRetry={muatData} />

  // Greeting summary text helper
  const taskAktifCount = detail.statistik.taskAktif
  const jatuhTempoCount = detail.statistik.jatuhTempoHariIni
  const ringkasanPekerjaan = taskAktifCount === 0 
    ? 'Kamu tidak memiliki tugas aktif hari ini. Nikmati harimu!'
    : `Kamu memiliki ${taskAktifCount} tugas aktif dan ${jatuhTempoCount > 0 ? `${jatuhTempoCount} tugas yang perlu diselesaikan hari ini.` : 'tidak ada tugas yang jatuh tempo hari ini.'}`

  return (
    <div className="space-y-6">
      {/* 1. WELCOME SECTION — Premium Redesigned Banner */}
      <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 p-6 text-white shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-maroon-500/10 blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="text-[10px] font-bold text-blue-200/70 uppercase tracking-widest">{dapatkanSapaan()}</span>
            <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">
              Halo, {data.nama.split(' ')[0]} 👋
            </h2>
            <p className="text-xs font-semibold text-slate-300 mt-1">{formatTanggalIndonesia()}</p>
            <p className="text-xs font-semibold text-slate-200 leading-relaxed max-w-xl mt-3.5 bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl inline-block">
              {ringkasanPekerjaan}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <a
              href="/tugas-saya"
              className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4.5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:bg-blue-500 active:scale-95 cursor-pointer"
            >
              Lihat Tugas Saya
              <IconChevronKanan />
            </a>
            {detail.divisiList.length > 0 && (
              <a
                href={`/divisi/${detail.divisiList[0].id}`}
                className="flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-4.5 py-2.5 text-xs font-bold text-white transition-all duration-200 hover:bg-white/20 active:scale-95 cursor-pointer"
              >
                Buka Kanban
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 2. STATISTIC CARDS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Tugas Aktif */}
        <KartuTilt className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <IconTaskAktif />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-ink mt-3">
            <CountUp value={detail.statistik.taskAktif} />
          </p>
          <p className="text-[11px] font-bold text-muted mt-1 uppercase tracking-wider">Tugas Aktif</p>
          <p className="text-[10px] text-muted/80 mt-0.5">Sedang menunggu / dikerjakan</p>
        </KartuTilt>

        {/* Jatuh Tempo Hari Ini */}
        <KartuTilt className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <IconJatuhTempo />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-ink mt-3">
            <CountUp value={detail.statistik.jatuhTempoHariIni} />
          </p>
          <p className="text-[11px] font-bold text-muted mt-1 uppercase tracking-wider">Jatuh Tempo Hari Ini</p>
          <p className="text-[10px] text-muted/80 mt-0.5">Perlu diselesaikan hari ini</p>
        </KartuTilt>

        {/* Selesai Minggu Ini */}
        <KartuTilt className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-50 text-green-600">
            <IconSelesai />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-ink mt-3">
            <CountUp value={detail.statistik.selesaiMingguIni} />
          </p>
          <p className="text-[11px] font-bold text-muted mt-1 uppercase tracking-wider">Selesai Minggu Ini</p>
          <p className="text-[10px] text-muted/80 mt-0.5">Tugas diselesaikan 7 hari terakhir</p>
        </KartuTilt>

        {/* Tugas Terlambat */}
        <KartuTilt className={`rounded-2xl border p-4 shadow-sm ${detail.statistik.terlambat > 0 ? 'bg-red-50/40 border-red-200' : 'bg-white border-cream-200'}`}>
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${detail.statistik.terlambat > 0 ? 'bg-red-100 text-red-600' : 'bg-cream-100 text-muted'}`}>
            <IconTerlambat />
          </div>
          <p className={`text-2xl sm:text-3xl font-black mt-3 ${detail.statistik.terlambat > 0 ? 'text-red-700' : 'text-ink'}`}>
            <CountUp value={detail.statistik.terlambat} />
          </p>
          <p className="text-[11px] font-bold text-muted mt-1 uppercase tracking-wider">Terlambat</p>
          <p className="text-[10px] text-muted/80 mt-0.5">Melewati batas deadline</p>
        </KartuTilt>
      </div>

      {/* MAIN TWO-COLUMN CONTENT */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:items-start">
        
        {/* KOLOM KIRI (LEBIH BESAR): TUGAS PRIORITAS SAYA */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold tracking-widest text-muted uppercase">Tugas Prioritas Saya</h3>
            <a href="/tugas-saya" className="text-xs font-bold text-orange-600 hover:underline">
              Lihat Semua Tugas
            </a>
          </div>

          <div className="rounded-2xl border border-cream-200 bg-white shadow-sm overflow-hidden">
            {detail.tugasPrioritas.length === 0 ? (
              <EmptyState pesan="Bagus! Tidak ada tugas prioritas yang mendesak saat ini." />
            ) : (
              <div className="divide-y divide-cream-100">
                {detail.tugasPrioritas.map((task) => {
                  const isOverdue = task.dueDate && new Date(task.dueDate).getTime() < new Date().setHours(0,0,0,0)
                  return (
                    <div key={task.id} className="group p-4 flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center hover:bg-cream-50/30 transition">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <BadgePrioritas prioritas={task.prioritas} />
                          <BadgeStatus status={task.boardNama} terlambat={!!isOverdue} />
                          {task.isRecurring && (
                            <span className="rounded-full bg-blue-50 border border-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-bold flex items-center gap-0.5">
                              🔄 Rutin
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-ink mt-2 group-hover:text-orange-600 transition">
                          <a href={`/divisi/${task.divisiId}`}>{task.judul}</a>
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted mt-1.5">
                          <span className="flex items-center gap-1">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: task.divisiWarna }} />
                            {task.divisiNama}
                          </span>
                          <span>•</span>
                          <span>Kolom: {task.boardNama}</span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between sm:justify-center w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-cream-100/60 text-right">
                        <div>
                          <p className={`text-xs font-semibold ${isOverdue ? 'text-red-600 font-bold' : 'text-muted'}`}>
                            {task.dueDate ? dapatkanSelisihWaktu(task.dueDate) : 'Tanpa deadline'}
                          </p>
                          {task.dueDate && (
                            <p className="text-[10px] text-muted/70 mt-0.5">
                              {new Date(task.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </p>
                          )}
                        </div>

                        {task.checklistTotal > 0 && (
                          <div className="mt-2 flex items-center gap-1.5 justify-end">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-cream-200">
                              <div
                                className="h-full bg-green-500 rounded-full transition-all"
                                style={{ width: `${(task.checklistSelesai / task.checklistTotal) * 100}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-muted">{task.checklistSelesai}/{task.checklistTotal} checklist</span>
                          </div>
                        )}
                        
                        <div className="mt-2 text-[10px] text-muted hidden sm:block">
                          Ditugaskan oleh <span className="font-semibold text-ink">{task.ditugaskanOleh}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* KOLOM KANAN: PROGRESS MINGGU INI */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold tracking-widest text-muted uppercase">Progress Kerja</h3>
            <div className="flex rounded-lg border border-cream-200 bg-white p-0.5 text-[10px] font-bold">
              <button
                onClick={() => setProgressPeriod('week')}
                className={`rounded-md px-2 py-0.5 transition ${progressPeriod === 'week' ? 'bg-orange-500 text-white' : 'text-muted hover:text-ink'}`}
              >
                Minggu Ini
              </button>
              <button
                onClick={() => setProgressPeriod('month')}
                className={`rounded-md px-2 py-0.5 transition ${progressPeriod === 'month' ? 'bg-orange-500 text-white' : 'text-muted hover:text-ink'}`}
              >
                Bulan Ini
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-cream-200 bg-white p-5 shadow-sm flex flex-col items-center justify-center">
            {progressData.total === 0 ? (
              <EmptyState pesan="Tidak ada tugas untuk periode ini." />
            ) : (
              <>
                {/* SVG DONUT CHART */}
                <div className="relative flex items-center justify-center h-28 w-28 mb-4">
                  <svg viewBox="0 0 112 112" className="transform -rotate-90 w-full h-full">
                    <circle
                      cx="56"
                      cy="56"
                      r="40"
                      className="stroke-cream-100 fill-none"
                      strokeWidth="8"
                    />
                    <motion.circle
                      cx="56"
                      cy="56"
                      r="40"
                      className="stroke-orange-500 fill-none"
                      strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 40}
                      initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 40 - (progressData.persentase / 100) * (2 * Math.PI * 40) }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-xl font-black text-ink">{progressData.persentase}%</span>
                    <p className="text-[9px] font-bold text-muted/80 uppercase">Penyelesaian</p>
                  </div>
                </div>

                {/* CHART LEGENDS */}
                <div className="w-full space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-cream-50 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-muted">Selesai & Review</span>
                    </div>
                    <span className="font-bold text-ink">{progressData.selesai} task</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-cream-50 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-orange-500" />
                      <span className="text-muted">Dikerjakan</span>
                    </div>
                    <span className="font-bold text-ink">{progressData.dikerjakan} task</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-cream-50 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-cream-300" />
                      <span className="text-muted">Belum Dimulai</span>
                    </div>
                    <span className="font-bold text-ink">{progressData.belumMulai} task</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-bold text-muted">Total Tugas</span>
                    <span className="font-black text-ink">{progressData.total} task</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* SECONDARY ROW GRID */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* DEADLINE TERDEKAT */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold tracking-widest text-muted uppercase">Deadline Terdekat</h3>
          <div className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm space-y-2">
            {detail.deadlineTerdekat.length === 0 ? (
              <EmptyState pesan="Bagus! Tidak ada deadline terdekat." />
            ) : (
              detail.deadlineTerdekat.map((t) => {
                const isOverdue = t.dueDate && new Date(t.dueDate).getTime() < new Date().setHours(0,0,0,0)
                return (
                  <div key={t.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-cream-50 bg-cream-50/20 hover:bg-cream-50/50 transition">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink truncate">{t.judul}</p>
                      <p className="text-[10px] text-muted mt-0.5">{t.divisiNama} • {t.boardNama}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 inline-block ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-orange-50 text-orange-700'}`}>
                        {t.dueDate ? dapatkanSelisihWaktu(t.dueDate) : ''}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* AKTIVITAS TERBARU */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold tracking-widest text-muted uppercase">Aktivitas Terbaru</h3>
          <div className="rounded-2xl border border-cream-200 bg-white p-5 shadow-sm">
            {detail.aktivitas.length === 0 ? (
              <EmptyState pesan="Belum ada aktivitas baru." />
            ) : (
              <div className="relative border-l border-cream-200 pl-4 space-y-5">
                {detail.aktivitas.map((act) => {
                  return (
                    <div key={act.id} className="relative text-xs">
                      {/* Timeline dot */}
                      <span className="absolute -left-[21px] top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-orange-400 ring-4 ring-white" />
                      
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
                          <p className="text-[10px] text-muted mt-0.5">{dapatkanWaktuRelatifAktivitas(act.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER ROW GRID: DIVISI SAYA & AKSES CEPAT */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* DIVISI SAYA */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold tracking-widest text-muted uppercase">Divisi Saya</h3>
          {detail.divisiList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-cream-200 bg-white p-6 text-center text-xs text-muted">
              Kamu belum bergabung dengan divisi mana pun. Hubungi Admin atau Owner.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {detail.divisiList.map((div) => (
                  <div
                    key={div.id}
                    className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm flex flex-col justify-between gap-4 group/card transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full ring-2"
                          style={{
                            backgroundColor: div.warna,
                            borderColor: `${div.warna}25`,
                            boxShadow: `0 0 8px ${div.warna}80`
                          }}
                        />
                        <h4 className="font-extrabold text-ink text-sm tracking-tight">{div.nama}</h4>
                      </div>
                      <p className="text-xs text-muted/95 mt-1.5 leading-relaxed line-clamp-2">
                        {div.deskripsi || 'Tidak ada deskripsi divisi.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between bg-cream-50/40 border border-cream-100/50 p-2.5 rounded-xl">
                      {/* Avatar group */}
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {div.anggotaAvatars.map((member) => (
                          <div
                            key={member.id}
                            className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-maroon-800 text-[10px] font-bold text-cream-50 flex items-center justify-center uppercase shadow-sm"
                            title={member.nama}
                          >
                            {member.fotoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                className="h-full w-full object-cover rounded-full"
                                src={member.fotoUrl}
                                alt={member.nama}
                              />
                            ) : (
                              member.nama.split(' ').map(n => n[0]).slice(0,2).join('')
                            )}
                          </div>
                        ))}
                        {div.jumlahAnggota > 5 && (
                          <div className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-cream-100 text-[9px] font-black text-muted flex items-center justify-center shadow-sm">
                            +{div.jumlahAnggota - 5}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] font-bold text-muted/70 block uppercase tracking-wider">Tugas Aktif</span>
                        <span className="text-xs font-black text-maroon-900 bg-orange-100/60 border border-orange-200/50 rounded-md px-1.5 py-0.5 mt-0.5 inline-block">{div.jumlahTugasAktif} task</span>
                      </div>
                    </div>

                    <a
                      href={`/divisi/${div.id}`}
                      className="mt-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-maroon-800 to-maroon-900 hover:from-orange-600 hover:to-orange-500 px-4 py-2.5 text-xs font-bold text-cream-50 shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-orange-500/10 group/btn"
                    >
                      Buka Kanban Divisi
                      <span className="transition-transform duration-200 group-hover/btn:translate-x-1">
                        <IconChevronKanan />
                      </span>
                    </a>
                  </div>
              ))}
            </div>
          )}
        </div>

        {/* AKSES CEPAT */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold tracking-widest text-muted uppercase">Akses Cepat</h3>
          <div className="grid grid-cols-1 gap-2.5">
            <KartuTilt className="rounded-2xl border border-cream-200 bg-white shadow-sm overflow-hidden" tiltDegree={7}>
              <a href="/tugas-saya" className="flex items-center gap-3.5 px-4 py-3.5 group">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition group-hover:bg-orange-100">
                  <IconTaskAktif />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-ink leading-snug">Tugas Saya</p>
                  <p className="text-[10px] text-muted mt-0.5 leading-none">Semua tugas lintas divisi</p>
                </div>
                <span className="transition-transform duration-200 group-hover:translate-x-1">
                  <IconChevronKanan />
                </span>
              </a>
            </KartuTilt>

            {detail.divisiList.length > 0 && (
              <KartuTilt className="rounded-2xl border border-cream-200 bg-white shadow-sm overflow-hidden" tiltDegree={7}>
                <a href={`/divisi/${detail.divisiList[0].id}`} className="flex items-center gap-3.5 px-4 py-3.5 group">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-maroon-50 text-maroon-800 transition group-hover:bg-maroon-100">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M9 3v18M15 3v18" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-ink leading-snug">Buka Kanban</p>
                    <p className="text-[10px] text-muted mt-0.5 leading-none">Papan kerja tim divisi</p>
                  </div>
                  <span className="transition-transform duration-200 group-hover:translate-x-1">
                    <IconChevronKanan />
                  </span>
                </a>
              </KartuTilt>
            )}

            <KartuTilt className="rounded-2xl border border-cream-200 bg-white shadow-sm overflow-hidden" tiltDegree={7}>
              <a href="/ganti-password" className="flex items-center gap-3.5 px-4 py-3.5 group">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cream-100 text-muted transition group-hover:bg-cream-200/60">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m0 0a2 2 0 01-2 2m2-2h3m-3 0H9M3 12a9 9 0 019-9m9 9a9 9 0 01-9 9m0 0c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-ink leading-snug">Ganti Password</p>
                  <p className="text-[10px] text-muted mt-0.5 leading-none">Amankan akun kamu</p>
                </div>
                <span className="transition-transform duration-200 group-hover:translate-x-1">
                  <IconChevronKanan />
                </span>
              </a>
            </KartuTilt>
          </div>
        </div>
      </div>
    </div>
  )
}
