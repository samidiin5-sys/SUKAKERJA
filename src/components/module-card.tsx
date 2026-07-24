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
      className="group flex flex-col rounded-2xl border border-cream-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg} text-white`}>
          {icon}
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-cream-200 text-muted transition group-hover:border-orange-500 group-hover:text-orange-600">
          ↗
        </span>
      </div>
      <p className="font-bold text-ink">{judul}</p>
      <p className="mt-1 text-sm text-muted">{deskripsi}</p>
      <span className="mt-4 text-xs font-bold tracking-wide text-orange-600">BUKA MODUL —</span>
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
    <div className="flex flex-col rounded-2xl border border-dashed border-cream-200 bg-cream-50 p-5 opacity-70">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-cream-200 text-muted">
        {icon}
      </div>
      <p className="font-bold text-ink">{judul}</p>
      <p className="mt-1 text-sm text-muted">{deskripsi}</p>
      <span className="mt-4 text-xs font-bold tracking-wide text-muted">SEGERA HADIR</span>
    </div>
  )
}
