'use client'

import { useEffect, useState, useMemo } from 'react'
import type { DataShell } from '@/lib/shell-data'
import type { AdminDashboardData } from './actions'
import { ambilDetailDashboardAdmin } from './actions'
import KartuTilt from '@/components/kartu-tilt'

function dapatkanSapaan(): string {
  const jam = new Date().getHours()
  if (jam < 11) return 'Selamat pagi'
  if (jam < 15) return 'Selamat siang'
  if (jam < 19) return 'Selamat sore'
  return 'Selamat malam'
}

function formatTanggalIndo(): string {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

export default function AdminDashboard({ data: shellData }: { data: DataShell }) {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null)
  const [sedangMuat, setSedangMuat] = useState(true)
  const [errorPesan, setErrorPesan] = useState<string | null>(null)

  // Filter & Search untuk "Task yang Perlu Diperhatikan"
  const [cariTask, setCariTask] = useState('')
  const [filterDivisi, setFilterDivisi] = useState('semua')
  const [filterPrioritas, setFilterPrioritas] = useState('semua')

  // State untuk Count-Up Statistik
  const [karyawanCount, setKaryawanCount] = useState(0)
  const [divisiCount, setDivisiCount] = useState(0)
  const [taskCount, setTaskCount] = useState(0)
  const [terlambatCount, setTerlambatCount] = useState(0)

  // Chart Tooltip States
  const [activeTrendIdx, setActiveTrendIdx] = useState<number | null>(null)

  useEffect(() => {
    muatData()
  }, [])

  function muatData() {
    setSedangMuat(true)
    setErrorPesan(null)
    ambilDetailDashboardAdmin()
      .then((res) => {
        setDashboardData(res)
        setSedangMuat(false)
        
        // Simulasikan Count-up Animation
        animateCountUp(res.statistik.totalKaryawanAktif, setKaryawanCount)
        animateCountUp(res.statistik.totalDivisiAktif, setDivisiCount)
        animateCountUp(res.statistik.totalTaskAktif, setTaskCount)
        animateCountUp(res.statistik.totalTaskTerlambat, setTerlambatCount)
      })
      .catch((err) => {
        console.error('Gagal memuat dashboard admin:', err)
        setErrorPesan('Gagal memuat data dari server. Silakan coba kembali.')
        setSedangMuat(false)
      })
  }

  function animateCountUp(target: number, setter: React.Dispatch<React.SetStateAction<number>>) {
    if (target === 0) {
      setter(0)
      return
    }
    let start = 0
    const duration = 500 // ms
    const stepTime = Math.max(Math.floor(duration / target), 15)
    
    const timer = setInterval(() => {
      start += Math.ceil(target / 15)
      if (start >= target) {
        setter(target)
        clearInterval(timer)
      } else {
        setter(start)
      }
    }, stepTime)
  }

  // Filtered Tugas Perhatian
  const tugasTerfilter = useMemo(() => {
    if (!dashboardData) return []
    return dashboardData.tugasPerhatian.filter((t) => {
      const cocokJudul = t.judul.toLowerCase().includes(cariTask.toLowerCase())
      const cocokDivisi = filterDivisi === 'semua' || t.divisiId === filterDivisi
      const cocokPrioritas = filterPrioritas === 'semua' || t.prioritas === filterPrioritas
      return cocokJudul && cocokDivisi && cocokPrioritas
    })
  }, [dashboardData, cariTask, filterDivisi, filterPrioritas])

  // Donut Chart Segment Calculations
  const donutSegments = useMemo(() => {
    if (!dashboardData) return []
    const { todo, dikerjakan, review, selesai, terlambat } = dashboardData.distribusiStatus
    const total = todo + dikerjakan + review + selesai + terlambat
    if (total === 0) return []

    const items = [
      { label: 'To Do', value: todo, color: '#9d8471' },
      { label: 'Dikerjakan', value: dikerjakan, color: '#f97316' },
      { label: 'Review', value: review, color: '#1e3a8a' },
      { label: 'Selesai', value: selesai, color: '#10b981' },
      { label: 'Terlambat', value: terlambat, color: '#ef4444' },
    ]

    let currentOffset = 0
    const circumference = 2 * Math.PI * 30 // Radius 30

    return items.map((item) => {
      const percentage = (item.value / total) * 100
      const strokeDashoffset = circumference - (item.value / total) * circumference
      const dashoffset = currentOffset
      currentOffset += (item.value / total) * circumference

      return {
        ...item,
        percentage,
        strokeDashoffset,
        dashoffset
      }
    })
  }, [dashboardData])

  if (sedangMuat) {
    return <AdminDashboardSkeleton />
  }

  if (errorPesan || !dashboardData) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-3xl border border-cream-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 shadow-inner">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h3 className="text-base font-black text-maroon-800">Ada Masalah Memuat Data</h3>
        <p className="mt-2 text-xs text-muted/80 max-w-sm font-semibold">{errorPesan || 'Gagal terhubung dengan server.'}</p>
        <button
          onClick={muatData}
          className="mt-5 rounded-xl bg-maroon-800 px-5 py-2.5 text-xs font-bold text-cream-50 hover:bg-maroon-900 active:scale-95 transition-all shadow-md shadow-maroon-800/10"
        >
          Coba Lagi
        </button>
      </div>
    )
  }

  const sapaan = dapatkanSapaan()
  const tanggalHariIni = formatTanggalIndo()

  return (
    <div className="space-y-6">
      {/* 1. Welcome Section — Premium Redesigned Banner */}
      <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 p-6 text-white shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-maroon-500/10 blur-3xl" />
        
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white leading-tight">
              {sapaan}, {shellData.nama.split(' ')[0]} 👋
            </h2>
            <p className="mt-1.5 text-xs font-bold text-slate-300">{tanggalHariIni}</p>
            <p className="mt-2.5 text-xs font-semibold text-slate-200 leading-relaxed max-w-xl">
              Perusahaan sedang mengelola <span className="font-extrabold text-blue-200">{dashboardData.statistik.totalTaskAktif} tugas aktif</span> 
              {dashboardData.statistik.totalTaskTerlambat > 0 ? (
                <span> dan <span className="font-extrabold text-red-400 animate-pulse">{dashboardData.statistik.totalTaskTerlambat} tugas terlambat</span> yang membutuhkan penanganan segera.</span>
              ) : (
                ' dan tidak ada tugas yang terlambat saat ini. Kinerja bagus!'
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <a
              href="/admin/karyawan"
              className="flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-4.5 py-2 text-xs font-bold text-white transition-all duration-200 hover:bg-white/20 active:scale-95 shadow-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              <span>Karyawan</span>
            </a>
            <a
              href="/admin/divisi"
              className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4.5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:bg-blue-500 active:scale-95"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Tambah Divisi</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Statistic Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Karyawan Aktif */}
        <KartuTilt className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-extrabold tracking-wider text-muted/75 uppercase">Karyawan Aktif</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-maroon-50 text-maroon-800">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-black text-maroon-800 leading-none">{karyawanCount}</p>
          <p className="mt-1.5 text-[10px] font-semibold text-muted leading-tight">Akun aktif yang dapat mengakses sistem.</p>
        </KartuTilt>

        {/* Divisi Aktif */}
        <KartuTilt className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-extrabold tracking-wider text-muted/75 uppercase">Divisi Aktif</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 3v18" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-black text-orange-500 leading-none">{divisiCount}</p>
          <p className="mt-1.5 text-[10px] font-semibold text-muted leading-tight">Divisi fungsional yang beroperasi.</p>
        </KartuTilt>

        {/* Task Task Aktif */}
        <KartuTilt className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-extrabold tracking-wider text-muted/75 uppercase">Tugas Aktif</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-maroon-50 text-maroon-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 20h9M3 20v-8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v8" />
                <path d="M3 12h8" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-black text-maroon-800 leading-none">{taskCount}</p>
          <p className="mt-1.5 text-[10px] font-semibold text-muted leading-tight">Tugas di To Do, Dikerjakan, & Review.</p>
        </KartuTilt>

        {/* Task Terlambat */}
        <KartuTilt className={`rounded-2xl border p-4 shadow-sm ${
          terlambatCount > 0 ? 'border-red-200 bg-red-50/20' : 'border-cream-200 bg-white'
        }`}>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-extrabold tracking-wider text-muted/75 uppercase">Tugas Terlambat</span>
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${
              terlambatCount > 0 ? 'bg-red-100 text-red-600' : 'bg-cream-100 text-muted/80'
            }`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <p className={`text-3xl font-black leading-none ${terlambatCount > 0 ? 'text-red-600' : 'text-maroon-800'}`}>{terlambatCount}</p>
          <p className="mt-1.5 text-[10px] font-semibold text-muted leading-tight">Tugas melewati tenggat penyelesaian.</p>
        </KartuTilt>
      </div>

      {/* 3. Analytics (Trend & Distribusi Status) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:items-start">
        {/* Task Trend SVG Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-cream-200 bg-white p-4 shadow-sm flex flex-col justify-between min-h-[300px]">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-extrabold tracking-wider text-muted uppercase">Analisis Perkembangan Task</span>
            <span className="rounded bg-cream-100 border border-cream-200/50 px-2 py-0.5 text-[9px] font-bold text-muted">7 HARI TERAKHIR</span>
          </div>

          <div className="relative flex-1 flex items-end h-40">
            {/* Custom SVG Line Chart */}
            <svg viewBox="0 0 420 150" className="w-full h-full">
              {/* Grid Lines */}
              <line x1="30" y1="20" x2="410" y2="20" className="stroke-cream-100" strokeWidth="1" />
              <line x1="30" y1="60" x2="410" y2="60" className="stroke-cream-100" strokeWidth="1" />
              <line x1="30" y1="100" x2="410" y2="100" className="stroke-cream-100" strokeWidth="1" />
              <line x1="30" y1="130" x2="410" y2="130" className="stroke-cream-200/50" strokeWidth="1" />

              {/* Draw Dibuat Line & Area */}
              {(() => {
                const points = dashboardData.trendTask.map((t, i) => {
                  const x = 30 + i * 60
                  const maxVal = Math.max(...dashboardData.trendTask.map(k => Math.max(k.dibuat, k.selesai, k.terlambat, 1)))
                  const y = 130 - (t.dibuat / maxVal) * 100
                  return { x, y }
                })
                const pathData = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`
                return (
                  <>
                    <path d={pathData} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                    {points.map((p, i) => (
                      <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r={activeTrendIdx === i ? 5 : 3.5}
                        fill="#3b82f6"
                        className="cursor-pointer transition-all stroke-white stroke-[1.5]"
                        onMouseEnter={() => setActiveTrendIdx(i)}
                        onMouseLeave={() => setActiveTrendIdx(null)}
                      />
                    ))}
                  </>
                )
              })()}

              {/* Draw Selesai Line */}
              {(() => {
                const points = dashboardData.trendTask.map((t, i) => {
                  const x = 30 + i * 60
                  const maxVal = Math.max(...dashboardData.trendTask.map(k => Math.max(k.dibuat, k.selesai, k.terlambat, 1)))
                  const y = 130 - (t.selesai / maxVal) * 100
                  return { x, y }
                })
                const pathData = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`
                return (
                  <>
                    <path d={pathData} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                    {points.map((p, i) => (
                      <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r={activeTrendIdx === i ? 5 : 3.5}
                        fill="#10b981"
                        className="cursor-pointer transition-all stroke-white stroke-[1.5]"
                        onMouseEnter={() => setActiveTrendIdx(i)}
                        onMouseLeave={() => setActiveTrendIdx(null)}
                      />
                    ))}
                  </>
                )
              })()}

              {/* Label X */}
              {dashboardData.trendTask.map((t, i) => (
                <text key={i} x={30 + i * 60} y="145" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="600">
                  {t.tanggal}
                </text>
              ))}
            </svg>

            {/* Custom interactive Tooltip */}
            {activeTrendIdx !== null && (
              <div className="absolute z-20 rounded-xl border border-cream-200 bg-white p-2.5 shadow-lg text-[10px] pointer-events-none font-bold"
                style={{
                  left: `${30 + activeTrendIdx * 14}%`,
                  bottom: '10%'
                }}
              >
                <p className="text-maroon-800 border-b border-cream-100 pb-1 mb-1">{dashboardData.trendTask[activeTrendIdx].tanggal}</p>
                <p className="text-orange-500">Dibuat: {dashboardData.trendTask[activeTrendIdx].dibuat}</p>
                <p className="text-emerald-500">Selesai: {dashboardData.trendTask[activeTrendIdx].selesai}</p>
                <p className="text-red-500">Terlambat: {dashboardData.trendTask[activeTrendIdx].terlambat}</p>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-center gap-6 border-t border-cream-100 pt-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              <span>Tugas Dibuat</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Tugas Selesai</span>
            </div>
          </div>
        </div>

        {/* Distribusi Status Donut Chart */}
        <div className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-extrabold tracking-wider text-muted uppercase">Distribusi Status Task</span>
          
          <div className="relative flex items-center justify-center my-4 h-36">
            <svg width="120" height="120" viewBox="0 0 80 80" className="transform -rotate-90">
              <circle cx="40" cy="40" r="30" fill="none" stroke="#f5f2eb" strokeWidth="9" />
              {donutSegments.map((seg, i) => (
                <circle
                  key={i}
                  cx="40"
                  cy="40"
                  r="30"
                  fill="none"
                  strokeWidth="9"
                  strokeDasharray={`${2 * Math.PI * 30}`}
                  strokeDashoffset={seg.strokeDashoffset}
                  style={{
                    stroke: seg.color,
                    transformOrigin: '40px 40px',
                    transform: `rotate(${seg.dashoffset * (360 / (2 * Math.PI * 30))}deg)`
                  }}
                />
              ))}
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <p className="text-2xl font-black text-maroon-800 leading-none">{dashboardData.distribusiStatus.total}</p>
              <p className="text-[9px] font-extrabold text-muted tracking-wider uppercase mt-0.5">TOTAL TASK</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] font-bold text-muted border-t border-cream-100 pt-3">
            {donutSegments.map((seg) => (
              <div key={seg.label} className="flex items-center justify-between py-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: seg.color }} />
                  <span>{seg.label}</span>
                </div>
                <span className="text-ink">{seg.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Main Operations (Ringkasan Divisi & Task yang Perlu Diperhatikan) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Ringkasan Divisi */}
        <div className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <span className="text-xs font-extrabold tracking-wider text-muted uppercase block mb-1">Ringkasan Divisi</span>
            <p className="text-[10px] font-semibold text-muted leading-none">Status penyelesaian dan operasional tiap divisi.</p>
          </div>

          {dashboardData.divisiList.length === 0 ? (
            <p className="text-xs text-muted/70 italic py-6 text-center">Belum ada divisi aktif.</p>
          ) : (
            <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
              {dashboardData.divisiList.map((div) => (
                <div key={div.id} className="rounded-xl border border-cream-100/50 bg-cream-50/15 p-3 hover:bg-cream-50/50 hover:border-cream-200/50 transition duration-200">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: div.warna }} />
                        <h4 className="text-xs font-bold text-ink leading-none">{div.nama}</h4>
                      </div>
                      <p className="mt-1 text-[10px] font-semibold text-muted">{div.jumlahAnggota} anggota</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {div.taskTerlambat > 0 && (
                        <span className="rounded bg-red-100 border border-red-200/40 px-2 py-0.5 text-[9px] font-bold text-red-700 animate-pulse">
                          Perlu Perhatian
                        </span>
                      )}
                      <span className="rounded bg-cream-100/70 border border-cream-200/30 px-2 py-0.5 text-[9px] font-bold text-muted">
                        {div.tingkatPenyelesaian}% selesai
                      </span>
                    </div>
                  </div>

                  {/* Division tasks stats bar */}
                  <div className="flex items-center justify-between text-[10px] font-bold text-muted/80 mb-2 bg-cream-50/50 p-1.5 rounded-lg border border-cream-200/20">
                    <div className="flex items-center gap-3">
                      <span>{div.taskAktif} Aktif</span>
                      <span>&middot;</span>
                      <span>{div.taskSelesai} Selesai</span>
                      {div.taskTerlambat > 0 && (
                        <>
                          <span>&middot;</span>
                          <span className="text-red-600 font-extrabold">{div.taskTerlambat} Terlambat</span>
                        </>
                      )}
                    </div>
                    <a
                      href={`/divisi/${div.id}`}
                      className="text-maroon-800 hover:text-orange-500 text-[9px] font-extrabold hover:underline uppercase"
                    >
                      Buka Kanban &rarr;
                    </a>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-cream-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        div.tingkatPenyelesaian >= 75 ? 'bg-emerald-500' :
                        div.tingkatPenyelesaian >= 40 ? 'bg-orange-500' : 'bg-maroon-800'
                      }`}
                      style={{ width: `${div.tingkatPenyelesaian}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Task yang Perlu Diperhatikan */}
        <div className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <span className="text-xs font-extrabold tracking-wider text-muted uppercase block mb-1.5">Task yang Perlu Diperhatikan</span>
            
            {/* Filter and search controls */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                value={cariTask}
                onChange={(e) => setCariTask(e.target.value)}
                placeholder="Cari task..."
                className="flex-1 rounded-xl border border-cream-200 bg-cream-50/40 px-3 py-1.5 text-[10px] font-semibold text-ink placeholder-muted/60 outline-none focus:border-maroon-800 focus:ring-1 focus:ring-maroon-800/10 transition"
              />
              <select
                value={filterDivisi}
                onChange={(e) => setFilterDivisi(e.target.value)}
                className="rounded-xl border border-cream-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-ink outline-none focus:border-maroon-800 transition cursor-pointer"
              >
                <option value="semua">Semua Divisi</option>
                {dashboardData.divisiList.map((d) => (
                  <option key={d.id} value={d.id}>{d.nama}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2 flex-1 max-h-[350px] overflow-y-auto pr-1">
            {tugasTerfilter.length === 0 ? (
              <p className="text-xs text-muted/70 italic py-10 text-center">Semua tugas berjalan tepat waktu.</p>
            ) : (
              tugasTerfilter.map((task) => {
                const prioritasWarna = {
                  mendesak: 'bg-red-50 text-red-600 border-red-200/40',
                  tinggi: 'bg-orange-50 text-orange-600 border-orange-200/40',
                  sedang: 'bg-blue-50 text-blue-600 border-blue-200/40',
                  rendah: 'bg-cream-100 text-muted/80 border-cream-200/20'
                }[task.prioritas] ?? 'bg-cream-100 text-muted border-cream-200/20'

                return (
                  <div key={task.id} className="rounded-xl border border-cream-100/50 bg-cream-50/10 p-3 hover:bg-cream-50/40 transition duration-150 flex items-start justify-between gap-3 shadow-sm">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: task.divisiWarna }} />
                        <span className="text-[9px] font-extrabold text-muted uppercase">{task.divisiNama}</span>
                        <span className={`rounded border px-1.5 py-0.5 text-[8px] font-bold uppercase ${prioritasWarna}`}>
                          {task.prioritas}
                        </span>
                        {task.selisihTerlambat !== null && (
                          <span className="rounded bg-red-100 border border-red-200/40 px-1.5 py-0.5 text-[8px] font-bold text-red-700">
                            Terlambat {task.selisihTerlambat} hari
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-ink leading-tight truncate">{task.judul}</h4>
                      <p className="mt-1 text-[9px] font-bold text-muted bg-cream-50 border border-cream-200/20 rounded px-1.5 py-0.5 w-fit">
                        Board: {task.boardNama}
                      </p>
                    </div>

                    <div className="flex flex-col items-end shrink-0 gap-1.5 justify-between h-full">
                      {/* Avatar list */}
                      {task.assignees.length > 0 ? (
                        <div className="flex -space-x-1 overflow-hidden">
                          {task.assignees.slice(0, 3).map((a) => {
                            const inisial = a.nama.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
                            return (
                              <div
                                key={a.id}
                                className="inline-block h-5 w-5 rounded-full ring-2 ring-white bg-maroon-800 text-[8px] font-black text-cream-50 flex items-center justify-center uppercase shadow-sm overflow-hidden"
                                title={a.nama}
                              >
                                {a.fotoUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={a.fotoUrl} alt={a.nama} className="h-full w-full object-cover rounded-full" />
                                ) : (
                                  inisial
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <span className="text-[9px] text-muted italic font-semibold">Unassigned</span>
                      )}

                      <a
                        href={`/divisi/${task.divisiId}`}
                        className="text-[9px] font-extrabold text-maroon-800 hover:text-orange-500 hover:underline uppercase"
                      >
                        Detail &rarr;
                      </a>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* 5. Additional Info (Karyawan Terbaru & Aktivitas Terbaru) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Karyawan Terbaru */}
        <div className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm flex flex-col justify-between">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold tracking-wider text-muted uppercase block mb-1">Karyawan Terbaru</span>
              <p className="text-[10px] font-semibold text-muted leading-none">Daftar akun karyawan yang baru terdaftar.</p>
            </div>
            <a
              href="/admin/karyawan"
              className="text-[9px] font-extrabold text-maroon-800 hover:text-orange-500 uppercase hover:underline"
            >
              Kelola Semua &rarr;
            </a>
          </div>

          <div className="space-y-2 flex-1 max-h-[300px] overflow-y-auto pr-1">
            {dashboardData.karyawanTerbaru.length === 0 ? (
              <p className="text-xs text-muted/70 italic py-6 text-center">Belum ada karyawan terdaftar.</p>
            ) : (
              dashboardData.karyawanTerbaru.map((kar) => (
                <div key={kar.id} className="rounded-xl border border-cream-100/50 bg-cream-50/10 p-3 flex items-center justify-between gap-3 shadow-sm hover:bg-cream-50/30 transition">
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-ink truncate leading-snug">{kar.nama}</h4>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="rounded bg-cream-100/70 border border-cream-200/30 px-1.5 py-0.5 text-[8px] font-bold text-muted uppercase">
                        {kar.roleSistem === 'super_admin' ? 'Super Admin' : kar.roleSistem === 'owner' ? 'Owner' : 'Staff'}
                      </span>
                      {kar.divisi.length > 0 ? (
                        <span className="text-[9px] text-muted font-bold">
                          Divisi: {kar.divisi.join(', ')}
                        </span>
                      ) : (
                        <span className="text-[8px] font-bold text-muted/70 italic">Belum masuk divisi</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                      kar.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {kar.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Aktivitas Terbaru Timeline */}
        <div className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <span className="text-xs font-extrabold tracking-wider text-muted uppercase block mb-1">Aktivitas Terbaru</span>
            <p className="text-[10px] font-semibold text-muted leading-none">Log peristiwa operasional di sistem perusahaan.</p>
          </div>

          <div className="space-y-3.5 flex-1 max-h-[300px] overflow-y-auto pr-1">
            {dashboardData.aktivitasTerbaru.length === 0 ? (
              <p className="text-xs text-muted/70 italic py-6 text-center">Belum ada riwayat aktivitas log.</p>
            ) : (
              dashboardData.aktivitasTerbaru.map((log) => {
                const formattedTime = new Date(log.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })

                return (
                  <div key={log.id} className="relative pl-5 border-l border-cream-200/70 pb-0.5">
                    {/* Bullet marker */}
                    <div className="absolute -left-1.5 top-1 h-3 w-3 rounded-full border-2 border-white bg-maroon-800 shadow-sm" />
                    
                    <div className="text-xs leading-normal">
                      <span className="font-extrabold text-ink">{log.actorNama}</span>
                      <span className="text-muted/90 mx-1">
                        {{
                          task_dibuat: 'membuat tugas',
                          task_dipindah: 'memindahkan tugas',
                          task_diurutkan: 'mengurutkan tugas',
                          task_dihapus: 'menghapus tugas',
                          task_ditugaskan: 'menugaskan tugas',
                          komentar_ditambah: 'menulis komentar',
                          lampiran_diupload: 'mengunggah lampiran',
                          lampiran_dihapus: 'menghapus lampiran',
                          divisi_dibuat: 'membuat divisi baru',
                          karyawan_dibuat: 'mendaftarkan karyawan baru',
                          checklist_ditambah: 'menambah checklist baru'
                        }[log.jenis] ?? 'melakukan aktivitas'}:
                      </span>
                      <span className="font-bold text-maroon-800">{log.objekNama}</span>
                    </div>
                    <p className="mt-0.5 text-[9px] font-bold text-muted">{formattedTime}</p>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* 6. Quick Actions */}
      <div className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
        <span className="text-xs font-extrabold tracking-wider text-muted uppercase block mb-3.5">Akses Cepat Pengelolaan</span>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <a
            href="/admin/karyawan"
            className="group p-3 rounded-xl border border-cream-100/50 bg-cream-50/10 hover:bg-maroon-800 hover:border-maroon-800 transition duration-300 flex flex-col items-center text-center gap-1.5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-maroon-50 text-maroon-800 group-hover:bg-cream-100 group-hover:text-maroon-800 transition duration-300 shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8" />
                <path d="M8 12h8" />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-ink group-hover:text-cream-50 transition">Tambah Karyawan</span>
          </a>

          <a
            href="/admin/divisi"
            className="group p-3 rounded-xl border border-cream-100/50 bg-cream-50/10 hover:bg-maroon-800 hover:border-maroon-800 transition duration-300 flex flex-col items-center text-center gap-1.5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-500 group-hover:bg-cream-100 group-hover:text-maroon-800 transition duration-300 shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 3v18" />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-ink group-hover:text-cream-50 transition">Kelola Divisi</span>
          </a>

          <a
            href="/admin/data-terhapus"
            className="group p-3 rounded-xl border border-cream-100/50 bg-cream-50/10 hover:bg-maroon-800 hover:border-maroon-800 transition duration-300 flex flex-col items-center text-center gap-1.5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-500 group-hover:bg-cream-100 group-hover:text-maroon-800 transition duration-300 shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-ink group-hover:text-cream-50 transition">Data Terhapus</span>
          </a>

          <a
            href="/admin/log-sistem"
            className="group p-3 rounded-xl border border-cream-100/50 bg-cream-50/10 hover:bg-maroon-800 hover:border-maroon-800 transition duration-300 flex flex-col items-center text-center gap-1.5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cream-100 text-maroon-800 group-hover:bg-cream-100 group-hover:text-maroon-800 transition duration-300 shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-ink group-hover:text-cream-50 transition">Log Sistem</span>
          </a>
        </div>
      </div>
    </div>
  )
}

function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-28 rounded-3xl bg-white border border-cream-100" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="h-24 rounded-2xl bg-white border border-cream-100" />
        <div className="h-24 rounded-2xl bg-white border border-cream-100" />
        <div className="h-24 rounded-2xl bg-white border border-cream-100" />
        <div className="h-24 rounded-2xl bg-white border border-cream-100" />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 h-64 rounded-2xl bg-white border border-cream-100" />
        <div className="h-64 rounded-2xl bg-white border border-cream-100" />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="h-80 rounded-2xl bg-white border border-cream-100" />
        <div className="h-80 rounded-2xl bg-white border border-cream-100" />
      </div>
    </div>
  )
}
