'use client'

import { useState } from 'react'
import { hapusTemplate, toggleAktifTemplate, ambilRiwayatTemplate, type RecurringTemplate, type TaskDariTemplate } from './actions'
import type { AnggotaDivisi } from '../actions'
import FormTemplate from './form-template'

const LABEL_POLA: Record<string, string> = {
  daily_workday: 'Hari Kerja',
  daily: 'Setiap Hari',
  weekly: 'Mingguan',
  monthly: 'Bulanan',
}

const WARNA_POLA: Record<string, string> = {
  daily_workday: 'bg-blue-100 text-blue-700',
  daily: 'bg-green-100 text-green-700',
  weekly: 'bg-purple-100 text-purple-700',
  monthly: 'bg-orange-100 text-orange-700',
}

type Board = { id: string; nama: string }

function KartuTemplate({
  template,
  divisionId,
  boards,
  anggota,
  bolehKelola,
  onBerubah,
}: {
  template: RecurringTemplate
  divisionId: string
  boards: Board[]
  anggota: AnggotaDivisi[]
  bolehKelola: boolean
  onBerubah: () => void
}) {
  const [sedangEdit, setSedangEdit] = useState(false)
  const [konfirmHapus, setKonfirmHapus] = useState(false)
  const [sedangHapus, setSedangHapus] = useState(false)
  const [sedangToggle, setSedangToggle] = useState(false)
  const [riwayatTerbuka, setRiwayatTerbuka] = useState(false)
  const [riwayat, setRiwayat] = useState<TaskDariTemplate[] | null>(null)
  const [sedangMuatRiwayat, setSedangMuatRiwayat] = useState(false)
  const [pesan, setPesan] = useState<string | null>(null)

  async function tanganiToggle() {
    setSedangToggle(true)
    const hasil = await toggleAktifTemplate(divisionId, template.id, !template.isActive)
    setSedangToggle(false)
    if (!hasil.sukses) {
      setPesan(hasil.pesan)
      return
    }
    onBerubah()
  }

  async function tanganiHapus() {
    setSedangHapus(true)
    const hasil = await hapusTemplate(divisionId, template.id)
    setSedangHapus(false)
    setKonfirmHapus(false)
    if (!hasil.sukses) {
      setPesan(hasil.pesan)
      return
    }
    onBerubah()
  }

  async function bukaRiwayat() {
    setRiwayatTerbuka(true)
    if (riwayat !== null) return
    setSedangMuatRiwayat(true)
    const data = await ambilRiwayatTemplate(divisionId, template.id)
    setRiwayat(data)
    setSedangMuatRiwayat(false)
  }

  if (sedangEdit) {
    return (
      <FormTemplate
        divisionId={divisionId}
        boards={boards}
        anggota={anggota}
        templateEdit={template}
        onSelesai={() => { setSedangEdit(false); onBerubah() }}
        onBatal={() => setSedangEdit(false)}
      />
    )
  }

  return (
    <>
      <div className="rounded-2xl border border-cream-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-cream-100 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-maroon-800">{template.judul}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                template.isActive ? 'bg-green-100 text-green-700' : 'bg-cream-200 text-muted'
              }`}
            >
              {template.isActive ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
          {bolehKelola && (
            <button
              onClick={tanganiToggle}
              disabled={sedangToggle}
              title={template.isActive ? 'Nonaktifkan template' : 'Aktifkan template'}
              className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold transition disabled:opacity-50 ${
                template.isActive
                  ? 'border border-cream-200 text-muted hover:bg-cream-100'
                  : 'border border-green-300 text-green-700 hover:bg-green-50'
              }`}
            >
              {sedangToggle ? '...' : template.isActive ? 'Nonaktifkan' : 'Aktifkan'}
            </button>
          )}
        </div>

        {/* Body */}
        <div className="space-y-2 p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full px-2 py-0.5 font-bold ${WARNA_POLA[template.pola] ?? 'bg-cream-200 text-muted'}`}>
              {LABEL_POLA[template.pola] ?? template.pola}
            </span>
            <span className="text-muted">·</span>
            <span className="font-semibold text-ink">{template.boardNama}</span>
            {template.assigneeIds.length > 0 && (
              <>
                <span className="text-muted">·</span>
                <span className="text-muted">{template.assigneeIds.length} penanggung jawab</span>
              </>
            )}
          </div>
          <p className="text-xs text-muted">
            Mulai: {new Date(template.tanggalMulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            {template.tanggalSelesai && (
              <> · Berakhir: {new Date(template.tanggalSelesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</>
            )}
          </p>
          {template.lastGeneratedDate && (
            <p className="text-xs text-muted">
              Terakhir dibuat: {new Date(template.lastGeneratedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
          {template.deskripsi && (
            <p className="text-xs text-muted line-clamp-2">{template.deskripsi}</p>
          )}
          {pesan && <p className="text-xs text-red-600">{pesan}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-cream-100 px-4 py-3">
          <button
            onClick={bukaRiwayat}
            className="rounded-xl border border-cream-200 px-3 py-1.5 text-xs font-bold text-muted transition hover:bg-cream-100 hover:text-ink"
          >
            Lihat Riwayat
          </button>
          {bolehKelola && (
            <>
              <button
                onClick={() => setSedangEdit(true)}
                className="rounded-xl border border-cream-200 px-3 py-1.5 text-xs font-bold text-maroon-700 transition hover:border-orange-500 hover:text-orange-600"
              >
                Edit
              </button>
              <button
                onClick={() => setKonfirmHapus(true)}
                className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50"
              >
                Hapus
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modal Konfirmasi Hapus */}
      {konfirmHapus && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-base font-black text-maroon-800">Hapus template ini?</h3>
            <p className="mt-1.5 text-sm text-muted">
              Template &ldquo;{template.judul}&rdquo; akan dihapus. Task yang sudah dibuat dari template ini tidak terpengaruh.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setKonfirmHapus(false)}
                disabled={sedangHapus}
                className="rounded-xl border border-cream-200 px-4 py-2 text-sm font-bold text-muted transition hover:bg-cream-100 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={tanganiHapus}
                disabled={sedangHapus}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {sedangHapus ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Riwayat */}
      {riwayatTerbuka && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-black text-maroon-800">Riwayat — {template.judul}</h3>
              <button
                onClick={() => setRiwayatTerbuka(false)}
                className="text-muted hover:text-ink"
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>
            {sedangMuatRiwayat ? (
              <p className="text-sm text-muted">Memuat...</p>
            ) : riwayat && riwayat.length === 0 ? (
              <p className="text-sm text-muted">Belum ada task yang dibuat dari template ini.</p>
            ) : (
              <div className="space-y-2">
                {(riwayat ?? []).map(task => (
                  <div key={task.id} className="flex items-center justify-between rounded-lg border border-cream-100 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-ink">{task.judul}</p>
                      <p className="text-xs text-muted">
                        Dibuat {new Date(task.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        task.completedAt ? 'bg-green-100 text-green-700' : 'bg-cream-200 text-muted'
                      }`}
                    >
                      {task.completedAt ? 'Selesai' : 'Aktif'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default function DaftarTemplate({
  divisionId,
  templatesAwal,
  boards,
  anggota,
  bolehKelola,
}: {
  divisionId: string
  templatesAwal: RecurringTemplate[]
  boards: Board[]
  anggota: AnggotaDivisi[]
  bolehKelola: boolean
}) {
  const [templates, setTemplates] = useState<RecurringTemplate[]>(templatesAwal)
  const [formBuatTerbuka, setFormBuatTerbuka] = useState(false)

  async function muatUlang() {
    // Trigger server revalidation by refreshing the page
    window.location.reload()
  }

  if (formBuatTerbuka) {
    return (
      <FormTemplate
        divisionId={divisionId}
        boards={boards}
        anggota={anggota}
        onSelesai={() => { setFormBuatTerbuka(false); muatUlang() }}
        onBatal={() => setFormBuatTerbuka(false)}
      />
    )
  }

  return (
    <div className="space-y-4">
      {bolehKelola && (
        <div className="flex justify-end">
          <button
            onClick={() => setFormBuatTerbuka(true)}
            className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/25 transition hover:bg-orange-600"
          >
            + Buat Template
          </button>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="rounded-2xl border border-cream-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-muted">Belum ada template tugas rutin.</p>
          {bolehKelola && (
            <p className="mt-1 text-xs text-muted">Klik &ldquo;Buat Template&rdquo; untuk mulai membuat tugas berulang otomatis.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {templates.map(tmpl => (
            <KartuTemplate
              key={tmpl.id}
              template={tmpl}
              divisionId={divisionId}
              boards={boards}
              anggota={anggota}
              bolehKelola={bolehKelola}
              onBerubah={muatUlang}
            />
          ))}
        </div>
      )}
    </div>
  )
}
