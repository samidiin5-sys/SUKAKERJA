'use client'

import { useState, useEffect } from 'react'
import { ajukanLembur, tetapkanLemburStaff, ambilAnggotaUntukLembur, type AnggotaLembur } from './actions'

type DivisiSaya = { id: string; nama: string; warna: string; role: string }

function IkonCentang() {
  return (
    <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function KotakCentang({ checked, onChange }: { checked: boolean; onChange?: () => void }) {
  return (
    <span
      onClick={onChange}
      className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 transition ${checked ? 'border-maroon-800 bg-maroon-800' : 'border-cream-300 bg-white'} ${onChange ? 'cursor-pointer' : 'cursor-default'}`}
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

  const daftarPilih = isOwnerOrAdmin ? anggota : anggota
  const anggotaLain = anggota.filter((a) => a.id !== sesiId)

  return (
    <div className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-xs font-bold tracking-widest text-muted">
        {isOwnerOrAdmin ? 'TETAPKAN LEMBUR UNTUK STAFF' : 'AJUKAN LEMBUR BARU'}
      </h3>

      {isOwnerOrAdmin && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5">
          <svg className="mt-0.5 flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
          <p className="text-xs text-blue-700">
            Lembur yang kamu tetapkan langsung <strong>disetujui</strong> dan staff akan mendapat notifikasi.
          </p>
        </div>
      )}

      <form onSubmit={tanganiKirim} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Divisi</label>
          <select
            value={divisionId}
            onChange={(e) => setDivisionId(e.target.value)}
            required
            className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-orange-500"
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
            <div className="space-y-0.5 rounded-lg border border-cream-200 bg-cream-50 p-2">
              {/* Mode staff: current user always checked */}
              {!isOwnerOrAdmin && (
                <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
                  <KotakCentang checked />
                  <span className="text-sm font-semibold text-ink">{sesiNama}</span>
                  <span className="ml-auto rounded bg-maroon-100 px-1.5 py-0.5 text-[10px] font-bold text-maroon-700">Kamu</span>
                </div>
              )}

              {/* Mode staff: other members below divider */}
              {!isOwnerOrAdmin && anggotaLain.length > 0 && (
                <div className="border-t border-cream-200 pt-0.5">
                  {anggotaLain.map((a) => (
                    <label key={a.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-cream-100 transition">
                      <input type="checkbox" className="sr-only" checked={dipilih.has(a.id)} onChange={() => togglePilih(a.id)} />
                      <KotakCentang checked={dipilih.has(a.id)} onChange={() => togglePilih(a.id)} />
                      <span className="text-sm text-ink">{a.nama}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Mode owner/admin: all staff as checkboxes */}
              {isOwnerOrAdmin && anggota.length === 0 && (
                <p className="px-2 py-1.5 text-xs text-muted">Tidak ada staff di divisi ini.</p>
              )}
              {isOwnerOrAdmin && anggota.map((a) => (
                <label key={a.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-cream-100 transition">
                  <input type="checkbox" className="sr-only" checked={dipilih.has(a.id)} onChange={() => togglePilih(a.id)} />
                  <KotakCentang checked={dipilih.has(a.id)} onChange={() => togglePilih(a.id)} />
                  <span className="text-sm text-ink">{a.nama}</span>
                </label>
              ))}

              {!isOwnerOrAdmin && anggotaLain.length === 0 && (
                <p className="px-2 pt-0.5 text-xs text-muted">Tidak ada anggota lain di divisi ini.</p>
              )}
            </div>
          )}
          {dipilih.size > (isOwnerOrAdmin ? 0 : 1) && (
            <p className="mt-1 text-xs font-semibold text-orange-700">
              {isOwnerOrAdmin
                ? `${dipilih.size} staff dipilih`
                : `Lembur untuk ${dipilih.size} orang — pengajuan akan dibuat untuk masing-masing.`}
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
            className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-orange-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Jam Mulai</label>
            <div className="flex items-center gap-1 rounded-lg border border-cream-200 bg-cream-50 px-3 py-2">
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
                className="w-8 bg-transparent text-center text-sm font-semibold text-ink outline-none"
              />
              <span className="text-sm font-bold text-muted">:</span>
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
                className="w-8 bg-transparent text-center text-sm font-semibold text-ink outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Jam Selesai</label>
            <div className="flex items-center gap-1 rounded-lg border border-cream-200 bg-cream-50 px-3 py-2">
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
                className="w-8 bg-transparent text-center text-sm font-semibold text-ink outline-none"
              />
              <span className="text-sm font-bold text-muted">:</span>
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
                className="w-8 bg-transparent text-center text-sm font-semibold text-ink outline-none"
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
            className="w-full resize-none rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-orange-500"
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
          className="w-full rounded-xl bg-maroon-800 py-2.5 text-sm font-bold text-white hover:bg-maroon-700 disabled:opacity-50 sm:w-auto sm:px-6"
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
