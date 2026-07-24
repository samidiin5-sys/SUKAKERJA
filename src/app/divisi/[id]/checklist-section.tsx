'use client'

import { useEffect, useState } from 'react'
import {
  ambilChecklistTask,
  hapusChecklistItem,
  tambahChecklistItem,
  toggleChecklistItem,
  type ChecklistItem,
} from './actions'

export default function ChecklistSection({
  divisionId,
  taskId,
}: {
  divisionId: string
  taskId: string
}) {
  const [daftar, setDaftar] = useState<ChecklistItem[]>([])
  const [sedangMuat, setSedangMuat] = useState(true)
  const [teks, setTeks] = useState('')
  const [sedangKirim, setSedangKirim] = useState(false)
  const [pesanError, setPesanError] = useState<string | null>(null)

  useEffect(() => {
    let batal = false
    ambilChecklistTask(divisionId, taskId).then((data) => {
      if (batal) return
      setDaftar(data)
      setSedangMuat(false)
    })
    return () => {
      batal = true
    }
  }, [divisionId, taskId])

  const selesai = daftar.filter((d) => d.selesai).length

  async function tanganiTambah(e: React.FormEvent) {
    e.preventDefault()
    if (!teks.trim()) return

    setSedangKirim(true)
    setPesanError(null)
    const hasil = await tambahChecklistItem(divisionId, taskId, teks)
    setSedangKirim(false)

    if (!hasil.sukses) {
      setPesanError(hasil.pesan)
      return
    }

    if (hasil.item) {
      setDaftar((prev) => [...prev, hasil.item!])
    }
    setTeks('')
  }

  async function tanganiToggle(item: ChecklistItem) {
    setDaftar((prev) => prev.map((d) => (d.id === item.id ? { ...d, selesai: !d.selesai } : d)))
    const hasil = await toggleChecklistItem(divisionId, item.id, !item.selesai)
    if (!hasil.sukses) {
      setDaftar((prev) => prev.map((d) => (d.id === item.id ? { ...d, selesai: item.selesai } : d)))
      setPesanError(hasil.pesan)
    }
  }

  async function tanganiHapus(itemId: string) {
    const sebelumnya = daftar
    setDaftar((prev) => prev.filter((d) => d.id !== itemId))
    const hasil = await hapusChecklistItem(divisionId, itemId)
    if (!hasil.sukses) {
      setDaftar(sebelumnya)
      setPesanError(hasil.pesan)
    }
  }

  return (
    <div className="space-y-2.5">
      <label className="block text-xs font-bold tracking-wider text-muted uppercase">
        Checklist {daftar.length > 0 && `(${selesai}/${daftar.length})`}
      </label>

      {daftar.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-[10px] font-extrabold text-muted/80 mb-1">
            <span>PROGRES TUGAS</span>
            <span>{Math.round((selesai / daftar.length) * 100)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-cream-100 border border-cream-200/40">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                selesai === daftar.length
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                  : 'bg-gradient-to-r from-maroon-800 to-orange-500'
              }`}
              style={{ width: `${(selesai / daftar.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {sedangMuat ? (
        <p className="text-xs text-muted/70 italic">Memuat checklist...</p>
      ) : (
        <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
          {daftar.length === 0 && (
            <p className="text-xs text-muted/60 italic py-2">Belum ada item checklist.</p>
          )}
          {daftar.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2.5 rounded-xl border border-cream-100/50 bg-cream-50/20 px-3 py-2.5 hover:bg-cream-50/80 hover:border-cream-200/60 transition-all duration-200 shadow-sm"
            >
              <input
                type="checkbox"
                checked={item.selesai}
                onChange={() => tanganiToggle(item)}
                className="h-4.5 w-4.5 rounded border-cream-300 text-maroon-800 focus:ring-maroon-800/20 accent-maroon-800 cursor-pointer"
              />
              <p className={`flex-1 text-xs font-semibold leading-normal ${item.selesai ? 'text-muted/50 line-through font-medium' : 'text-ink'}`}>
                {item.isi}
              </p>
              <button
                onClick={() => tanganiHapus(item.id)}
                className="rounded-lg p-1 text-[10px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50/50 transition-all leading-none"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={tanganiTambah} className="flex gap-2 pt-1.5">
        <input
          type="text"
          value={teks}
          onChange={(e) => setTeks(e.target.value)}
          placeholder="Tambah item checklist baru..."
          maxLength={200}
          className="flex-1 rounded-xl border border-cream-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-ink placeholder-muted/50 outline-none focus:border-maroon-800 focus:ring-1 focus:ring-maroon-800/20 transition-all"
        />
        <button
          type="submit"
          disabled={sedangKirim || !teks.trim()}
          className="rounded-xl bg-maroon-800 px-4 py-2.5 text-xs font-bold text-cream-50 hover:bg-maroon-900 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all shadow-sm"
        >
          {sedangKirim ? 'Menyimpan...' : 'Tambah'}
        </button>
      </form>
      {pesanError && <p className="mt-1 text-xs font-bold text-red-700">{pesanError}</p>}
    </div>
  )
}
