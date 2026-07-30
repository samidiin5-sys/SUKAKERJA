'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ambilJumlahBelumDibaca,
  ambilNotifikasiSaya,
  tandaiDibaca,
  tandaiSemuaDibaca,
  type NotifikasiItem,
} from '@/app/notifikasi/actions'

function formatWaktu(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function NotifikasiBell() {
  const router = useRouter()
  const [terbuka, setTerbuka] = useState(false)
  const [jumlahBelumDibaca, setJumlahBelumDibaca] = useState(0)
  const [daftar, setDaftar] = useState<NotifikasiItem[]>([])
  const [sedangMuat, setSedangMuat] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let batal = false
    async function muatJumlah() {
      const jumlah = await ambilJumlahBelumDibaca()
      if (!batal) setJumlahBelumDibaca(jumlah)
    }
    muatJumlah()
    const interval = setInterval(muatJumlah, 30000)
    return () => {
      batal = true
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    function tanganiKlikLuar(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setTerbuka(false)
      }
    }
    function tanganiKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setTerbuka(false)
      }
    }
    document.addEventListener('mousedown', tanganiKlikLuar)
    document.addEventListener('keydown', tanganiKeyDown)
    return () => {
      document.removeEventListener('mousedown', tanganiKlikLuar)
      document.removeEventListener('keydown', tanganiKeyDown)
    }
  }, [])

  async function bukaDropdown() {
    const akanTerbuka = !terbuka
    setTerbuka(akanTerbuka)
    if (akanTerbuka) {
      setSedangMuat(true)
      const data = await ambilNotifikasiSaya()
      setDaftar(data)
      setSedangMuat(false)
    }
  }

  async function tanganiKlikItem(item: NotifikasiItem) {
    if (!item.isRead) {
      await tandaiDibaca(item.id)
      setDaftar((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)))
      setJumlahBelumDibaca((prev) => Math.max(0, prev - 1))
    }
    setTerbuka(false)
    if (item.jenis === 'task_pool_baru') {
      router.push('/tugas-tersedia')
    } else if (item.jenis === 'lembur_disetujui' || item.jenis === 'lembur_ditolak') {
      router.push('/lembur')
    } else if (item.jenis === 'task_terlambat' && item.divisionId) {
      router.push(`/divisi/${item.divisionId}`)
    } else if (item.divisionId) {
      router.push(`/divisi/${item.divisionId}`)
    }
  }

  async function tanganiTandaiSemua() {
    await tandaiSemuaDibaca()
    setDaftar((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setJumlahBelumDibaca(0)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={bukaDropdown}
        className="relative flex h-9 w-9 items-center justify-center rounded-[14px] border border-transparent text-maroon-800 transition hover:border-cream-200 hover:bg-cream-50"
        aria-label="Notifikasi"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 8a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5Z" />
          <path d="M10 18.5a2 2 0 0 0 4 0" />
        </svg>
        {jumlahBelumDibaca > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-sm">
            {jumlahBelumDibaca > 9 ? '9+' : jumlahBelumDibaca}
          </span>
        )}
      </button>

      {terbuka && (
        <div className="absolute right-0 z-40 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-[22px] border border-cream-200 bg-white shadow-[0_18px_45px_rgba(92,31,33,0.08)]">
          <div className="flex items-center justify-between border-b border-cream-200 px-4 py-2.5">
            <p className="text-xs font-bold text-maroon-800">Notifikasi</p>
            {jumlahBelumDibaca > 0 && (
              <button onClick={tanganiTandaiSemua} className="text-[11px] font-semibold text-orange-600 hover:underline">
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {sedangMuat && <p className="p-4 text-center text-xs text-muted">Memuat...</p>}
            {!sedangMuat && daftar.length === 0 && (
              <p className="p-4 text-center text-xs text-muted">Belum ada notifikasi.</p>
            )}
            {!sedangMuat &&
              daftar.map((n) => (
                <button
                  key={n.id}
                  onClick={() => tanganiKlikItem(n)}
                  className={`block w-full border-b border-cream-100 px-4 py-2.5 text-left text-xs transition hover:bg-cream-50 ${
                    n.isRead ? 'text-muted' : 'bg-orange-400/10 text-ink'
                  }`}
                >
                  <p className={n.isRead ? '' : 'font-semibold'}>{n.pesan}</p>
                  <p className="mt-0.5 text-[10px] text-muted">{formatWaktu(n.createdAt)}</p>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
