import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { TaskRingkas } from './actions'

const WARNA_PRIORITAS: Record<string, string> = {
  rendah: 'bg-cream-200 text-ink',
  sedang: 'bg-orange-400/20 text-orange-800',
  tinggi: 'bg-orange-500/30 text-orange-900',
  mendesak: 'bg-red-100 text-red-800',
}

const LABEL_PRIORITAS: Record<string, string> = {
  rendah: 'Rendah',
  sedang: 'Sedang',
  tinggi: 'Tinggi',
  mendesak: 'Mendesak',
}

function apakahTerlambat(task: TaskRingkas): boolean {
  if (!task.dueDate || task.completedAt) return false
  return new Date(task.dueDate).getTime() < Date.now()
}

function dapatkanKeteranganTenggat(dueDate: string, terlambat: boolean): string {
  const dateVal = new Date(dueDate)
  if (!terlambat) {
    return dateVal.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  }
  
  const sekarang = new Date()
  sekarang.setHours(0,0,0,0)
  const target = new Date(dueDate)
  target.setHours(0,0,0,0)
  const selisihMs = sekarang.getTime() - target.getTime()
  const selisihHari = Math.floor(selisihMs / (1000 * 60 * 60 * 24))
  
  if (selisihHari === 0) return 'Terlambat hari ini'
  if (selisihHari === 1) return 'Terlambat kemarin'
  return `Terlambat ${selisihHari} hari`
}

function IsiKartu({ task, terlambat }: { task: TaskRingkas; terlambat: boolean }) {
  return (
    <>
      {task.coverImageUrl && (
        <div className="-mx-3 -mt-3 mb-2.5 overflow-hidden rounded-t-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={task.coverImageUrl}
            alt=""
            className="h-28 w-full object-cover"
          />
        </div>
      )}
      <p className="text-sm font-semibold text-ink leading-snug">{task.judul}</p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${WARNA_PRIORITAS[task.prioritas] ?? WARNA_PRIORITAS.sedang}`}
        >
          {LABEL_PRIORITAS[task.prioritas] ?? task.prioritas}
        </span>

        {task.dueDate && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              terlambat ? 'bg-red-100 text-red-800' : 'bg-cream-200 text-muted'
            }`}
          >
            {dapatkanKeteranganTenggat(task.dueDate, terlambat)}
          </span>
        )}

        {task.checklistTotal > 0 && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              task.checklistSelesai === task.checklistTotal
                ? 'bg-green-100 text-green-800'
                : 'bg-cream-200 text-muted'
            }`}
          >
            ✓ {task.checklistSelesai}/{task.checklistTotal}
          </span>
        )}

        {task.isRecurring && (
          <span title="Tugas Rutin" className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">↻ Rutin</span>
        )}
      </div>

      {task.ditugaskanOleh && (
        <p className="mt-2 text-[10px] text-muted leading-none">Ditugaskan oleh <span className="font-semibold text-ink">{task.ditugaskanOleh}</span></p>
      )}

      {/* Bottom Row: Metadata info & Avatar Stack */}
      <div className="mt-3 flex items-center justify-between border-t border-cream-100/60 pt-2.5">
        {/* Left: Metadata badges */}
        <div className="flex items-center gap-2">
          {task.deskripsi && (
            <span title="Memiliki deskripsi">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted/70">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </span>
          )}

          {(task.jumlahKomentar ?? 0) > 0 && (
            <div className="flex items-center gap-0.5 text-[10px] font-semibold text-muted/70" title={`${task.jumlahKomentar} komentar`}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>{task.jumlahKomentar}</span>
            </div>
          )}

          {(task.jumlahLampiran ?? 0) > 0 && (
            <div className="flex items-center gap-0.5 text-[10px] font-semibold text-muted/70" title={`${task.jumlahLampiran} lampiran`}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              <span>{task.jumlahLampiran}</span>
            </div>
          )}
        </div>

        {/* Right: Overlapping avatar stack */}
        {task.assignees.length > 0 ? (
          <div className="flex -space-x-1.5 overflow-hidden">
            {task.assignees.map((a) => {
              const inisial = a.nama.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
              return (
                <div
                  key={a.id}
                  className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-maroon-800 text-[9px] font-black text-cream-50 flex items-center justify-center uppercase shadow-sm overflow-hidden"
                  title={a.nama}
                >
                  {a.fotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="h-full w-full object-cover rounded-full"
                      src={a.fotoUrl}
                      alt={a.nama}
                    />
                  ) : (
                    inisial
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <span className="text-[10px] text-muted/70 italic font-medium">Belum ditugaskan</span>
        )}
      </div>
    </>
  )
}

export default function TaskCard({ task, onClick }: { task: TaskRingkas; onClick: () => void }) {
  const terlambat = apakahTerlambat(task)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !task.bolehGeser,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <button
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={`w-full rounded-xl border border-cream-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        task.bolehGeser ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
      {...attributes}
      {...(task.bolehGeser ? listeners : {})}
    >
      <IsiKartu task={task} terlambat={terlambat} />
    </button>
  )
}

export function TaskCardOverlay({ task }: { task: TaskRingkas }) {
  const terlambat = apakahTerlambat(task)
  return (
    <div className="w-72 rotate-2 rounded-xl border border-cream-200 bg-white p-3 text-left shadow-2xl">
      <IsiKartu task={task} terlambat={terlambat} />
    </div>
  )
}
