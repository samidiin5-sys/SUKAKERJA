import { ambilDataShell } from '@/lib/shell-data'
import { ambilStatistikOrganisasi, ambilStatistikPersonal, ambilTugasDikirimOwner } from './actions'
import StaffDashboard from './staff-dashboard'
import AdminDashboard from './admin-dashboard'
import TombolEksporCSV from './tombol-ekspor-csv'
import { hitungSaldoBonusStaff } from '@/lib/bonus/bonus-service'
import { ambilSesiPengguna } from '@/lib/auth/otorisasi'

// Redesigned dashboard routes
function formatTenggat(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

function formatHariIni(): string {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default async function HalamanDashboard() {
  const data = await ambilDataShell()
  const isSuperAdmin = data.roleSistem === 'super_admin'
  const isOwner = data.roleSistem === 'owner'

  let saldoBonus = 0
  if (!isSuperAdmin && !isOwner) {
    const sesi = await ambilSesiPengguna()
    saldoBonus = await hitungSaldoBonusStaff(sesi.id)
  }

  return (
    isSuperAdmin ? (
        <>
          <TombolEksporCSV />
          <AdminDashboard data={data} />
        </>
      ) : isOwner ? (
        <>
          {/* Greeting — redesigned premium banner */}
          <div className="relative mb-6 overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 p-6 text-white shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-maroon-500/10 blur-3xl" />
            
            <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-blue-200/70">Ringkasan hari ini</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  Halo, {data.nama.split(' ')[0]} 👋
                </h2>
                <p className="mt-1.5 text-xs font-semibold text-slate-300">{formatHariIni()}</p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <a
                  href="/admin/log-sistem"
                  className="rounded-full bg-white/10 border border-white/10 px-4.5 py-2 text-xs font-bold text-white transition-all duration-200 hover:bg-white/20 active:scale-95"
                >
                  Log Aktivitas ↗
                </a>
                <a
                  href="/panduan"
                  className="rounded-full bg-blue-600 px-4.5 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:bg-blue-500 active:scale-95"
                >
                  Panduan Sistem ↗
                </a>
              </div>
            </div>
          </div>

          <RingkasanOwner />

          <TombolEksporCSV />

          {/* Bottom grid */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 mt-6">
            <div className="lg:col-span-2">
              <h3 className="mb-3 text-[11px] font-bold tracking-widest text-muted">DIVISI ANDA</h3>
              {data.divisiSaya.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-cream-200 bg-white p-6 text-sm text-muted">
                  Anda belum tergabung di divisi mana pun. Hubungi Super Admin.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {data.divisiSaya.map((d) => (
                    <a
                      key={d.id}
                      href={`/divisi/${d.id}`}
                      className="group flex items-center gap-4 rounded-[22px] border border-cream-200 bg-white/95 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-maroon-200 hover:bg-cream-50/70 hover:shadow-md"
                    >
                      <div
                        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-white"
                        style={{ backgroundColor: d.warna }}
                      >
                        <IkonPapanSolid />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-ink">{d.nama}</p>
                        <p className="text-xs text-muted">Buka papan Kanban →</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-3 text-[11px] font-bold tracking-widest text-muted">AKSES CEPAT</h3>
              <div className="space-y-2.5">
                <AksesCepat href="/admin/karyawan" label="Data Karyawan" sub="Daftar seluruh karyawan" warna="bg-maroon-700" />
                <AksesCepat href="/admin/lembur" label="Review Lembur" sub="Persetujuan lembur staff" warna="bg-orange-500" />
                <AksesCepat href="/admin/tugas-tersedia" label="Tugas Terbuka" sub="Kelola pool tugas tim" warna="bg-blue-600" />
              </div>
            </div>
          </div>
        </>
      ) : (
        <StaffDashboard data={data} saldoBonus={saldoBonus} />
      )
  )
}


function AksesCepat({ href, label, sub, warna }: { href: string; label: string; sub: string; warna: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-[20px] border border-cream-200/80 bg-cream-50/70 px-4 py-3 transition hover:-translate-y-0.5 hover:border-maroon-200 hover:bg-white hover:shadow-sm"
    >
      <div className={`h-2 w-2 rounded-full ${warna}`} />
      <div>
        <p className="text-sm font-bold text-ink">{label}</p>
        <p className="text-xs text-muted">{sub}</p>
      </div>
      <svg className="ml-auto text-muted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </a>
  )
}

async function RingkasanPersonal() {
  const statistik = await ambilStatistikPersonal()

  const kartu = [
    { label: 'Task Aktif', nilai: statistik.taskAktif, warna: 'text-maroon-800', bg: 'bg-maroon-50', dot: 'bg-maroon-700' },
    { label: 'Selesai Hari Ini', nilai: statistik.selesaiHariIni, warna: 'text-orange-600', bg: 'bg-orange-50', dot: 'bg-orange-500' },
    { label: 'Selesai Minggu Ini', nilai: statistik.selesaiMingguIni, warna: 'text-orange-600', bg: 'bg-orange-50', dot: 'bg-orange-400' },
    { label: 'Jatuh Tempo Hari Ini', nilai: statistik.jatuhTempoHariIni, warna: 'text-maroon-800', bg: 'bg-maroon-50', dot: 'bg-maroon-600' },
    {
      label: 'Terlambat',
      nilai: statistik.terlambat,
      warna: statistik.terlambat > 0 ? 'text-red-600' : 'text-maroon-800',
      bg: statistik.terlambat > 0 ? 'bg-red-50' : 'bg-cream-100',
      dot: statistik.terlambat > 0 ? 'bg-red-500' : 'bg-cream-300',
    },
  ]

  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kartu.map((k) => (
          <div key={k.label} className={`rounded-2xl border border-cream-200 ${k.bg} p-4 shadow-sm`}>
            <div className="mb-2 flex items-center gap-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${k.dot}`} />
              <p className="text-[11px] font-semibold text-muted">{k.label}</p>
            </div>
            <p className={`text-3xl font-black ${k.warna}`}>{k.nilai}</p>
          </div>
        ))}
      </div>

      {statistik.tenggatTerdekat.length > 0 && (
        <div className="mb-5 rounded-[22px] border border-cream-200 bg-white/95 p-4 shadow-sm">
          <h3 className="mb-3 text-[11px] font-bold tracking-widest text-muted">TENGGAT TERDEKAT</h3>
          <div className="space-y-1">
            {statistik.tenggatTerdekat.map((t) => (
              <a
                key={t.id}
                href={`/divisi/${t.divisiId}`}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 transition hover:bg-cream-50"
              >
                <span className="font-medium text-ink">{t.judul}</span>
                <span className="ml-3 flex-shrink-0 rounded-full bg-cream-100 px-2.5 py-1 text-xs font-semibold text-muted">
                  {t.divisiNama} · {formatTenggat(t.dueDate)}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

async function RingkasanOrganisasi() {
  const statistik = await ambilStatistikOrganisasi()

  const kartu = [
    { label: 'Karyawan Aktif', nilai: statistik.totalKaryawanAktif, warna: 'text-maroon-800', bg: 'bg-maroon-50', dot: 'bg-maroon-700' },
    { label: 'Divisi Aktif', nilai: statistik.totalDivisiAktif, warna: 'text-orange-600', bg: 'bg-orange-50', dot: 'bg-orange-500' },
    { label: 'Task Aktif', nilai: statistik.totalTaskAktif, warna: 'text-maroon-800', bg: 'bg-maroon-50', dot: 'bg-maroon-600' },
    {
      label: 'Task Terlambat',
      nilai: statistik.totalTaskTerlambat,
      warna: statistik.totalTaskTerlambat > 0 ? 'text-red-600' : 'text-maroon-800',
      bg: statistik.totalTaskTerlambat > 0 ? 'bg-red-50' : 'bg-cream-100',
      dot: statistik.totalTaskTerlambat > 0 ? 'bg-red-500' : 'bg-cream-300',
    },
  ]

  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kartu.map((k) => (
          <div key={k.label} className={`rounded-2xl border border-cream-200 ${k.bg} p-4 shadow-sm`}>
            <div className="mb-2 flex items-center gap-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${k.dot}`} />
              <p className="text-[11px] font-semibold text-muted">{k.label}</p>
            </div>
            <p className={`text-3xl font-black ${k.warna}`}>{k.nilai}</p>
          </div>
        ))}
      </div>

      {statistik.perbandinganDivisi.length > 0 && (
        <div className="mb-5">
          <h3 className="mb-3 text-[11px] font-bold tracking-widest text-muted">RINGKASAN DIVISI</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {statistik.perbandinganDivisi.map((d) => (
              <a
                key={d.id}
                href={`/divisi/${d.id}`}
                className="group rounded-[22px] border border-cream-200 bg-white/95 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-maroon-200 hover:bg-cream-50/70 hover:shadow-md"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-bold text-ink">{d.nama}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    d.tingkatPenyelesaian >= 75
                      ? 'bg-green-100 text-green-700'
                      : d.tingkatPenyelesaian >= 40
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-cream-100 text-muted'
                  }`}>
                    {d.tingkatPenyelesaian}% selesai
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-cream-50 py-2">
                    <p className="text-lg font-black text-maroon-800">{d.totalAktif}</p>
                    <p className="text-[10px] font-semibold text-muted">Aktif</p>
                  </div>
                  <div className="rounded-lg bg-cream-50 py-2">
                    <p className="text-lg font-black text-orange-600">{d.selesai}</p>
                    <p className="text-[10px] font-semibold text-muted">Selesai</p>
                  </div>
                  <div className={`rounded-lg py-2 ${d.terlambat > 0 ? 'bg-red-50' : 'bg-cream-50'}`}>
                    <p className={`text-lg font-black ${d.terlambat > 0 ? 'text-red-600' : 'text-maroon-800'}`}>
                      {d.terlambat}
                    </p>
                    <p className="text-[10px] font-semibold text-muted">Terlambat</p>
                  </div>
                </div>
                {/* Thin progress bar at bottom */}
                <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-cream-200">
                  <div
                    className={`h-full rounded-full transition-all ${
                      d.tingkatPenyelesaian >= 75 ? 'bg-green-500' :
                      d.tingkatPenyelesaian >= 40 ? 'bg-orange-500' : 'bg-maroon-500'
                    }`}
                    style={{ width: `${d.tingkatPenyelesaian}%` }}
                  />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

async function RingkasanOwner() {
  const [statistik, tugasDikirim] = await Promise.all([
    ambilStatistikOrganisasi(),
    ambilTugasDikirimOwner(),
  ])

  const kartu = [
    {
      label: 'Karyawan Aktif',
      nilai: statistik.totalKaryawanAktif,
      warna: 'text-maroon-800',
      bg: 'bg-white',
      border: 'border-cream-200',
      href: '/admin/karyawan',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      iconBg: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: 'Divisi Aktif',
      nilai: statistik.totalDivisiAktif,
      warna: 'text-orange-600',
      bg: 'bg-white',
      border: 'border-cream-200',
      href: null,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      ),
      iconBg: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Task Aktif',
      nilai: statistik.totalTaskAktif,
      warna: 'text-maroon-800',
      bg: 'bg-white',
      border: 'border-cream-200',
      href: null,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" />
        </svg>
      ),
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Task Terlambat',
      nilai: statistik.totalTaskTerlambat,
      warna: statistik.totalTaskTerlambat > 0 ? 'text-red-700' : 'text-slate-800',
      bg: statistik.totalTaskTerlambat > 0 ? 'bg-red-50/50 shadow-sm shadow-red-500/5' : 'bg-white',
      border: statistik.totalTaskTerlambat > 0 ? 'border-red-200' : 'border-cream-200',
      href: null,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      iconBg: statistik.totalTaskTerlambat > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600',
    },
  ]

  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kartu.map((k) => {
          const cardContent = (
            <>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{k.label}</p>
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${k.iconBg}`}>
                  {k.icon}
                </div>
              </div>
              <p className={`text-3xl font-black ${k.warna}`}>{k.nilai}</p>
              {k.href && (
                <p className="mt-2 text-[10px] font-bold text-maroon-700 group-hover:underline">
                  Lihat Detail →
                </p>
              )}
            </>
          )

          return k.href ? (
            <a
              key={k.label}
              href={k.href}
              className={`group block rounded-2xl border ${k.border} ${k.bg} p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-maroon-200 hover:shadow-md`}
            >
              {cardContent}
            </a>
          ) : (
            <div
              key={k.label}
              className={`rounded-2xl border ${k.border} ${k.bg} p-4 shadow-sm`}
            >
              {cardContent}
            </div>
          )
        })}
      </div>

      <div className="mb-5 rounded-2xl border border-cream-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-cream-100 pb-3">
          <h3 className="text-[11px] font-bold tracking-widest text-muted">
            TUGAS YANG SAYA KIRIM {tugasDikirim.length > 0 && `(${tugasDikirim.length})`}
          </h3>
        </div>
        {tugasDikirim.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cream-50 text-muted">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" />
                <line x1="9" y1="12" x2="15" y2="12" />
                <line x1="9" y1="16" x2="13" y2="16" />
              </svg>
            </div>
            <p className="max-w-md text-xs font-bold text-ink">Belum ada tugas yang Anda kirim</p>
            <p className="mt-1 max-w-xs text-[11px] text-muted leading-relaxed font-semibold">
              Buka papan kanban divisi Anda lalu klik tombol &quot;Kirim Tugas&quot; untuk mulai memberikan tugas rutin atau ad-hoc kepada staff.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {tugasDikirim.map((t) => (
              <a
                key={t.id}
                href={`/divisi/${t.divisiId}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2.5 transition hover:bg-cream-50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{t.judul}</p>
                  <p className="text-xs text-muted">
                    {t.divisiNama} · {t.staff.length > 0 ? t.staff.join(', ') : 'Belum ada yang ditag'}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  {t.deadline && (
                    <span className="text-xs text-muted">{formatTenggat(t.deadline)}</span>
                  )}
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      t.selesai
                        ? 'bg-green-100 text-green-700'
                        : t.terlambat
                        ? 'bg-red-100 text-red-700'
                        : 'bg-cream-100 text-muted'
                    }`}
                  >
                    {t.selesai ? 'Selesai' : t.terlambat ? 'Terlambat' : 'Berjalan'}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function IkonPapanSolid() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M8 4v17M16 4v17M3 10h5M16 10h5" />
    </svg>
  )
}
