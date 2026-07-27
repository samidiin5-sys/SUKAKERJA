'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { pastikanSuperAdmin, pastikanOwnerAtauSuperAdmin } from '@/lib/auth/otorisasi'

export type LogEntry = {
  id: string
  actorNama: string
  jenisAktivitas: string
  objekTipe: string
  objekId: string | null
  objekNama: string
  divisionId: string | null
  divisiNama: string | null
  createdAt: string
}

export type FilterLog = {
  actorNama?: string
  jenisAktivitas?: string
  divisionId?: string
  dari?: string
  sampai?: string
  halaman?: number
}

const PER_HALAMAN = 50

export async function ambilLogSistem(filter: FilterLog = {}): Promise<{ entries: LogEntry[]; total: number }> {
  await pastikanOwnerAtauSuperAdmin()
  const admin = createAdminClient()
  const halaman = filter.halaman ?? 1

  let query = admin
    .from('activity_log')
    .select('id, actor_nama, jenis_aktivitas, objek_tipe, objek_id, objek_nama, division_id, created_at, divisions(nama)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((halaman - 1) * PER_HALAMAN, halaman * PER_HALAMAN - 1)

  if (filter.actorNama) query = query.ilike('actor_nama', `%${filter.actorNama}%`)
  if (filter.jenisAktivitas) query = query.eq('jenis_aktivitas', filter.jenisAktivitas)
  if (filter.divisionId) query = query.eq('division_id', filter.divisionId)
  if (filter.dari) query = query.gte('created_at', `${filter.dari}T00:00:00Z`)
  if (filter.sampai) query = query.lte('created_at', `${filter.sampai}T23:59:59Z`)

  const { data, count, error } = await query
  if (error) return { entries: [], total: 0 }

  type Baris = {
    id: string; actor_nama: string; jenis_aktivitas: string
    objek_tipe: string; objek_id: string | null; objek_nama: string
    division_id: string | null; created_at: string
    divisions: { nama: string } | null
  }

  return {
    entries: ((data as unknown as Baris[]) ?? []).map(r => ({
      id: r.id, actorNama: r.actor_nama, jenisAktivitas: r.jenis_aktivitas,
      objekTipe: r.objek_tipe, objekId: r.objek_id, objekNama: r.objek_nama,
      divisionId: r.division_id, divisiNama: r.divisions?.nama ?? null,
      createdAt: r.created_at,
    })),
    total: count ?? 0,
  }
}

export async function eksporLogCSV(filter: Omit<FilterLog, 'halaman'> = {}): Promise<{ sukses: true; csv: string } | { sukses: false; pesan: string }> {
  await pastikanSuperAdmin()
  const admin = createAdminClient()

  let query = admin
    .from('activity_log')
    .select('id, actor_nama, jenis_aktivitas, objek_tipe, objek_id, objek_nama, division_id, created_at, divisions(nama)')
    .order('created_at', { ascending: false })

  if (filter.actorNama) query = query.ilike('actor_nama', `%${filter.actorNama}%`)
  if (filter.jenisAktivitas) query = query.eq('jenis_aktivitas', filter.jenisAktivitas)
  if (filter.divisionId) query = query.eq('division_id', filter.divisionId)
  if (filter.dari) query = query.gte('created_at', `${filter.dari}T00:00:00Z`)
  if (filter.sampai) query = query.lte('created_at', `${filter.sampai}T23:59:59Z`)

  const { data, error } = await query
  if (error) return { sukses: false, pesan: 'Gagal mengambil data. Coba lagi.' }

  type Baris = { actor_nama: string; jenis_aktivitas: string; objek_tipe: string; objek_id: string | null; objek_nama: string; division_id: string | null; created_at: string; divisions: { nama: string } | null }
  const rows = (data as unknown as Baris[]) ?? []

  function esc(v: string) { return `"${v.replace(/"/g, '""')}"` }
  const BOM = '\uFEFF'
  const header = 'Timestamp,User,Aksi,Tipe Entitas,Nama Entitas,Divisi\r\n'
  const baris = rows.map(r =>
    [esc(new Date(r.created_at).toLocaleString('id-ID')), esc(r.actor_nama), esc(r.jenis_aktivitas), esc(r.objek_tipe), esc(r.objek_nama), esc(r.divisions?.nama ?? '-')].join(',')
  ).join('\r\n')

  return { sukses: true, csv: BOM + header + baris }
}
