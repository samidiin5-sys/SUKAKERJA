'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

type Section = {
  id: string
  nomor: string
  judul: string
  icon: React.ReactNode
  content: React.ReactNode
}

export default function PanduanLayout({
  judul,
  deskripsi,
  badge,
  sections,
  tips,
  footerLinks,
}: {
  judul: string
  deskripsi: string
  badge: string
  sections: Section[]
  tips?: { icon: React.ReactNode; items: string[]; judul?: string }
  footerLinks?: { label: string; href: string; primary?: boolean }[]
}) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? '')
  const [isTocSticky, setIsTocSticky] = useState(false)

  useEffect(() => {
    const tocSentinel = document.getElementById('toc-sentinel')
    if (!tocSentinel) return

    const stickyObserver = new IntersectionObserver(
      ([entry]) => {
        setIsTocSticky(!entry.isIntersecting)
      },
      { threshold: 0 }
    )
    stickyObserver.observe(tocSentinel)
    return () => stickyObserver.disconnect()
  }, [])

  useEffect(() => {
    const sectionElements = sections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean) as HTMLElement[]

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )

    sectionElements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [sections])

  function scrollToSection(id: string) {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="relative mx-auto max-w-5xl">
      <div id="toc-sentinel" className="pointer-events-none absolute top-0 h-px" />

      <div className="flex gap-8 lg:gap-12">
        <div
          className={`hidden w-56 shrink-0 transition-all duration-300 lg:block ${
            isTocSticky ? 'lg:sticky lg:self-start' : ''
          }`}
          style={isTocSticky ? { top: '6rem' } : undefined}
        >
          <nav className="relative border-l border-cream-200 pl-0">
            <p className="mb-3 text-[10px] font-bold tracking-[0.2em] text-muted/70 uppercase pl-4">
              Daftar Isi
            </p>
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`block w-full py-2 text-left text-xs transition-all duration-200 pl-4 border-l-2 -ml-px ${
                  activeId === section.id
                    ? 'border-maroon-600 bg-maroon-50/50 text-maroon-800 font-bold rounded-r-lg'
                    : 'border-transparent text-muted/70 hover:text-ink hover:bg-cream-50 rounded-r-lg'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-muted/40 tabular-nums">{section.nomor}</span>
                  <span className="truncate">{section.judul}</span>
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="min-w-0 flex-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-10"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-[10px] font-bold tracking-wider text-orange-700 border border-orange-200/50">
                {badge}
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">
              {judul}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-muted max-w-2xl">
              {deskripsi}
            </p>
          </motion.div>

          <div className="mb-10 border-t border-cream-200" />

          <div className="space-y-14">
            {sections.map((section, index) => (
              <motion.section
                key={section.id}
                id={section.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="scroll-mt-24"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-maroon-800 to-maroon-700 text-white shadow-sm">
                    {section.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5 mb-1">
                      <span className="text-[11px] font-bold text-muted/60 tabular-nums">
                        {section.nomor}
                      </span>
                      <h2 className="text-xl font-black text-ink">{section.judul}</h2>
                    </div>
                    {section.content}
                  </div>
                </div>
                {index < sections.length - 1 && (
                  <div className="mt-14 border-t border-cream-100" />
                )}
              </motion.section>
            ))}
          </div>

          {tips && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="mt-14 rounded-2xl border border-orange-200/50 bg-linear-to-br from-orange-50/60 to-amber-50/30 p-6"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
                  {tips.icon}
                </div>
                <p className="text-sm font-black text-orange-800">
                  {tips.judul ?? 'Tips'}
                </p>
              </div>
              <ul className="space-y-2.5">
                {tips.items.map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-ink/80">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {footerLinks && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mt-10 flex flex-wrap gap-3 border-t border-cream-200 pt-8"
            >
              {footerLinks.map((link) =>
                link.primary ? (
                  <a
                    key={link.href}
                    href={link.href}
                    className="inline-flex items-center gap-2 rounded-xl bg-maroon-800 px-5 py-2.5 text-sm font-bold text-cream-50 shadow-sm transition hover:bg-maroon-700 active:scale-95"
                  >
                    {link.label}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </a>
                ) : (
                  <a
                    key={link.href}
                    href={link.href}
                    className="inline-flex items-center gap-2 rounded-xl border border-cream-200 bg-white px-5 py-2.5 text-sm font-bold text-maroon-800 shadow-sm transition hover:border-orange-300 hover:text-orange-600 active:scale-95"
                  >
                    {link.label}
                  </a>
                )
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export function PanduanText({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-muted mb-3">{children}</p>
}

export function PanduanSub({ judul, children }: { judul: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <h3 className="text-sm font-bold text-ink mb-1.5 flex items-center gap-2">
        <span className="h-1 w-1 rounded-full bg-maroon-600" />
        {judul}
      </h3>
      <div className="ml-3 pl-3 border-l border-cream-100">
        {children}
      </div>
    </div>
  )
}

export function PanduanTip({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 flex items-start gap-2 rounded-xl bg-orange-50/60 border border-orange-100/60 px-3.5 py-2.5">
      <span className="mt-0.5 shrink-0 text-sm">💡</span>
      <p className="text-xs leading-relaxed text-orange-800 font-medium">{children}</p>
    </div>
  )
}

export function PanduanKode({ children }: { children: React.ReactNode }) {
  return (
    <code className="inline-flex items-center rounded-md bg-cream-100 px-2 py-0.5 text-xs font-mono font-semibold text-maroon-800">
      {children}
    </code>
  )
}
