export function ModuleCard({
  icon,
  iconBg,
  judul,
  deskripsi,
  href,
}: {
  icon: React.ReactNode
  iconBg: string
  judul: string
  deskripsi: string
  href: string
}) {
  return (
    <a
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-[24px] border border-cream-200 bg-white/95 p-5 shadow-[0_18px_45px_rgba(92,31,33,0.06)] transition duration-200 hover:-translate-y-1 hover:border-maroon-200 hover:bg-cream-50/70 hover:shadow-[0_24px_60px_rgba(92,31,33,0.1)]"
    >
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-maroon-600 to-amber-400 opacity-80" />
      <div className="mb-4 flex items-start justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg} text-white shadow-sm ring-1 ring-white/40`}>
          {icon}
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-cream-200 bg-white text-muted transition duration-200 group-hover:-translate-y-0.5 group-hover:border-orange-500 group-hover:text-orange-600">
          ↗
        </span>
      </div>
      <p className="font-black text-ink">{judul}</p>
      <p className="mt-1 text-sm leading-6 text-muted">{deskripsi}</p>
      <span className="mt-4 text-[11px] font-black tracking-[0.24em] text-orange-600">BUKA MODUL</span>
    </a>
  )
}

export function ModuleCardDisabled({
  icon,
  judul,
  deskripsi,
}: {
  icon: React.ReactNode
  judul: string
  deskripsi: string
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[24px] border border-dashed border-cream-200 bg-cream-50/80 p-5 opacity-80 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cream-200 text-muted ring-1 ring-white/60">
        {icon}
      </div>
      <p className="font-black text-ink">{judul}</p>
      <p className="mt-1 text-sm leading-6 text-muted">{deskripsi}</p>
      <span className="mt-4 text-[11px] font-black tracking-[0.24em] text-muted">SEGERA HADIR</span>
    </div>
  )
}
