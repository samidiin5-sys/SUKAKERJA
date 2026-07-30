'use client'

import { useState } from 'react'
import { hapusTemplate, toggleAktifTemplate, ambilRiwayatTemplate, triggerBuatTugasRutin, type RecurringTemplate, type TaskDariTemplate } from './actions'
import type { AnggotaDivisi } from '../actions'
import FormTemplate from './form-template'

const LABEL_POLA: Record<string, string> = {
  daily_workday: 'Hari Kerja',
  daily: 'Setiap Hari',
  weekly: 'Mingguan',
  monthly: 'Bulanan',
}

const WARNA_POLA: Record<string, string> = {
  daily_workday: 'bg-blue-50 text-blue-700 border-blue-200/30',
  daily: 'bg-emerald-50 text-emerald-700 border-emerald-200/30',
  weekly: 'bg-indigo-50 text-indigo-700 border-indigo-200/30',
  monthly: 'bg-amber-50 text-amber-700 border-amber-200/30',
}

function KartuTemplate({
  template,
  divisionId,
  anggota,
  bolehKelola,
  onBerubah,
}: {
  template: RecurringTemplate
  divisionId: string
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
        anggota={anggota}
        templateEdit={template}
        onSelesai={() => { setSedangEdit(false); onBerubah() }}
        onBatal={() => setSedangEdit(false)}
      />
    )
  }

  return (
    <>
      <div className="rounded-[22px] border border-cream-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-cream-100 p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-xs font-black text-ink leading-tight">{template.judul}</h3>
            <span
              className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${
                template.isActive 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/40' 
                  : 'bg-cream-100 text-muted border-cream-200/35'
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
              className={`shrink-0 rounded-xl px-2.5 py-1 text-[9px] font-black transition disabled:opacity-50 cursor-pointer ${
                template.isActive
                  ? 'border border-cream-200 bg-white text-muted hover:bg-cream-50'
                  : 'border border-transparent bg-emerald-50 text-emerald-700 hover:bg-emerald-100/70'
              }`}
            >
              {sedangToggle ? '...' : template.isActive ? 'Nonaktifkan' : 'Aktifkan'}
            </button>
          )}
        </div>

        {/* Body */}
        <div className="space-y-2.5 p-4 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className={`rounded-full border px-2.5 py-0.5 font-bold uppercase ${WARNA_POLA[template.pola] ?? 'bg-cream-100 text-muted'}`}>
              {LABEL_POLA[template.pola] ?? template.pola}
            </span>
            <span className="text-muted/65">&middot;</span>
            <span className="rounded-full border border-cream-200 bg-cream-50 px-2 py-0.5 font-bold text-muted uppercase">
              {template.boardNama}
            </span>
            {template.assigneeIds.length > 0 && (
              <>
                <span className="text-muted/65">&middot;</span>
                <span className="text-muted font-bold">{template.assigneeIds.length} Assignee</span>
              </>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-muted">
              Mulai: <span className="text-ink">{new Date(template.tanggalMulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              {template.tanggalSelesai && (
                <> &middot; Selesai: <span className="text-ink">{new Date(template.tanggalSelesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span></>
              )}
            </p>
            {template.lastGeneratedDate && (
              <p className="text-[10px] font-semibold text-muted">
                Terakhir dibuat: <span className="text-ink">{new Date(template.lastGeneratedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </p>
            )}
          </div>
          {template.deskripsi && (
            <p className="text-[11px] font-semibold text-muted leading-relaxed line-clamp-2">{template.deskripsi}</p>
          )}
          {pesan && <p className="text-[11px] font-semibold text-red-600">{pesan}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-cream-100 px-4 py-3">
          <button
            onClick={bukaRiwayat}
            className="rounded-xl border border-cream-200 bg-white px-3 py-1.5 text-[11px] font-bold text-muted transition hover:bg-cream-50 cursor-pointer shadow-sm"
          >
            Lihat Riwayat
          </button>
          {bolehKelola && (
            <>
              <button
                onClick={() => setSedangEdit(true)}
                className="rounded-xl border border-transparent bg-cream-50 px-3 py-1.5 text-[11px] font-bold text-maroon-800 transition hover:bg-cream-100 cursor-pointer"
              >
                Edit
              </button>
              <button
                onClick={() => setKonfirmHapus(true)}
                className="rounded-xl border border-transparent bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-600 transition hover:bg-red-100 cursor-pointer"
              >
                Hapus
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modal Konfirmasi Hapus */}
      {konfirmHapus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 border border-cream-200/30 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-black text-maroon-800">Hapus template ini?</h3>
            <p className="mt-1.5 text-xs text-muted/80 leading-relaxed font-semibold">
              Template <span className="text-ink font-bold">&ldquo;{template.judul}&rdquo;</span> akan dihapus. Task yang sudah dibuat dari template ini sebelumnya tidak terpengaruh.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setKonfirmHapus(false)}
                disabled={sedangHapus}
                className="rounded-xl border border-cream-200 px-4 py-2 text-xs font-bold text-muted transition hover:bg-cream-100 cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={tanganiHapus}
                disabled={sedangHapus}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700 cursor-pointer disabled:opacity-50"
              >
                {sedangHapus ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Riwayat */}
      {riwayatTerbuka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 border border-cream-200/30 shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]">
            <div className="mb-4 flex items-center justify-between border-b border-cream-100 pb-2">
              <h3 className="text-sm font-black text-maroon-800">Riwayat — {template.judul}</h3>
              <button
                onClick={() => setRiwayatTerbuka(false)}
                className="text-xs font-bold text-muted hover:text-ink cursor-pointer transition"
                aria-label="Tutup"
              >
                ✕ Tutup
              </button>
            </div>
            <div className="overflow-y-auto flex-1 custom-scrollbar space-y-2 pr-1">
              {sedangMuatRiwayat ? (
                <p className="text-xs font-semibold text-muted animate-pulse">Memuat riwayat...</p>
              ) : riwayat && riwayat.length === 0 ? (
                <p className="text-xs font-semibold text-muted text-center py-4">Belum ada task yang dibuat dari template ini.</p>
              ) : (
                <div className="space-y-2">
                  {(riwayat ?? []).map(task => (
                    <div key={task.id} className="flex items-center justify-between rounded-xl border border-cream-100 bg-cream-50/10 px-3.5 py-2.5">
                      <div>
                        <p className="text-xs font-bold text-ink">{task.judul}</p>
                        <p className="text-[10px] text-muted font-semibold mt-0.5">
                          Dibuat {new Date(task.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase ${
                          task.completedAt 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/35' 
                            : 'bg-cream-100 text-muted border-cream-200/35'
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
        </div>
      )}
    </>
  )
}

export default function DaftarTemplate({
  divisionId,
  templatesAwal,
  anggota,
  bolehKelola,
}: {
  divisionId: string
  templatesAwal: RecurringTemplate[]
  anggota: AnggotaDivisi[]
  bolehKelola: boolean
}) {
  const [templates, setTemplates] = useState<RecurringTemplate[]>(templatesAwal)
  const [formBuatTerbuka, setFormBuatTerbuka] = useState(false)
  const [sedangTrigger, setSedangTrigger] = useState(false)
  const [pesanTrigger, setPesanTrigger] = useState<{ sukses: boolean; teks: string } | null>(null)

  async function muatUlang() {
    window.location.reload()
  }

  async function tanganiTrigger() {
    setSedangTrigger(true)
    setPesanTrigger(null)
    const hasil = await triggerBuatTugasRutin(divisionId)
    setSedangTrigger(false)
    if (hasil.sukses) {
      setPesanTrigger({ sukses: true, teks: `Berhasil! ${hasil.dibuat} tugas baru dibuat hari ini.` })
    } else {
      setPesanTrigger({ sukses: false, teks: hasil.pesan ?? 'Gagal menjalankan.' })
    }
  }

  if (formBuatTerbuka) {
    return (
      <FormTemplate
        divisionId={divisionId}
        anggota={anggota}
        onSelesai={() => { setFormBuatTerbuka(false); muatUlang() }}
        onBatal={() => setFormBuatTerbuka(false)}
      />
    )
  }

  return (
    <div className="space-y-4">
      {bolehKelola && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-cream-50/40 p-3 rounded-2xl border border-cream-200/50 shadow-inner">
          <div className="flex items-center gap-3">
            <button
              onClick={tanganiTrigger}
              disabled={sedangTrigger}
              className="rounded-xl border border-emerald-200 bg-emerald-50/20 px-4 py-2.5 text-xs font-black text-emerald-700 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50 active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              {sedangTrigger ? 'Menjalankan...' : 'Jalankan Sekarang'}
            </button>
            {pesanTrigger && (
              <span className={`text-[10px] font-bold uppercase ${pesanTrigger.sukses ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/40 px-2 py-0.5 rounded' : 'text-red-600 bg-red-50 border border-red-200/40 px-2 py-0.5 rounded'}`}>
                {pesanTrigger.teks}
              </span>
            )}
          </div>
          <button
            onClick={() => setFormBuatTerbuka(true)}
            className="rounded-xl bg-maroon-800 px-4.5 py-2.5 text-xs font-bold text-cream-50 shadow-md shadow-maroon-800/10 transition hover:bg-maroon-900 active:scale-95 cursor-pointer"
          >
            + Buat Template
          </button>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-cream-200 bg-white p-8 text-center shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cream-50 text-cream-400 mb-3 border border-cream-100 shadow-sm mx-auto">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="text-xs font-bold text-ink">Belum ada template tugas rutin.</p>
          {bolehKelola && (
            <p className="mt-1 text-[11px] text-muted font-semibold">Klik &ldquo;Buat Template&rdquo; untuk mulai membuat tugas berulang otomatis.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {templates.map(tmpl => (
            <KartuTemplate
              key={tmpl.id}
              template={tmpl}
              divisionId={divisionId}
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
