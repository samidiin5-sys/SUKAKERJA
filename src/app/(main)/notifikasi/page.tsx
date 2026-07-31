'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
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

export default function HalamanNotifikasi() {
  const router = useRouter()
  const [daftar, setDaftar] = useState<NotifikasiItem[]>([])
  const [sedangMuat, setSedangMuat] = useState(true)
  const [jumlahBelumDibaca, setJumlahBelumDibaca] = useState(0)

  async function muatData() {
    setSedangMuat(true)
    try {
      const data = await ambilNotifikasiSaya()
      setDaftar(data)
      setJumlahBelumDibaca(data.filter((n) => !n.isRead).length)
    } catch (e) {
      console.error(e)
    } finally {
      setSedangMuat(false)
    }
  }

  useEffect(() => {
    muatData()
  }, [])

  async function tanganiKlikItem(item: NotifikasiItem) {
    if (!item.isRead) {
      await tandaiDibaca(item.id)
      setDaftar((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)))
      setJumlahBelumDibaca((prev) => Math.max(0, prev - 1))
    }
    
    // Redirect logic
    if (item.jenis === 'task_pool_baru') {
      router.push('/tugas-tersedia')
    } else if (item.jenis === 'lembur_disetujui' || item.jenis === 'lembur_ditolak') {
      router.push('/lembur')
    } else if (item.divisionId) {
      router.push(`/divisi/${item.divisionId}${item.taskId ? `?task=${item.taskId}` : ''}`)
    }
  }

  async function tanganiTandaiSemua() {
    await tandaiSemuaDibaca()
    setDaftar((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setJumlahBelumDibaca(0)
  }

  return (
    <div className="mx-auto max-w-2xl w-full px-4">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-maroon-800">Notifikasi Saya</h1>
          <p className="text-xs text-muted mt-1">Lihat dan kelola pemberitahuan tugas Anda</p>
        </div>
        {jumlahBelumDibaca > 0 && (
          <button
            onClick={tanganiTandaiSemua}
            className="rounded-full bg-cream-200 hover:bg-cream-300 text-maroon-900 px-4 py-2 text-xs font-bold transition shadow-sm"
          >
            Tandai Semua Dibaca
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-cream-200 bg-white shadow-sm overflow-hidden">
        {sedangMuat ? (
          <div className="py-12 text-center text-xs font-semibold text-muted animate-pulse">
            Memuat notifikasi...
          </div>
        ) : daftar.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted">
            Tidak ada notifikasi baru untuk Anda saat ini.
          </div>
        ) : (
          <div className="divide-y divide-cream-100">
            {daftar.map((item) => (
              <button
                key={item.id}
                onClick={() => tanganiKlikItem(item)}
                className={`w-full text-left p-4 flex gap-4 transition hover:bg-cream-50/50 ${
                  item.isRead ? 'text-muted/80' : 'bg-orange-400/5 text-ink'
                }`}
              >
                {/* Visual state indicator */}
                <div className="mt-1 shrink-0">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      item.isRead ? 'bg-cream-300' : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)] animate-pulse'
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-xs sm:text-sm leading-relaxed ${item.isRead ? 'font-normal' : 'font-bold text-ink'}`}>
                    {item.pesan}
                  </p>
                  <p className="mt-1.5 text-[10px] text-muted font-medium">
                    {formatWaktu(item.createdAt)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
