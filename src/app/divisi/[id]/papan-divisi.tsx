'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  buatTask,
  pindahkanTask,
  ubahUrutanTask,
  ubahUrutanBoard,
  type AnggotaDivisi,
  type BoardDenganTask,
  type TaskRingkas,
} from './actions'
import TaskCard, { TaskCardOverlay } from './task-card'
import DetailTaskPanel from './detail-task-panel'
import KirimTugasModal from './kirim-tugas-modal'

function cariBoardTask(taskId: string, daftar: BoardDenganTask[]): BoardDenganTask | undefined {
  return daftar.find((b) => b.tasks.some((t) => t.id === taskId))
}

const LABEL_PRIORITAS: Record<string, string> = {
  rendah: 'Rendah',
  sedang: 'Sedang',
  tinggi: 'Tinggi',
  mendesak: 'Mendesak',
}

export default function PapanDivisi({
  divisionId,
  boardsAwal,
  anggota,
  bolehReorderBoard,
  bolehTambahTask,
  bolehKelola,
  bolehKirimTugas,
  currentUserId,
  isStaff = false,
  defaultAssigneeId,
  pantauNama,
}: {
  divisionId: string
  boardsAwal: BoardDenganTask[]
  anggota: AnggotaDivisi[]
  bolehReorderBoard: boolean
  bolehTambahTask: boolean
  bolehKelola: boolean
  bolehKirimTugas: boolean
  currentUserId: string
  isStaff?: boolean
  defaultAssigneeId?: string
  pantauNama?: string
}) {
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [boards, setBoards] = useState(boardsAwal)
  const [taskDipilih, setTaskDipilih] = useState<{ id: string; boardId: string } | null>(null)
  const [modalKirimTerbuka, setModalKirimTerbuka] = useState(false)
  const [activeTask, setActiveTask] = useState<TaskRingkas | null>(null)
  const [pesanError, setPesanError] = useState<string | null>(null)
  const snapshotSebelumDrag = useRef<BoardDenganTask[] | null>(null)
  const snapshotBoardSebelumDrag = useRef<BoardDenganTask[] | null>(null)

  const [cari, setCari] = useState('')
  const [filterStatus, setFilterStatus] = useState<'semua' | 'aktif' | 'selesai'>('semua')
  const [filterPrioritas, setFilterPrioritas] = useState('semua')
  const [filterAssignee, setFilterAssignee] = useState(
    defaultAssigneeId ?? (isStaff ? currentUserId : 'semua')
  )

  const filterAktif =
    cari.trim() !== '' ||
    filterStatus !== 'semua' ||
    filterPrioritas !== 'semua' ||
    (!isStaff && filterAssignee !== 'semua')

  function cocokFilter(task: TaskRingkas): boolean {
    if (cari.trim() && !task.judul.toLowerCase().includes(cari.trim().toLowerCase())) return false
    if (filterStatus === 'aktif' && task.completedAt) return false
    if (filterStatus === 'selesai' && !task.completedAt) return false
    if (filterPrioritas !== 'semua' && task.prioritas !== filterPrioritas) return false
    if (filterAssignee === 'saya' && !task.assignees.some((a) => a.id === currentUserId)) return false
    if (filterAssignee === 'tanpa' && task.assignees.length > 0) return false
    if (
      filterAssignee !== 'semua' &&
      filterAssignee !== 'saya' &&
      filterAssignee !== 'tanpa' &&
      !task.assignees.some((a) => a.id === filterAssignee)
    ) {
      return false
    }
    return true
  }

  const boardsTampil = useMemo(
    () => boards.map((b) => ({ ...b, tasks: b.tasks.filter(cocokFilter) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [boards, cari, filterStatus, filterPrioritas, filterAssignee, currentUserId]
  )

  function resetFilter() {
    setCari('')
    setFilterStatus('semua')
    setFilterPrioritas('semua')
    setFilterAssignee(defaultAssigneeId ?? (isStaff ? currentUserId : 'semua'))
  }

  useEffect(() => {
    setBoards(boardsAwal)
  }, [boardsAwal])

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function tutupPanel() {
    setTaskDipilih(null)
  }

  function tanganiBerubah() {
    setTaskDipilih(null)
    router.refresh()
  }

  function scrollKiri() {
    scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })
  }

  function scrollKanan() {
    scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })
  }

  function handleDragStart(event: DragStartEvent) {
    snapshotSebelumDrag.current = boards
    setPesanError(null)
    const board = cariBoardTask(String(event.active.id), boards)
    const task = board?.tasks.find((t) => t.id === event.active.id)
    setActiveTask(task ?? null)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return
    const activeId = String(active.id)
    const overId = String(over.id)
    if (activeId === overId) return

    setBoards((prev) => {
      const boardAsal = cariBoardTask(activeId, prev)
      const boardTujuan = prev.find((b) => b.id === overId) ?? cariBoardTask(overId, prev)
      if (!boardAsal || !boardTujuan || boardAsal.id === boardTujuan.id) return prev

      const taskDipindah = boardAsal.tasks.find((t) => t.id === activeId)
      if (!taskDipindah) return prev

      const indexTujuan = boardTujuan.tasks.findIndex((t) => t.id === overId)

      return prev.map((b) => {
        if (b.id === boardAsal.id) {
          return { ...b, tasks: b.tasks.filter((t) => t.id !== activeId) }
        }
        if (b.id === boardTujuan.id) {
          const tasksBaru = [...b.tasks]
          const posisi = indexTujuan >= 0 ? indexTujuan : tasksBaru.length
          tasksBaru.splice(posisi, 0, taskDipindah)
          return { ...b, tasks: tasksBaru }
        }
        return b
      })
    })
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)
    const snapshot = snapshotSebelumDrag.current
    snapshotSebelumDrag.current = null

    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)
    const boardAsalAwal = snapshot ? cariBoardTask(activeId, snapshot) : undefined

    let boardsFinal = boards
    const boardSaatIni = cariBoardTask(activeId, boardsFinal)
    if (!boardSaatIni) return

    const overDiKolomYangSama =
      overId === boardSaatIni.id || boardSaatIni.tasks.some((t) => t.id === overId)

    if (overDiKolomYangSama && activeId !== overId) {
      const oldIndex = boardSaatIni.tasks.findIndex((t) => t.id === activeId)
      const newIndex =
        overId === boardSaatIni.id ? boardSaatIni.tasks.length - 1 : boardSaatIni.tasks.findIndex((t) => t.id === overId)
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        boardsFinal = boardsFinal.map((b) =>
          b.id === boardSaatIni.id ? { ...b, tasks: arrayMove(b.tasks, oldIndex, newIndex) } : b
        )
        setBoards(boardsFinal)
      }
    }

    const boardTujuan = cariBoardTask(activeId, boardsFinal)
    if (!boardTujuan) return

    const pindahAntarKolom = boardAsalAwal && boardAsalAwal.id !== boardTujuan.id
    const urutanTujuan = boardTujuan.tasks.map((t, i) => ({ taskId: t.id, urutan: i }))
    const indexBaru = boardTujuan.tasks.findIndex((t) => t.id === activeId)

    if (pindahAntarKolom && boardAsalAwal) {
      const hasil = await pindahkanTask(divisionId, activeId, boardTujuan.id, indexBaru)
      if (!hasil.sukses) {
        if (snapshot) setBoards(snapshot)
        setPesanError(hasil.pesan)
        return
      }

      const urutanAsal = boardAsalAwal.tasks
        .filter((t) => t.id !== activeId)
        .map((t, i) => ({ taskId: t.id, urutan: i }))
      const sisaTujuan = urutanTujuan.filter((u) => u.taskId !== activeId)
      const gabungan = [...sisaTujuan, ...urutanAsal]

      if (gabungan.length > 0) {
        await ubahUrutanTask(divisionId, gabungan)
      }
      router.refresh()
    } else if (urutanTujuan.length > 0) {
      const berubah =
        !snapshot || !boardAsalAwal || boardAsalAwal.tasks.map((t) => t.id).join(',') !== boardTujuan.tasks.map((t) => t.id).join(',')
      if (berubah) {
        const hasil = await ubahUrutanTask(divisionId, urutanTujuan)
        if (!hasil.sukses) {
          if (snapshot) setBoards(snapshot)
          setPesanError(hasil.pesan)
          return
        }
        router.refresh()
      }
    }
  }

  function handleDragCancel() {
    setActiveTask(null)
    if (snapshotSebelumDrag.current) {
      setBoards(snapshotSebelumDrag.current)
    }
    snapshotSebelumDrag.current = null
  }

  async function handleBoardDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) {
      snapshotBoardSebelumDrag.current = null
      return
    }
    const oldIndex = boards.findIndex((b) => b.id === active.id)
    const newIndex = boards.findIndex((b) => b.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const boardsBaru = arrayMove(boards, oldIndex, newIndex)
    setBoards(boardsBaru)

    const urutan = boardsBaru.map((b, i) => ({ boardId: b.id, urutan: i }))
    const hasil = await ubahUrutanBoard(divisionId, urutan)
    if (!hasil.sukses) {
      if (snapshotBoardSebelumDrag.current) setBoards(snapshotBoardSebelumDrag.current)
      setPesanError(hasil.pesan)
    }
    snapshotBoardSebelumDrag.current = null
  }

  if (boardsAwal.length === 0) {
    return (
      <p className="text-sm text-muted">
        Divisi ini belum memiliki board. Hubungi Super Admin untuk menyiapkannya.
      </p>
    )
  }

  return (
    <>
      {pesanError && (
        <p className="mb-2 rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-800">{pesanError}</p>
      )}

      {pantauNama && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c2410c" strokeWidth="2" className="flex-shrink-0">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            <span className="text-xs font-bold text-orange-800">
              Memantau Ruang Kerja: <span className="text-orange-700">{pantauNama}</span>
            </span>
          </div>
          <a
            href={`/divisi/${divisionId}/anggota`}
            className="flex-shrink-0 text-xs font-semibold text-orange-600 hover:text-orange-800 hover:underline"
          >
            ← Daftar Staff
          </a>
        </div>
      )}

      <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-cream-200 bg-white p-3 shadow-sm">
        <div className="flex gap-2">
          <input
            type="text"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari task..."
            className="min-w-0 flex-1 rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-orange-500"
          />
          {bolehKirimTugas && (
            <button
              onClick={() => setModalKirimTerbuka(true)}
              className="shrink-0 rounded-lg bg-maroon-800 px-3 py-2 text-xs font-bold text-white hover:bg-maroon-700"
            >
              Kirim Tugas
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className="rounded-lg border border-cream-200 bg-cream-50 px-2 py-2 text-xs outline-none focus:border-orange-500"
          >
            <option value="semua">Semua Status</option>
            <option value="aktif">Belum Selesai</option>
            <option value="selesai">Selesai</option>
          </select>
          <select
            value={filterPrioritas}
            onChange={(e) => setFilterPrioritas(e.target.value)}
            className="rounded-lg border border-cream-200 bg-cream-50 px-2 py-2 text-xs outline-none focus:border-orange-500"
          >
            <option value="semua">Semua Prioritas</option>
            {Object.entries(LABEL_PRIORITAS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          {!isStaff && (
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="min-w-0 rounded-lg border border-cream-200 bg-cream-50 px-2 py-2 text-xs outline-none focus:border-orange-500"
            >
              <option value="semua">Semua P. Jawab</option>
              <option value="saya">Saya</option>
              <option value="tanpa">Tanpa Assignee</option>
              {anggota.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nama}
                </option>
              ))}
            </select>
          )}
          {filterAktif && (
            <button
              onClick={resetFilter}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-muted hover:bg-cream-100"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {filterAktif && (
        <p className="mb-2 text-xs text-muted">
          Menampilkan hasil filter. Seret-lepas task dimatikan sementara filter aktif — reset filter untuk mengurutkan lagi.
        </p>
      )}

      <DndContext
        id={`board-reorder-${divisionId}`}
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={() => { snapshotBoardSebelumDrag.current = boards }}
        onDragEnd={handleBoardDragEnd}
        onDragCancel={() => {
          if (snapshotBoardSebelumDrag.current) setBoards(snapshotBoardSebelumDrag.current)
          snapshotBoardSebelumDrag.current = null
        }}
      >
        <SortableContext items={boards.map((b) => b.id)} strategy={horizontalListSortingStrategy}>
          <DndContext
            id={`papan-${divisionId}`}
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="group relative">
              {/* Left scroll button */}
              <button
                onClick={scrollKiri}
                className="absolute left-0 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md text-maroon-700 hover:bg-white lg:hidden lg:group-hover:flex"
                aria-label="Scroll kiri"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>

              {/* Board container */}
              <div
                ref={scrollRef}
                className="flex items-start gap-3 overflow-x-auto rounded-2xl bg-[#f1ece4] p-3 pb-3"
                style={{ scrollbarWidth: 'none' }}
              >
                {boardsTampil.map((board) => (
                  <BoardColumn
                    key={board.id}
                    divisionId={divisionId}
                    board={board}
                    dragDinonaktifkan={filterAktif}
                    bolehReorderBoard={bolehReorderBoard}
                    bolehTambahTask={bolehTambahTask}
                    onPilihTask={(taskId) => setTaskDipilih({ id: taskId, boardId: board.id })}
                  />
                ))}
              </div>

              {/* Right scroll button */}
              <button
                onClick={scrollKanan}
                className="absolute right-0 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md text-maroon-700 hover:bg-white lg:hidden lg:group-hover:flex"
                aria-label="Scroll kanan"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>

            <DragOverlay>{activeTask ? <TaskCardOverlay task={activeTask} /> : null}</DragOverlay>
          </DndContext>
        </SortableContext>
      </DndContext>

      {taskDipilih && (
        <DetailTaskPanel
          divisionId={divisionId}
          taskId={taskDipilih.id}
          boardIdSaatIni={taskDipilih.boardId}
          boards={boards}
          anggota={anggota}
          bolehPindah={
            cariBoardTask(taskDipilih.id, boards)?.tasks.find((t) => t.id === taskDipilih.id)?.bolehGeser ?? false
          }
          bolehHapus={
            cariBoardTask(taskDipilih.id, boards)?.tasks.find((t) => t.id === taskDipilih.id)?.bolehHapus ?? false
          }
          bolehKelola={bolehKelola}
          currentUserId={currentUserId}
          onClose={tutupPanel}
          onBerubah={tanganiBerubah}
        />
      )}

      {modalKirimTerbuka && (
        <KirimTugasModal
          divisionId={divisionId}
          boards={boards}
          anggota={anggota}
          onClose={() => setModalKirimTerbuka(false)}
          onTerkirim={() => {
            setModalKirimTerbuka(false)
            router.refresh()
          }}
        />
      )}
    </>
  )
}

function BoardColumn({
  divisionId,
  board,
  onPilihTask,
  dragDinonaktifkan = false,
  bolehReorderBoard = false,
  bolehTambahTask = false,
}: {
  divisionId: string
  board: BoardDenganTask
  onPilihTask: (taskId: string) => void
  dragDinonaktifkan?: boolean
  bolehReorderBoard?: boolean
  bolehTambahTask?: boolean
}) {
  const router = useRouter()
  const [judulBaru, setJudulBaru] = useState('')
  const [formTerbuka, setFormTerbuka] = useState(false)
  const [sedangProses, setSedangProses] = useState(false)
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: board.id })
  const {
    setNodeRef: setSortableRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: board.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  }

  async function tanganiTambah(e: React.FormEvent) {
    e.preventDefault()
    if (!judulBaru.trim()) return

    setSedangProses(true)
    const hasil = await buatTask(divisionId, board.id, judulBaru)
    setSedangProses(false)

    if (hasil.sukses) {
      setJudulBaru('')
      router.refresh()
    }
  }

  return (
    <div
      ref={setSortableRef}
      style={style}
      className={`w-72 flex-shrink-0 rounded-xl border transition ${
        isOver ? 'border-orange-200 bg-orange-50/50' : 'border-cream-200 bg-cream-100'
      }`}
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          {bolehReorderBoard && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab touch-none rounded p-0.5 text-maroon-400 hover:bg-cream-200 hover:text-maroon-700 active:cursor-grabbing"
              title="Seret untuk mengatur urutan board"
            >
              <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
                <circle cx="4" cy="4" r="1.5"/><circle cx="8" cy="4" r="1.5"/>
                <circle cx="4" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/>
                <circle cx="4" cy="12" r="1.5"/><circle cx="8" cy="12" r="1.5"/>
              </svg>
            </div>
          )}
          <h3 className="text-sm font-black text-maroon-900">{board.nama}</h3>
        </div>
        <span className="rounded-full bg-maroon-100 px-2 py-0.5 text-xs font-bold text-maroon-700">
          {board.tasks.length}
        </span>
      </div>

      <SortableContext items={board.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div ref={setDropRef} className="min-h-[4px] space-y-2 px-3 pb-1">
          {board.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={dragDinonaktifkan ? { ...task, bolehGeser: false } : task}
              onClick={() => onPilihTask(task.id)}
            />
          ))}
        </div>
      </SortableContext>

      {bolehTambahTask && (
        formTerbuka ? (
          <form onSubmit={tanganiTambah} className="px-3 pb-3 mt-2">
            <textarea
              autoFocus
              value={judulBaru}
              onChange={(e) => setJudulBaru(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  tanganiTambah(e)
                }
              }}
              placeholder="Judul task..."
              rows={2}
              className="w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500"
            />
            <div className="mt-1.5 flex gap-2">
              <button
                type="submit"
                disabled={sedangProses}
                className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
              >
                {sedangProses ? 'Menyimpan...' : 'Tambah'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormTerbuka(false)
                  setJudulBaru('')
                }}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted hover:bg-cream-200"
              >
                Batal
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setFormTerbuka(true)}
            className="mx-3 mb-3 mt-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-muted hover:bg-cream-200"
          >
            + Tambah task
          </button>
        )
      )}
    </div>
  )
}
