'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { pastikanAnggotaDivisi, pastikanOwner } from '@/lib/auth/otorisasi'
import { catatAktivitas } from '@/lib/aktivitas'

export type StatusTarget = 'completed' | 'on_track' | 'at_risk'

export type Target = {
  id: string
  userId: string
  userNama: string
  periodeMulai: string
  periodeSelesai: string
  jumlahTarget: number
  keterangan: string | null
}

export type RealisasiTarget = Target & {
  realisasi: number
  persentase: number
  status: StatusTarget
}

function hitungStatus(realisasi: number, target: number, periodeMulai: string, periodeSelesai: string): StatusTarget {
  if (target > 0 && realisasi / target >= 1) return 'completed'

  const mulai = new Date(periodeMulai).getTime()
  const selesai = new Date(periodeSelesai).getTime()
  const total = selesai - mulai
  const terlewati = Date.now() - mulai
  const pctWaktu = total > 0 ? terlewati / total : 0

  if (pctWaktu > 0.75 && target > 0 && realisasi / target < 0.5) return 'at_risk'
  return 'on_track'
}

export type HasilTarget = { sukses: true } | { sukses: false; pesan: string }

async function cekOverlap(
  admin: ReturnType<typeof createAdminClient>,
  divisionId: string,
  userId: string,
  periodeMulai: string,
  periodeSelesai: string,
  excludeId?: string
): Promise<boolean> {
  let query = admin
    .from('targets')
    .select('id')
    .eq('division_id', divisionId)
    .eq('user_id', userId)
    .lte('periode_mulai', periodeSelesai)
    .gte('periode_selesai', periodeMulai)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data } = await query
  return (data?.length ?? 0) > 0
}

export async function buatTarget(
  divisionId: string,
  userId: string,
  periodeMulai: string,
  periodeSelesai: string,
  jumlahTarget: number,
  keterangan: string
): Promise<HasilTarget> {
  const sesi = await pastikanOwner(divisionId)

  if (new Date(periodeSelesai) <= new Date(periodeMulai)) {
    return { sukses: false, pesan: 'Tanggal akhir harus lebih besar dari tanggal mulai' }
  }
  if (!Number.isInteger(jumlahTarget) || jumlahTarget <= 0) {
    return { sukses: false, pesan: 'Jumlah target harus bilangan bulat positif' }
  }

  const admin = createAdminClient()

  const overlap = await cekOverlap(admin, divisionId, userId, periodeMulai, periodeSelesai)
  if (overlap) {
    return { sukses: false, pesan: 'Anggota ini sudah punya target lain di periode yang beririsan' }
  }

  const { data: target, error } = await admin
    .from('targets')
    .insert({
      division_id: divisionId,
      user_id: userId,
      periode_mulai: periodeMulai,
      periode_selesai: periodeSelesai,
      jumlah_target: jumlahTarget,
      keterangan: keterangan.trim() || null,
      created_by: sesi.id,
    })
    .select('id')
    .single()

  if (error) {
    return { sukses: false, pesan: 'Gagal membuat target. Coba lagi.' }
  }

  const { data: profil } = await admin.from('profiles').select('nama').eq('id', userId).single()
  await catatAktivitas({
    actorId: sesi.id,
    actorNama: sesi.nama,
    jenis: 'target_dibuat',
    objekTipe: 'Target',
    objekId: target.id,
    objekNama: `${profil?.nama ?? userId} (${jumlahTarget} task)`,
    divisionId,
  })

  return { sukses: true }
}

export async function ubahTarget(
  divisionId: string,
  targetId: string,
  periodeMulai: string,
  periodeSelesai: string,
  jumlahTarget: number,
  keterangan: string
): Promise<HasilTarget> {
  const sesi = await pastikanOwner(divisionId)

  const admin = createAdminClient()

  const { data: targetLama } = await admin
    .from('targets')
    .select('user_id, periode_selesai')
    .eq('id', targetId)
    .eq('division_id', divisionId)
    .single()

  if (!targetLama) {
    return { sukses: false, pesan: 'Target tidak ditemukan' }
  }

  if (new Date(targetLama.periode_selesai) < new Date()) {
    return { sukses: false, pesan: 'Target yang periodenya sudah berakhir tidak dapat diubah' }
  }

  if (new Date(periodeSelesai) <= new Date(periodeMulai)) {
    return { sukses: false, pesan: 'Tanggal akhir harus lebih besar dari tanggal mulai' }
  }
  if (!Number.isInteger(jumlahTarget) || jumlahTarget <= 0) {
    return { sukses: false, pesan: 'Jumlah target harus bilangan bulat positif' }
  }

  const overlap = await cekOverlap(admin, divisionId, targetLama.user_id, periodeMulai, periodeSelesai, targetId)
  if (overlap) {
    return { sukses: false, pesan: 'Anggota ini sudah punya target lain di periode yang beririsan' }
  }

  const { error } = await admin
    .from('targets')
    .update({
      periode_mulai: periodeMulai,
      periode_selesai: periodeSelesai,
      jumlah_target: jumlahTarget,
      keterangan: keterangan.trim() || null,
    })
    .eq('id', targetId)

  if (error) {
    return { sukses: false, pesan: 'Gagal menyimpan perubahan target. Coba lagi.' }
  }

  const { data: profil } = await admin.from('profiles').select('nama').eq('id', targetLama.user_id).single()
  await catatAktivitas({
    actorId: sesi.id,
    actorNama: sesi.nama,
    jenis: 'target_diubah',
    objekTipe: 'Target',
    objekId: targetId,
    objekNama: `${profil?.nama ?? targetLama.user_id} (${jumlahTarget} task)`,
    divisionId,
  })

  return { sukses: true }
}

export async function hapusTarget(divisionId: string, targetId: string): Promise<HasilTarget> {
  const sesi = await pastikanOwner(divisionId)

  const admin = createAdminClient()

  const { data: target } = await admin
    .from('targets')
    .select('user_id')
    .eq('id', targetId)
    .eq('division_id', divisionId)
    .single()

  if (!target) {
    return { sukses: false, pesan: 'Target tidak ditemukan' }
  }

  const { error } = await admin.from('targets').delete().eq('id', targetId)

  if (error) {
    return { sukses: false, pesan: 'Gagal menghapus target. Coba lagi.' }
  }

  const { data: profil } = await admin.from('profiles').select('nama').eq('id', target.user_id).single()
  await catatAktivitas({
    actorId: sesi.id,
    actorNama: sesi.nama,
    jenis: 'target_dihapus',
    objekTipe: 'Target',
    objekId: targetId,
    objekNama: profil?.nama ?? target.user_id,
    divisionId,
  })

  return { sukses: true }
}

export async function ambilRealisasi(divisionId: string): Promise<RealisasiTarget[]> {
  await pastikanAnggotaDivisi(divisionId)

  const admin = createAdminClient()

  const { data: targets } = await admin
    .from('targets')
    .select(
      'id, user_id, periode_mulai, periode_selesai, jumlah_target, keterangan, profiles!targets_user_id_fkey(nama)'
    )
    .eq('division_id', divisionId)
    .order('periode_mulai', { ascending: false })

  type Baris = {
    id: string
    user_id: string
    periode_mulai: string
    periode_selesai: string
    jumlah_target: number
    keterangan: string | null
    profiles: { nama: string }
  }

  const daftarTarget = (targets as unknown as Baris[] | null) ?? []
  if (daftarTarget.length === 0) return []

  const userIds = [...new Set(daftarTarget.map((t) => t.user_id))]

  const { data: assigneeRows } = await admin
    .from('task_assignees')
    .select('user_id, tasks!inner(completed_at, deleted_at)')
    .in('user_id', userIds)

  type BarisAssignee = { user_id: string; tasks: { completed_at: string | null; deleted_at: string | null } }

  const tugasSelesaiPerUser = new Map<string, string[]>()
  for (const row of (assigneeRows as unknown as BarisAssignee[] | null) ?? []) {
    if (row.tasks.deleted_at !== null || row.tasks.completed_at === null) continue
    const daftar = tugasSelesaiPerUser.get(row.user_id) ?? []
    daftar.push(row.tasks.completed_at)
    tugasSelesaiPerUser.set(row.user_id, daftar)
  }

  return daftarTarget.map((t) => {
    const awal = new Date(t.periode_mulai).getTime()
    const akhir = new Date(t.periode_selesai).getTime() + 24 * 60 * 60 * 1000
    const selesaiList = tugasSelesaiPerUser.get(t.user_id) ?? []
    const realisasi = selesaiList.filter((c) => {
      const d = new Date(c).getTime()
      return d >= awal && d < akhir
    }).length

    const persentase = t.jumlah_target > 0 ? Math.round((realisasi / t.jumlah_target) * 1000) / 10 : 0

    return {
      id: t.id,
      userId: t.user_id,
      userNama: t.profiles.nama,
      periodeMulai: t.periode_mulai,
      periodeSelesai: t.periode_selesai,
      jumlahTarget: t.jumlah_target,
      keterangan: t.keterangan,
      realisasi,
      persentase,
      status: hitungStatus(realisasi, t.jumlah_target, t.periode_mulai, t.periode_selesai),
    }
  })
}
