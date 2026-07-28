'use client'

import { useState } from 'react'
import { buatTemplate, ubahTemplate, type PolaUlang, type RecurringTemplate } from './actions'
import type { AnggotaDivisi } from '../actions'

const PILIHAN_POLA: { value: PolaUlang; label: string }[] = [
  { value: 'daily_workday', label: 'Setiap hari kerja (Senin–Sabtu)' },
  { value: 'daily', label: 'Setiap hari' },
  { value: 'weekly', label: 'Setiap minggu' },
  { value: 'monthly', label: 'Setiap bulan' },
]

const HARI_MINGGU = [
  { value: 1, label: 'Senin' },
  { value: 2, label: 'Selasa' },
  { value: 3, label: 'Rabu' },
  { value: 4, label: 'Kamis' },
  { value: 5, label: 'Jumat' },
  { value: 6, label: 'Sabtu' },
  { value: 0, label: 'Minggu' },
]

const PILIHAN_PRIORITAS = [
  { value: 'rendah', label: 'Rendah' },
  { value: 'sedang', label: 'Sedang' },
  { value: 'tinggi', label: 'Tinggi' },
  { value: 'mendesak', label: 'Mendesak' },
]

type Board = { id: string; nama: string }

export default function FormTemplate({
  divisionId,
  boards,
  anggota,
  templateEdit,
  onSelesai,
  onBatal,
}: {
  divisionId: string
  boards: Board[]
  anggota: AnggotaDivisi[]
  templateEdit?: RecurringTemplate
  onSelesai: () => void
  onBatal: () => void
}) {
  const [boardId, setBoardId] = useState(templateEdit?.boardId ?? boards[0]?.id ?? '')
  const [judul, setJudul] = useState(templateEdit?.judul ?? '')
  const [deskripsi, setDeskripsi] = useState(templateEdit?.deskripsi ?? '')
  const [prioritas, setPrioritas] = useState(templateEdit?.prioritas ?? 'sedang')
  const [pola, setPola] = useState<PolaUlang>(templateEdit?.pola ?? 'daily_workday')
  const [dayOfWeek, setDayOfWeek] = useState<number | null>(templateEdit?.dayOfWeek ?? null)
  const [dayOfMonth, setDayOfMonth] = useState<number | null>(templateEdit?.dayOfMonth ?? null)
  const [dueOffsetHari, setDueOffsetHari] = useState(templateEdit?.dueOffsetHari ?? 0)
  const [tanggalMulai, setTanggalMulai] = useState(templateEdit?.tanggalMulai ?? '')
  const [tanggalSelesai, setTanggalSelesai] = useState(templateEdit?.tanggalSelesai ?? '')
  const [assigneeIds, setAssigneeIds] = useState<string[]>(templateEdit?.assigneeIds ?? [])
  const [pesan, setPesan] = useState<string | null>(null)
  const [sedangSimpan, setSedangSimpan] = useState(false)

  function toggleAssignee(id: string) {
    setAssigneeIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function tanganiSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPesan(null)
    setSedangSimpan(true)

    const data = {
      boardId,
      judul,
      deskripsi: deskripsi ?? '',
      prioritas,
      assigneeIds,
      pola,
      dayOfWeek: pola === 'weekly' ? dayOfWeek : null,
      dayOfMonth: pola === 'monthly' ? dayOfMonth : null,
      dueOffsetHari,
      tanggalMulai,
      tanggalSelesai,
    }

    const hasil = templateEdit
      ? await ubahTemplate(divisionId, templateEdit.id, data)
      : await buatTemplate(divisionId, data)

    setSedangSimpan(false)

    if (!hasil.sukses) {
      setPesan(hasil.pesan)
      return
    }

    onSelesai()
  }

  const tanggalDalamBulan = Array.from({ length: 31 }, (_, i) => i + 1)

  return (
    <form onSubmit={tanganiSubmit} className="space-y-4 rounded-2xl border border-cream-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-bold text-maroon-800">
        {templateEdit ? 'Ubah Template' : 'Buat Template Baru'}
      </h3>

      <div>
        <label className="mb-1 block text-xs font-semibold text-muted">Board</label>
        <select
          value={boardId}
          onChange={e => setBoardId(e.target.value)}
          required
          className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2.5 text-sm text-ink outline-none focus:border-orange-500"
        >
          {boards.map(b => (
            <option key={b.id} value={b.id}>{b.nama}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-muted">Judul Tugas</label>
        <input
          type="text"
          value={judul}
          onChange={e => setJudul(e.target.value)}
          required
          maxLength={255}
          placeholder="Contoh: Laporan harian divisi"
          className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2.5 text-sm text-ink outline-none focus:border-orange-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Pola Pengulangan</label>
          <select
            value={pola}
            onChange={e => setPola(e.target.value as PolaUlang)}
            className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2.5 text-sm text-ink outline-none focus:border-orange-500"
          >
            {PILIHAN_POLA.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Prioritas</label>
          <select
            value={prioritas}
            onChange={e => setPrioritas(e.target.value)}
            className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2.5 text-sm text-ink outline-none focus:border-orange-500"
          >
            {PILIHAN_PRIORITAS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {pola === 'weekly' && (
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Hari dalam Minggu</label>
          <select
            value={dayOfWeek ?? ''}
            onChange={e => setDayOfWeek(e.target.value === '' ? null : Number(e.target.value))}
            required
            className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2.5 text-sm text-ink outline-none focus:border-orange-500"
          >
            <option value="">Pilih hari...</option>
            {HARI_MINGGU.map(h => (
              <option key={h.value} value={h.value}>{h.label}</option>
            ))}
          </select>
        </div>
      )}

      {pola === 'monthly' && (
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Tanggal dalam Bulan</label>
          <select
            value={dayOfMonth ?? ''}
            onChange={e => setDayOfMonth(e.target.value === '' ? null : Number(e.target.value))}
            required
            className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2.5 text-sm text-ink outline-none focus:border-orange-500"
          >
            <option value="">Pilih tanggal...</option>
            {tanggalDalamBulan.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-semibold text-muted">
          Tenggat Otomatis (hari setelah dibuat)
        </label>
        <input
          type="number"
          value={dueOffsetHari}
          onChange={e => setDueOffsetHari(Math.max(0, Number(e.target.value)))}
          min={0}
          className="w-32 rounded-lg border border-cream-200 bg-cream-50 px-3 py-2.5 text-sm text-ink outline-none focus:border-orange-500"
        />
        <span className="ml-2 text-xs text-muted">hari (0 = tidak ada tenggat)</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Tanggal Mulai</label>
          <input
            type="date"
            value={tanggalMulai}
            onChange={e => setTanggalMulai(e.target.value)}
            required
            className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2.5 text-sm text-ink outline-none focus:border-orange-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Tanggal Selesai (opsional)</label>
          <input
            type="date"
            value={tanggalSelesai}
            onChange={e => setTanggalSelesai(e.target.value)}
            className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2.5 text-sm text-ink outline-none focus:border-orange-500"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-muted">Penanggung Jawab</label>
        <div className="flex flex-wrap gap-2">
          {anggota.map(a => (
            <button
              key={a.id}
              type="button"
              onClick={() => toggleAssignee(a.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                assigneeIds.includes(a.id)
                  ? 'border-maroon-700 bg-maroon-800 text-cream-50'
                  : 'border-cream-200 bg-cream-50 text-ink'
              }`}
            >
              {a.nama}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-muted">Deskripsi (opsional)</label>
        <textarea
          value={deskripsi}
          onChange={e => setDeskripsi(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm text-ink outline-none focus:border-orange-500"
        />
      </div>

      {pesan && <p className="text-sm text-red-700">{pesan}</p>}

      <div className="flex items-center justify-end gap-3 border-t border-cream-200 pt-3">
        <button
          type="button"
          onClick={onBatal}
          className="rounded-xl border border-cream-200 px-4 py-2.5 text-sm font-bold text-muted transition hover:bg-cream-100"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={sedangSimpan}
          className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/25 transition hover:bg-orange-600 disabled:opacity-50"
        >
          {sedangSimpan ? 'Menyimpan...' : templateEdit ? 'Simpan Perubahan' : 'Buat Template'}
        </button>
      </div>
    </form>
  )
}
