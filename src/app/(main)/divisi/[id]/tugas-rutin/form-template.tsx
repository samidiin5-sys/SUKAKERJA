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

export default function FormTemplate({
  divisionId,
  anggota,
  templateEdit,
  onSelesai,
  onBatal,
}: {
  divisionId: string
  anggota: AnggotaDivisi[]
  templateEdit?: RecurringTemplate
  onSelesai: () => void
  onBatal: () => void
}) {
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
    <form onSubmit={tanganiSubmit} className="space-y-4 rounded-3xl border border-cream-200 bg-white p-5 shadow-[0_14px_40px_rgba(92,31,33,0.05)]">
      <h3 className="text-sm font-black text-maroon-800 border-b border-cream-100 pb-2">
        {templateEdit ? 'Ubah Template' : 'Buat Template Baru'}
      </h3>

      <div>
        <label className="mb-1 block text-xs font-semibold text-muted">Judul Tugas</label>
        <input
          type="text"
          value={judul}
          onChange={e => setJudul(e.target.value)}
          required
          maxLength={255}
          placeholder="Contoh: Laporan harian divisi"
          className="w-full rounded-xl border border-cream-200 bg-cream-50/50 px-3.5 py-2.5 text-xs font-bold text-ink outline-none focus:border-maroon-800 focus:bg-white transition-all shadow-inner"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Pola Pengulangan</label>
          <select
            value={pola}
            onChange={e => setPola(e.target.value as PolaUlang)}
            className="w-full rounded-xl border border-cream-200 bg-cream-50/50 px-3.5 py-2.5 text-xs font-bold text-ink outline-none focus:border-maroon-800 focus:bg-white transition-all cursor-pointer shadow-inner"
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
            className="w-full rounded-xl border border-cream-200 bg-cream-50/50 px-3.5 py-2.5 text-xs font-bold text-ink outline-none focus:border-maroon-800 focus:bg-white transition-all cursor-pointer shadow-inner"
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
            className="w-full rounded-xl border border-cream-200 bg-cream-50/50 px-3.5 py-2.5 text-xs font-bold text-ink outline-none focus:border-maroon-800 focus:bg-white transition-all cursor-pointer shadow-inner"
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
            className="w-full rounded-xl border border-cream-200 bg-cream-50/50 px-3.5 py-2.5 text-xs font-bold text-ink outline-none focus:border-maroon-800 focus:bg-white transition-all cursor-pointer shadow-inner"
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
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={dueOffsetHari}
            onChange={e => setDueOffsetHari(Math.max(0, Number(e.target.value)))}
            min={0}
            className="w-24 rounded-xl border border-cream-200 bg-cream-50/50 px-3.5 py-2.5 text-xs font-bold text-ink outline-none focus:border-maroon-800 focus:bg-white transition-all shadow-inner"
          />
          <span className="text-xs text-muted font-semibold">hari (0 = tidak ada tenggat)</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Tanggal Mulai</label>
          <input
            type="date"
            value={tanggalMulai}
            onChange={e => setTanggalMulai(e.target.value)}
            required
            className="w-full rounded-xl border border-cream-200 bg-cream-50/50 px-3.5 py-2.5 text-xs font-bold text-ink outline-none focus:border-maroon-800 focus:bg-white transition-all shadow-inner"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Tanggal Selesai (opsional)</label>
          <input
            type="date"
            value={tanggalSelesai}
            onChange={e => setTanggalSelesai(e.target.value)}
            className="w-full rounded-xl border border-cream-200 bg-cream-50/50 px-3.5 py-2.5 text-xs font-bold text-ink outline-none focus:border-maroon-800 focus:bg-white transition-all shadow-inner"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted">Penanggung Jawab (Assignee)</label>
        <div className="flex flex-wrap gap-2 rounded-xl border border-cream-200 bg-cream-50/20 p-3 shadow-inner">
          {anggota.length === 0 ? (
            <p className="text-xs text-muted font-bold py-1 w-full text-center">Tidak ada anggota divisi.</p>
          ) : (
            anggota.map(a => {
              const isChecked = assigneeIds.includes(a.id)
              const inisial = a.nama.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggleAssignee(a.id)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                    isChecked
                      ? 'border-maroon-700 bg-maroon-800 text-cream-50 shadow-sm shadow-maroon-800/10'
                      : 'border-cream-200 bg-cream-50/50 text-ink hover:border-maroon-300'
                  }`}
                >
                  <div className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-black ${isChecked ? 'bg-white text-maroon-800' : 'bg-cream-200 text-maroon-800'}`}>
                    {inisial}
                  </div>
                  <span>{a.nama}</span>
                </button>
              )
            })
          )}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-muted">Deskripsi (opsional)</label>
        <textarea
          value={deskripsi}
          onChange={e => setDeskripsi(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-xl border border-cream-200 bg-cream-50/50 px-3.5 py-2.5 text-xs font-bold text-ink outline-none focus:border-maroon-800 focus:bg-white transition-all shadow-inner"
        />
      </div>

      {pesan && <p className="text-xs font-semibold text-red-600">{pesan}</p>}

      <div className="flex items-center justify-end gap-2.5 border-t border-cream-100 pt-3.5">
        <button
          type="button"
          onClick={onBatal}
          className="rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-xs font-bold text-muted transition hover:bg-cream-50/50 active:scale-95 cursor-pointer shadow-sm"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={sedangSimpan}
          className="rounded-xl bg-maroon-800 px-4 py-2.5 text-xs font-bold text-cream-50 hover:bg-maroon-900 active:scale-95 transition-all shadow-md shadow-maroon-800/10 cursor-pointer disabled:opacity-50"
        >
          {sedangSimpan ? 'Menyimpan...' : templateEdit ? 'Simpan Perubahan' : 'Buat Template'}
        </button>
      </div>
    </form>
  )
}
