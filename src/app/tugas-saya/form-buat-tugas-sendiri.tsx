'use client'

import { useState, useEffect } from 'react'
import { ambilDivisiDanBoardStaff, buatTugasSendiri, type DivisiOpsi } from './actions'
import { useRouter } from 'next/navigation'

export default function FormBuatTugasSendiri() {
  const router = useRouter()
  const [buka, setBuka] = useState(false)
  const [divisiList, setDivisiList] = useState<DivisiOpsi[]>([])
  const [divisionId, setDivisionId] = useState('')
  const [boardId, setBoardId] = useState('')
  const [judul, setJudul] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [prioritas, setPrioritas] = useState('sedang')
  const [dueDate, setDueDate] = useState('')
  const [memuat, setMemuat] = useState(false)
  const [sedangKirim, setSedangKirim] = useState(false)
  const [pesan, setPesan] = useState<{ sukses: boolean; teks: string } | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [selectedTime, setSelectedTime] = useState('')
  const [showTimePicker, setShowTimePicker] = useState(false)

  useEffect(() => {
    if (!buka) return
    setMemuat(true)
    ambilDivisiDanBoardStaff().then((res) => {
      setDivisiList(res)
      if (res.length > 0) {
        setDivisionId(res[0].id)
        setBoardId(res[0].boards[0]?.id ?? '')
      }
      setMemuat(false)
    })
  }, [buka])

  useEffect(() => {
    if (!showDatePicker) return
    function handler(e: MouseEvent) {
      const target = e.target as Element
      if (!target.closest('[data-datepicker]')) setShowDatePicker(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showDatePicker])

  const boardsTersedia = divisiList.find((d) => d.id === divisionId)?.boards ?? []

  function formatDeadlineDisplay(dueDate: string): string {
    if (!dueDate) return ''
    const d = new Date(dueDate)
    const today = new Date(); today.setHours(0,0,0,0)
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
    const dMidnight = new Date(d); dMidnight.setHours(0,0,0,0)

    let label = ''
    if (dMidnight.getTime() === today.getTime()) label = 'Hari Ini'
    else if (dMidnight.getTime() === tomorrow.getTime()) label = 'Besok'
    else label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })

    const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0
    if (hasTime) label += ` · ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
    return label
  }

  function setDeadlineShortcut(type: 'today' | 'tomorrow' | 'weekend' | 'nextweek') {
    const now = new Date()
    const target = new Date()
    if (type === 'today') { /* today */ }
    else if (type === 'tomorrow') { target.setDate(now.getDate() + 1) }
    else if (type === 'weekend') {
      const day = now.getDay()
      const daysToSat = day === 6 ? 7 : (6 - day)
      target.setDate(now.getDate() + daysToSat)
    } else if (type === 'nextweek') {
      const day = now.getDay()
      const daysToMon = day === 0 ? 1 : (8 - day)
      target.setDate(now.getDate() + daysToMon)
    }
    target.setHours(0, 0, 0, 0)
    setDueDate(target.toISOString().slice(0, 16))
    setCalendarDate(target)
    if (type !== 'today' && type !== 'tomorrow') setShowDatePicker(false)
  }

  function selectCalendarDay(day: number) {
    const d = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day)
    if (selectedTime) {
      const [h, m] = selectedTime.split(':')
      d.setHours(parseInt(h), parseInt(m))
    }
    setDueDate(d.toISOString().slice(0, 16))
    setShowDatePicker(false)
  }

  function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate()
  }

  function getFirstDayOfMonth(year: number, month: number) {
    const d = new Date(year, month, 1).getDay()
    return d === 0 ? 6 : d - 1 // Monday = 0
  }

  function tanganiGantiDivisi(id: string) {
    setDivisionId(id)
    const targetDiv = divisiList.find((d) => d.id === id)
    setBoardId(targetDiv?.boards[0]?.id ?? '')
  }

  function resetForm() {
    setJudul('')
    setDeskripsi('')
    setPrioritas('sedang')
    setDueDate('')
    setSelectedTime('')
    setShowDatePicker(false)
    setShowTimePicker(false)
    setPesan(null)
  }

  async function tanganiSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!divisionId || !boardId) {
      setPesan({ sukses: false, teks: 'Pilih divisi dan kolom (board).' })
      return
    }

    setSedangKirim(true)
    setPesan(null)

    const hasil = await buatTugasSendiri({
      divisionId,
      boardId,
      judul,
      deskripsi,
      prioritas,
      dueDate: dueDate ? dueDate : null,
    })

    setSedangKirim(false)

    if (hasil.sukses) {
      resetForm()
      setBuka(false)
      router.refresh()
    } else {
      setPesan({ sukses: false, teks: hasil.pesan })
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setBuka(true)
          resetForm()
        }}
        className="flex items-center gap-1.5 rounded-xl bg-maroon-800 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-maroon-700 shadow-sm"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Buat Tugas Sendiri
      </button>

      {buka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-black text-maroon-800">Buat Tugas Personal</h2>
              <button
                onClick={() => setBuka(false)}
                className="text-lg font-bold text-muted hover:text-ink"
              >
                ✕
              </button>
            </div>

            {memuat ? (
              <div className="py-8 text-center text-xs font-semibold text-muted animate-pulse">
                Memuat divisi & board...
              </div>
            ) : divisiList.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted">
                Kamu belum terdaftar di divisi mana pun. Hubungi owner divisi untuk bergabung.
              </div>
            ) : (
              <form onSubmit={tanganiSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted">Divisi</label>
                    <select
                      value={divisionId}
                      onChange={(e) => tanganiGantiDivisi(e.target.value)}
                      required
                      className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm text-ink outline-none focus:border-orange-500"
                    >
                      {divisiList.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nama}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted">Kolom (Board)</label>
                    <select
                      value={boardId}
                      onChange={(e) => setBoardId(e.target.value)}
                      required
                      className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm text-ink outline-none focus:border-orange-500"
                    >
                      {boardsTersedia.length === 0 ? (
                        <option value="">Tidak ada kolom</option>
                      ) : (
                        boardsTersedia.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.nama}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">
                    Judul Tugas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    placeholder="Contoh: Menyiapkan laporan penjualan mingguan..."
                    required
                    maxLength={200}
                    className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2.5 text-sm text-ink outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">
                    Deskripsi <span className="font-normal text-muted/60">(opsional)</span>
                  </label>
                  <textarea
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    placeholder="Detail instruksi atau rincian pekerjaan..."
                    rows={3}
                    className="w-full resize-none rounded-lg border border-cream-200 bg-cream-50 px-3 py-2.5 text-sm text-ink outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-muted">Prioritas</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { value: 'rendah', label: 'Rendah', icon: '○', bg: 'bg-slate-100 text-slate-600 border-slate-200', active: 'bg-slate-600 text-white border-slate-600' },
                      { value: 'sedang', label: 'Sedang', icon: '◑', bg: 'bg-blue-50 text-blue-600 border-blue-200', active: 'bg-blue-500 text-white border-blue-500' },
                      { value: 'tinggi', label: 'Tinggi', icon: '▲', bg: 'bg-orange-50 text-orange-600 border-orange-200', active: 'bg-orange-500 text-white border-orange-500' },
                      { value: 'mendesak', label: 'Mendesak', icon: '🔥', bg: 'bg-red-50 text-red-600 border-red-200', active: 'bg-red-600 text-white border-red-600' },
                    ].map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPrioritas(p.value)}
                        className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-center transition ${
                          prioritas === p.value ? p.active : p.bg + ' hover:opacity-80'
                        }`}
                      >
                        <span className="text-base leading-none">{p.icon}</span>
                        <span className="text-[10px] font-bold leading-none">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative" data-datepicker>
                  <label className="mb-2 block text-xs font-semibold text-muted">
                    Deadline <span className="font-normal text-muted/60">(opsional)</span>
                  </label>

                  {/* Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setShowDatePicker((v) => !v)}
                    className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                      dueDate
                        ? 'border-orange-300 bg-orange-50 text-orange-700 font-semibold'
                        : 'border-cream-200 bg-cream-50 text-muted hover:border-orange-300'
                    }`}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                    </svg>
                    {dueDate ? formatDeadlineDisplay(dueDate) : 'Pilih tanggal deadline...'}
                    {dueDate && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDueDate(''); setSelectedTime('') }}
                        className="ml-auto text-orange-400 hover:text-orange-700"
                      >
                        ✕
                      </button>
                    )}
                  </button>

                  {/* Dropdown Picker */}
                  {showDatePicker && (
                    <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-2xl border border-cream-200 bg-white p-3 shadow-xl">
                      {/* Shortcuts */}
                      <div className="mb-3 space-y-0.5">
                        {[
                          { label: 'Hari Ini', sub: new Date().toLocaleDateString('id-ID', { weekday: 'short' }), type: 'today' as const },
                          { label: 'Besok', sub: new Date(Date.now()+86400000).toLocaleDateString('id-ID', { weekday: 'short' }), type: 'tomorrow' as const },
                          { label: 'Akhir Pekan', sub: (() => { const d = new Date(); const ds = 6-d.getDay(); const t = new Date(d); t.setDate(d.getDate()+ds); return t.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }) })(), type: 'weekend' as const },
                          { label: 'Minggu Depan', sub: (() => { const d = new Date(); const dm = d.getDay()===0?1:(8-d.getDay()); const t = new Date(d); t.setDate(d.getDate()+dm); return t.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }) })(), type: 'nextweek' as const },
                        ].map((s) => (
                          <button
                            key={s.type}
                            type="button"
                            onClick={() => setDeadlineShortcut(s.type)}
                            className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition hover:bg-cream-50"
                          >
                            <span className="text-sm font-semibold text-ink">{s.label}</span>
                            <span className="text-xs text-muted">{s.sub}</span>
                          </button>
                        ))}
                      </div>

                      {/* Divider */}
                      <div className="mb-3 border-t border-cream-100" />

                      {/* Mini Calendar */}
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <button type="button" onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth()-1, 1))}
                            className="rounded-lg p-1 hover:bg-cream-100">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                          </button>
                          <span className="text-sm font-bold text-ink">
                            {calendarDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                          </span>
                          <button type="button" onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth()+1, 1))}
                            className="rounded-lg p-1 hover:bg-cream-100">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                          </button>
                        </div>

                        <div className="mb-1 grid grid-cols-7 text-center">
                          {['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map((h) => (
                            <div key={h} className="text-[10px] font-bold text-muted py-1">{h}</div>
                          ))}
                        </div>

                        <div className="grid grid-cols-7 text-center">
                          {Array.from({ length: getFirstDayOfMonth(calendarDate.getFullYear(), calendarDate.getMonth()) }).map((_, i) => (
                            <div key={`empty-${i}`} />
                          ))}
                          {Array.from({ length: getDaysInMonth(calendarDate.getFullYear(), calendarDate.getMonth()) }).map((_, i) => {
                            const day = i + 1
                            const thisDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day)
                            const today = new Date(); today.setHours(0,0,0,0)
                            const isToday = thisDate.getTime() === today.getTime()
                            const isSelected = dueDate && new Date(dueDate).toDateString() === thisDate.toDateString()
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => selectCalendarDay(day)}
                                className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition ${
                                  isSelected ? 'bg-orange-500 text-white' :
                                  isToday ? 'border border-orange-400 text-orange-600' :
                                  'hover:bg-cream-100 text-ink'
                                }`}
                              >
                                {day}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="mt-3 border-t border-cream-100" />

                      {/* Time Picker */}
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => setShowTimePicker((v) => !v)}
                          className="flex w-full items-center gap-2 rounded-xl border border-cream-200 px-3 py-2 text-left text-sm transition hover:bg-cream-50"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                          </svg>
                          <span className={selectedTime ? 'font-semibold text-ink' : 'text-muted'}>
                            {selectedTime || 'Tambah Waktu'}
                          </span>
                        </button>

                        {showTimePicker && (
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              type="time"
                              value={selectedTime}
                              onChange={(e) => {
                                setSelectedTime(e.target.value)
                                if (dueDate && e.target.value) {
                                  const d = new Date(dueDate)
                                  const [h, m] = e.target.value.split(':')
                                  d.setHours(parseInt(h), parseInt(m))
                                  setDueDate(d.toISOString().slice(0, 16))
                                }
                              }}
                              className="flex-1 rounded-xl border border-cream-200 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-orange-500"
                            />
                            {selectedTime && (
                              <button type="button" onClick={() => { setSelectedTime(''); if (dueDate) { const d = new Date(dueDate); d.setHours(0,0,0,0); setDueDate(d.toISOString().slice(0,16)) }}}
                                className="text-xs text-muted hover:text-red-600">Hapus</button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {pesan && (
                  <p className={`text-xs font-semibold ${pesan.sukses ? 'text-green-700' : 'text-red-600'}`}>
                    {pesan.teks}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setBuka(false)}
                    className="rounded-xl px-4 py-2 text-sm font-bold text-muted hover:bg-cream-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={sedangKirim || !boardId}
                    className="rounded-xl bg-maroon-800 px-5 py-2 text-sm font-bold text-white transition hover:bg-maroon-700 disabled:opacity-50"
                  >
                    {sedangKirim ? 'Menyimpan...' : 'Simpan Tugas'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
