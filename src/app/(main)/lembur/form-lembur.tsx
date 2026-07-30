'use client'

import { useState, useEffect } from 'react'
import { ajukanLembur, tetapkanLemburStaff, ambilAnggotaUntukLembur, type AnggotaLembur } from './actions'

type DivisiSaya = { id: string; nama: string; warna: string; role: string }

function IkonCentang() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function KotakCentang({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-[6px] border-2 transition-all duration-200 ${
        checked ? 'border-maroon-800 bg-maroon-800 shadow-sm scale-105' : 'border-cream-300 bg-white'
      }`}
    >
      {checked && <IkonCentang />}
    </span>
  )
}

export default function FormLembur({
  divisiSaya,
  sesiId,
  sesiNama,
  isOwnerOrAdmin,
}: {
  divisiSaya: DivisiSaya[]
  sesiId: string
  sesiNama: string
  isOwnerOrAdmin: boolean
}) {
  const [divisionId, setDivisionId] = useState(divisiSaya[0]?.id ?? '')
  const [tanggal, setTanggal] = useState('')
  const [jamMulai, setJamMulai] = useState('')
  const [hMulaiStr, setHMulaiStr] = useState('')
  const [mMulaiStr, setMMulaiStr] = useState('')
  const [jamSelesai, setJamSelesai] = useState('')
  const [hSelesaiStr, setHSelesaiStr] = useState('')
  const [mSelesaiStr, setMSelesaiStr] = useState('')
  const [alasan, setAlasan] = useState('')
  const [sedangKirim, setSedangKirim] = useState(false)
  const [pesan, setPesan] = useState<{ sukses: boolean; teks: string } | null>(null)
  const [anggota, setAnggota] = useState<AnggotaLembur[]>([])
  const [dipilih, setDipilih] = useState<Set<string>>(new Set(isOwnerOrAdmin ? [] : [sesiId]))
  const [muatAnggota, setMuatAnggota] = useState(false)

  useEffect(() => {
    if (!divisionId) return
    setMuatAnggota(true)
    ambilAnggotaUntukLembur(divisionId).then((data) => {
      setAnggota(data)
      setDipilih(new Set(isOwnerOrAdmin ? [] : [sesiId]))
      setMuatAnggota(false)
    })
  }, [divisionId, sesiId, isOwnerOrAdmin])

  function togglePilih(id: string) {
    if (!isOwnerOrAdmin && id === sesiId) return
    setDipilih((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function tanganiKirim(e: React.FormEvent) {
    e.preventDefault()
    if (dipilih.size === 0) {
      setPesan({ sukses: false, teks: 'Pilih minimal 1 orang.' })
      return
    }
    setSedangKirim(true)
    setPesan(null)

    let hasil
    if (isOwnerOrAdmin) {
      hasil = await tetapkanLemburStaff(divisionId, Array.from(dipilih), tanggal, jamMulai, jamSelesai, alasan)
    } else {
      hasil = await ajukanLembur(divisionId, tanggal, jamMulai, jamSelesai, alasan, Array.from(dipilih))
    }

    setSedangKirim(false)
    if (!hasil.sukses) {
      setPesan({ sukses: false, teks: hasil.pesan })
      return
    }

    const jumlah = dipilih.size
    setPesan({
      sukses: true,
      teks: isOwnerOrAdmin
        ? `Lembur untuk ${jumlah} staff berhasil ditetapkan!`
        : jumlah > 1
          ? `Pengajuan lembur untuk ${jumlah} orang berhasil dikirim!`
          : 'Pengajuan lembur berhasil dikirim!',
    })
    setTanggal('')
    setJamMulai('')
    setHMulaiStr('')
    setMMulaiStr('')
    setJamSelesai('')
    setHSelesaiStr('')
    setMSelesaiStr('')
    setAlasan('')
    setDipilih(new Set(isOwnerOrAdmin ? [] : [sesiId]))
  }

  if (divisiSaya.length === 0) {
    return (
      <div className="rounded-2xl border border-cream-200 bg-white p-4 text-center">
        <p className="text-sm text-muted">Belum ada divisi aktif.</p>
      </div>
    )
  }

  const anggotaLain = anggota.filter((a) => a.id !== sesiId)

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-cream-200 bg-white p-5 shadow-[0_14px_40px_rgba(92,31,33,0.06)]">
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-maroon-700 to-amber-400" />
      <h3 className="mb-4 text-xs font-bold tracking-[0.24em] text-muted">
        {isOwnerOrAdmin ? 'TETAPKAN LEMBUR UNTUK STAFF' : 'AJUKAN LEMBUR BARU'}
      </h3>

      {isOwnerOrAdmin && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50/50 px-3.5 py-3 shadow-sm">
          <svg className="mt-0.5 flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <p className="text-xs font-semibold text-blue-700 leading-relaxed">
            Lembur yang kamu tetapkan langsung <strong className="text-blue-800">disetujui</strong> dan staff akan mendapat notifikasi sistem secara otomatis.
          </p>
        </div>
      )}

      <form onSubmit={tanganiKirim} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Divisi</label>
          <select
            value={divisionId}
            onChange={(e) => setDivisionId(e.target.value)}
            required
            className="w-full rounded-xl border border-cream-200 bg-cream-50/50 px-3.5 py-2.5 text-xs font-bold text-ink outline-none focus:border-maroon-800 focus:bg-white transition-all cursor-pointer shadow-inner"
          >
            {divisiSaya.map((d) => (
              <option key={d.id} value={d.id}>{d.nama}</option>
            ))}
          </select>
        </div>

        {/* Pilih staff */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted">
            {isOwnerOrAdmin ? 'Staff yang Lembur' : 'Siapa yang Lembur'}
          </label>
          {muatAnggota ? (
            <p className="text-xs text-muted animate-pulse">Memuat anggota...</p>
          ) : (
            <div className="space-y-1 rounded-xl border border-cream-200 bg-cream-50/50 p-2 shadow-inner max-h-[220px] overflow-y-auto custom-scrollbar">
              {/* Mode staff: current user always checked */}
              {!isOwnerOrAdmin && (
                <div className="flex items-center gap-2.5 rounded-lg bg-cream-100/60 border border-cream-200/50 px-3 py-2 shadow-sm">
                  <KotakCentang checked />
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-maroon-800 text-[10px] font-black text-cream-50">
                    {sesiNama.split(' ').map((n) => n[0]).slice(0,2).join('').toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-ink">{sesiNama}</span>
                  <span className="ml-auto rounded bg-maroon-100 px-2 py-0.5 text-[9px] font-bold text-maroon-700">Kamu</span>
                </div>
              )}

              {/* Mode staff: other members below divider */}
              {!isOwnerOrAdmin && anggotaLain.length > 0 && (
                <div className="border-t border-cream-200/60 pt-1 space-y-1">
                  {anggotaLain.map((a) => {
                    const isChecked = dipilih.has(a.id)
                    const inisial = a.nama.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
                    return (
                      <label
                        key={a.id}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 border transition-all duration-200 ${
                          isChecked 
                            ? 'bg-cream-100/70 border-cream-200/70 shadow-sm' 
                            : 'bg-white border-transparent hover:bg-cream-50'
                        }`}
                      >
                        <input type="checkbox" className="sr-only" checked={isChecked} onChange={() => togglePilih(a.id)} />
                        <KotakCentang checked={isChecked} />
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cream-200 text-[10px] font-black text-maroon-800">
                          {inisial}
                        </div>
                        <span className="text-xs font-bold text-ink">{a.nama}</span>
                      </label>
                    )
                  })}
                </div>
              )}

              {/* Mode owner/admin: all staff as checkboxes */}
              {isOwnerOrAdmin && anggota.length === 0 && (
                <p className="px-3 py-2 text-xs text-muted font-bold text-center">Tidak ada staff di divisi ini.</p>
              )}
              {isOwnerOrAdmin && anggota.map((a) => {
                const isChecked = dipilih.has(a.id)
                const inisial = a.nama.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
                return (
                  <label
                    key={a.id}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 border transition-all duration-200 ${
                      isChecked 
                        ? 'bg-cream-100/70 border-cream-200/70 shadow-sm' 
                        : 'bg-white border-transparent hover:bg-cream-50'
                    }`}
                  >
                    <input type="checkbox" className="sr-only" checked={isChecked} onChange={() => togglePilih(a.id)} />
                    <KotakCentang checked={isChecked} />
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cream-200 text-[10px] font-black text-maroon-800">
                      {inisial}
                    </div>
                    <span className="text-xs font-bold text-ink">{a.nama}</span>
                  </label>
                )
              })}

              {!isOwnerOrAdmin && anggotaLain.length === 0 && (
                <p className="px-3 py-2 text-xs text-muted font-bold text-center">Tidak ada anggota lain di divisi ini.</p>
              )}
            </div>
          )}
          {dipilih.size > (isOwnerOrAdmin ? 0 : 1) && (
            <p className="mt-1.5 text-xs font-bold text-orange-700">
              {isOwnerOrAdmin
                ? `✓ ${dipilih.size} staff dipilih`
                : `✓ Lembur untuk ${dipilih.size} orang — pengajuan terpisah akan dibuat.`}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Tanggal Lembur</label>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            required
            className="w-full rounded-xl border border-cream-200 bg-cream-50/50 px-3.5 py-2.5 text-xs font-bold text-ink outline-none focus:border-maroon-800 focus:bg-white transition-all shadow-inner"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Jam Mulai</label>
            <div className="flex items-center justify-center gap-1.5 rounded-xl border border-cream-200 bg-cream-50/50 px-3 py-2.5 shadow-inner focus-within:border-maroon-800 focus-within:bg-white transition-all">
              <input
                type="text"
                inputMode="numeric"
                maxLength={2}
                placeholder="00"
                value={hMulaiStr}
                onChange={(e) => {
                  const h = e.target.value.replace(/\D/g, '').slice(0, 2)
                  if (h !== '' && parseInt(h) > 23) return
                  setHMulaiStr(h)
                  const m = jamMulai ? jamMulai.split(':')[1] : '00'
                  setJamMulai(`${h.padStart(2, '0')}:${m}`)
                }}
                onBlur={() => setHMulaiStr((h) => h.padStart(2, '0'))}
                required
                className="w-8 bg-transparent text-center text-xs font-bold text-ink outline-none"
              />
              <span className="text-xs font-black text-muted">:</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={2}
                placeholder="00"
                value={mMulaiStr}
                onChange={(e) => {
                  const m = e.target.value.replace(/\D/g, '').slice(0, 2)
                  if (m !== '' && parseInt(m) > 59) return
                  setMMulaiStr(m)
                  const h = jamMulai ? jamMulai.split(':')[0] : '00'
                  setJamMulai(`${h}:${m.padStart(2, '0')}`)
                }}
                onBlur={() => setMMulaiStr((m) => m.padStart(2, '0'))}
                className="w-8 bg-transparent text-center text-xs font-bold text-ink outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Jam Selesai</label>
            <div className="flex items-center justify-center gap-1.5 rounded-xl border border-cream-200 bg-cream-50/50 px-3 py-2.5 shadow-inner focus-within:border-maroon-800 focus-within:bg-white transition-all">
              <input
                type="text"
                inputMode="numeric"
                maxLength={2}
                placeholder="00"
                value={hSelesaiStr}
                onChange={(e) => {
                  const h = e.target.value.replace(/\D/g, '').slice(0, 2)
                  if (h !== '' && parseInt(h) > 23) return
                  setHSelesaiStr(h)
                  const m = jamSelesai ? jamSelesai.split(':')[1] : '00'
                  setJamSelesai(`${h.padStart(2, '0')}:${m}`)
                }}
                onBlur={() => setHSelesaiStr((h) => h.padStart(2, '0'))}
                required
                className="w-8 bg-transparent text-center text-xs font-bold text-ink outline-none"
              />
              <span className="text-xs font-black text-muted">:</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={2}
                placeholder="00"
                value={mSelesaiStr}
                onChange={(e) => {
                  const m = e.target.value.replace(/\D/g, '').slice(0, 2)
                  if (m !== '' && parseInt(m) > 59) return
                  setMSelesaiStr(m)
                  const h = jamSelesai ? jamSelesai.split(':')[0] : '00'
                  setJamSelesai(`${h}:${m.padStart(2, '0')}`)
                }}
                onBlur={() => setMSelesaiStr((m) => m.padStart(2, '0'))}
                className="w-8 bg-transparent text-center text-xs font-bold text-ink outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Alasan Lembur</label>
          <textarea
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            placeholder="Jelaskan alasan lembur (min. 10 karakter)..."
            rows={3}
            required
            className="w-full resize-none rounded-xl border border-cream-200 bg-cream-50/50 px-3.5 py-2.5 text-xs font-bold text-ink outline-none focus:border-maroon-800 focus:bg-white transition-all shadow-inner"
          />
        </div>

        {pesan && (
          <p className={`text-xs font-semibold ${pesan.sukses ? 'text-green-700' : 'text-red-600'}`}>
            {pesan.teks}
          </p>
        )}

        <button
          type="submit"
          disabled={sedangKirim || dipilih.size === 0}
          className="w-full rounded-xl bg-maroon-800 py-2.5 text-xs font-bold text-cream-50 hover:bg-maroon-900 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all shadow-md shadow-maroon-800/10 sm:w-auto sm:px-6"
        >
          {sedangKirim
            ? 'Memproses...'
            : isOwnerOrAdmin
              ? 'Tetapkan Lembur'
              : 'Ajukan Lembur'}
        </button>
      </form>
    </div>
  )
}
