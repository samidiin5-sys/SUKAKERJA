'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { buatTarget, hapusTarget, ubahTarget, type RealisasiTarget, type StatusTarget } from './actions'
import type { AnggotaDivisi } from '../actions'

const LABEL_STATUS: Record<StatusTarget, string> = {
  completed: 'Tercapai',
  on_track: 'Sesuai Jalur',
  at_risk: 'Berisiko',
}

const WARNA_BAR: Record<StatusTarget, string> = {
  completed: 'bg-green-500',
  on_track: 'bg-blue-500',
  at_risk: 'bg-yellow-400',
}

const WARNA_BADGE: Record<StatusTarget, string> = {
  completed: 'bg-green-100 text-green-800',
  on_track: 'bg-blue-100 text-blue-800',
  at_risk: 'bg-yellow-100 text-yellow-800',
}

function formatTanggal(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function TargetClient({
  divisionId,
  anggota,
  realisasiAwal,
  bolehKelola,
  currentUserId,
}: {
  divisionId: string
  anggota: AnggotaDivisi[]
  realisasiAwal: RealisasiTarget[]
  bolehKelola: boolean
  currentUserId: string
}) {
  const router = useRouter()
  const [formTerbuka, setFormTerbuka] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [userId, setUserId] = useState(anggota[0]?.id ?? '')
  const [periodeMulai, setPeriodeMulai] = useState('')
  const [periodeSelesai, setPeriodeSelesai] = useState('')
  const [jumlahTarget, setJumlahTarget] = useState('10')
  const [keterangan, setKeterangan] = useState('')
  const [sedangProses, setSedangProses] = useState(false)
  const [pesan, setPesan] = useState<string | null>(null)

  const daftarTampil = bolehKelola ? realisasiAwal : realisasiAwal.filter((r) => r.userId === currentUserId)

  function bukaFormBaru() {
    setEditId(null)
    setUserId(anggota[0]?.id ?? '')
    setPeriodeMulai('')
    setPeriodeSelesai('')
    setJumlahTarget('10')
    setKeterangan('')
    setPesan(null)
    setFormTerbuka(true)
  }

  function bukaFormEdit(t: RealisasiTarget) {
    setEditId(t.id)
    setUserId(t.userId)
    setPeriodeMulai(t.periodeMulai.slice(0, 10))
    setPeriodeSelesai(t.periodeSelesai.slice(0, 10))
    setJumlahTarget(String(t.jumlahTarget))
    setKeterangan(t.keterangan ?? '')
    setPesan(null)
    setFormTerbuka(true)
  }

  async function simpan(e: React.FormEvent) {
    e.preventDefault()
    setSedangProses(true)
    setPesan(null)

    const jumlah = parseInt(jumlahTarget, 10)
    const hasil = editId
      ? await ubahTarget(divisionId, editId, periodeMulai, periodeSelesai, jumlah, keterangan)
      : await buatTarget(divisionId, userId, periodeMulai, periodeSelesai, jumlah, keterangan)

    setSedangProses(false)

    if (!hasil.sukses) {
      setPesan(hasil.pesan)
      return
    }

    setFormTerbuka(false)
    router.refresh()
  }

  async function tanganiHapus(id: string) {
    if (!confirm('Hapus target ini?')) return
    const hasil = await hapusTarget(divisionId, id)
    if (!hasil.sukses) {
      alert(hasil.pesan)
      return
    }
    router.refresh()
  }

  return (
    <div>
      {bolehKelola && (
        <div className="mb-4">
          {!formTerbuka ? (
            <button
              onClick={bukaFormBaru}
              className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/25 hover:bg-orange-600"
            >
              + Buat Target
            </button>
          ) : (
            <form onSubmit={simpan} className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-bold text-maroon-800">{editId ? 'Ubah Target' : 'Target Baru'}</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">Anggota</label>
                  <select
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    disabled={!!editId}
                    className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-orange-500 disabled:opacity-50"
                  >
                    {anggota.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nama}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">Jumlah Target (task)</label>
                  <input
                    type="number"
                    min={1}
                    value={jumlahTarget}
                    onChange={(e) => setJumlahTarget(e.target.value)}
                    className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">Periode Mulai</label>
                  <input
                    type="date"
                    value={periodeMulai}
                    onChange={(e) => setPeriodeMulai(e.target.value)}
                    required
                    className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">Periode Selesai</label>
                  <input
                    type="date"
                    value={periodeSelesai}
                    onChange={(e) => setPeriodeSelesai(e.target.value)}
                    required
                    className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-orange-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-muted">Keterangan (opsional)</label>
                  <textarea
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {pesan && <p className="mt-2 text-sm text-red-700">{pesan}</p>}

              <div className="mt-3 flex gap-2">
                <button
                  type="submit"
                  disabled={sedangProses}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-xs font-bold text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {sedangProses ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={() => setFormTerbuka(false)}
                  className="rounded-lg border border-cream-200 px-4 py-2 text-xs font-semibold text-muted hover:bg-cream-100"
                >
                  Batal
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {daftarTampil.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cream-200 bg-white p-8 text-center">
          <p className="text-sm text-muted">Belum ada target yang ditetapkan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {daftarTampil.map((t) => (
            <div key={t.id} className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-ink">{t.userNama}</p>
                  <p className="text-xs text-muted">
                    {formatTanggal(t.periodeMulai)} — {formatTanggal(t.periodeSelesai)}
                  </p>
                  {t.keterangan && <p className="mt-1 text-xs text-muted">{t.keterangan}</p>}
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${WARNA_BADGE[t.status]}`}>
                  {LABEL_STATUS[t.status]}
                </span>
              </div>

              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-xs font-semibold text-muted">
                  <span>
                    {t.realisasi} / {t.jumlahTarget} task
                  </span>
                  <span>{t.persentase}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-cream-200">
                  <div
                    className={`h-full rounded-full ${WARNA_BAR[t.status]} transition-all`}
                    style={{ width: `${Math.min(100, t.persentase)}%` }}
                  />
                </div>
              </div>

              {bolehKelola && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => bukaFormEdit(t)}
                    className="rounded-full border border-cream-200 px-3 py-1 text-[11px] font-semibold text-maroon-700 hover:border-orange-500 hover:text-orange-600"
                  >
                    Ubah
                  </button>
                  <button
                    onClick={() => tanganiHapus(t.id)}
                    className="rounded-full border border-red-200 px-3 py-1 text-[11px] font-semibold text-red-700 hover:border-red-400"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
