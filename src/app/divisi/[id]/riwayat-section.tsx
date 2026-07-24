'use client'

import { useEffect, useState } from 'react'
import { ambilRiwayatTask, type RiwayatItem } from './actions'

function formatWaktu(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function RiwayatSection({
  divisionId,
  taskId,
}: {
  divisionId: string
  taskId: string
}) {
  const [daftar, setDaftar] = useState<RiwayatItem[]>([])
  const [terbuka, setTerbuka] = useState(false)
  const [sedangMuat, setSedangMuat] = useState(false)

  useEffect(() => {
    if (!terbuka) return
    let batal = false
    setSedangMuat(true)
    ambilRiwayatTask(divisionId, taskId).then((data) => {
      if (batal) return
      setDaftar(data)
      setSedangMuat(false)
    })
    return () => {
      batal = true
    }
  }, [terbuka, divisionId, taskId])

  return (
    <div>
      <button
        type="button"
        onClick={() => setTerbuka((t) => !t)}
        className="text-xs font-semibold text-muted hover:text-maroon-700"
      >
        {terbuka ? '▾' : '▸'} Riwayat Perubahan
      </button>

      {terbuka && (
        <div className="mt-2 space-y-1.5">
          {sedangMuat && <p className="text-xs text-muted">Memuat riwayat...</p>}
          {!sedangMuat && daftar.length === 0 && (
            <p className="text-xs text-muted">Belum ada riwayat tercatat.</p>
          )}
          {daftar.map((r) => (
            <p key={r.id} className="text-xs text-muted">
              <span className="font-semibold text-ink">{r.actorNama}</span> {r.label}{' '}
              <span className="italic">&ldquo;{r.objekNama}&rdquo;</span>
              <span className="ml-1 text-[10px]">&middot; {formatWaktu(r.createdAt)}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
