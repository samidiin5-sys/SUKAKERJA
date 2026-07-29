'use client'

import { useState } from 'react'
import { tinjauProposal, type ProposalMenunggu } from '@/app/(main)/tugas-tersedia/actions'

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatWaktu(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function TinjauProposalList({ proposalsAwal }: { proposalsAwal: ProposalMenunggu[] }) {
  const [proposals, setProposals] = useState<ProposalMenunggu[]>(proposalsAwal)
  const [sedang, setSedang] = useState<string | null>(null)
  const [catatanMap, setCatatanMap] = useState<Record<string, string>>({})
  const [pesanMap, setPesanMap] = useState<Record<string, string>>({})

  async function tangani(proposalId: string, keputusan: 'disetujui' | 'ditolak') {
    setSedang(`${proposalId}-${keputusan}`)
    const catatan = catatanMap[proposalId] ?? ''
    const hasil = await tinjauProposal(proposalId, keputusan, catatan)
    setSedang(null)
    if (hasil.sukses) {
      setProposals((prev) => prev.filter((p) => p.id !== proposalId))
    } else {
      setPesanMap((prev) => ({ ...prev, [proposalId]: hasil.pesan }))
    }
  }

  if (proposals.length === 0) {
    return (
      <div className="rounded-2xl border border-cream-200 bg-white p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cream-100">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
            <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 0 0 1.946-.806 3.42 3.42 0 0 1 4.438 0 3.42 3.42 0 0 0 1.946.806 3.42 3.42 0 0 1 3.138 3.138 3.42 3.42 0 0 0 .806 1.946 3.42 3.42 0 0 1 0 4.438 3.42 3.42 0 0 0-.806 1.946 3.42 3.42 0 0 1-3.138 3.138 3.42 3.42 0 0 0-1.946.806 3.42 3.42 0 0 1-4.438 0 3.42 3.42 0 0 0-1.946-.806 3.42 3.42 0 0 1-3.138-3.138 3.42 3.42 0 0 0-.806-1.946 3.42 3.42 0 0 1 0-4.438 3.42 3.42 0 0 0 .806-1.946 3.42 3.42 0 0 1 3.138-3.138Z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-muted">Tidak ada pengajuan yang perlu ditinjau.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {proposals.map((p) => (
        <div key={p.id} className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-maroon-50 text-sm font-black text-maroon-800">
              {p.staffNama[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-ink">{p.staffNama}</p>
              <p className="text-xs text-muted">ingin mengambil tugas dari {p.divisiNama}</p>
            </div>
            <span className="rounded bg-cream-100 px-2 py-0.5 text-[10px] text-muted">
              {formatTanggal(p.createdAt)}
            </span>
          </div>

          <div className="mb-3 rounded-xl border border-cream-200 bg-cream-50 p-3">
            <p className="text-xs font-bold text-maroon-800">{p.taskJudul}</p>
            <p className="mt-2 text-[10px] font-semibold text-muted">DEADLINE DIUSULKAN</p>
            <p className="mt-0.5 text-sm font-bold text-orange-600">
              {formatTanggal(p.deadlineDiusulkan)} · {formatWaktu(p.deadlineDiusulkan)}
            </p>
            {p.pesan && (
              <>
                <p className="mt-2 text-[10px] font-semibold text-muted">PESAN STAFF</p>
                <p className="mt-0.5 text-xs text-ink">{p.pesan}</p>
              </>
            )}
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-[10px] font-semibold text-muted">
              Catatan untuk staff <span className="font-normal">(opsional)</span>
            </label>
            <input
              type="text"
              value={catatanMap[p.id] ?? ''}
              onChange={(e) => setCatatanMap((prev) => ({ ...prev, [p.id]: e.target.value }))}
              placeholder="Misal: silakan mulai Senin ya..."
              className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm text-ink outline-none focus:border-orange-500"
            />
          </div>

          {pesanMap[p.id] && (
            <p className="mb-2 text-xs text-red-600">{pesanMap[p.id]}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => tangani(p.id, 'ditolak')}
              disabled={sedang !== null}
              className="flex-1 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
            >
              {sedang === `${p.id}-ditolak` ? 'Menolak...' : 'Tolak'}
            </button>
            <button
              onClick={() => tangani(p.id, 'disetujui')}
              disabled={sedang !== null}
              className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-bold text-white transition hover:bg-green-700 disabled:opacity-50"
            >
              {sedang === `${p.id}-disetujui` ? 'Menyetujui...' : 'Setujui & Assign'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
