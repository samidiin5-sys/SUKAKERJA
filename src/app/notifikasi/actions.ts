'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { ambilSesiPengguna } from '@/lib/auth/otorisasi'

export type NotifikasiItem = {
  id: string
  jenis: string
  pesan: string
  taskId: string | null
  divisionId: string | null
  isRead: boolean
  createdAt: string
}

export async function ambilNotifikasiSaya(): Promise<NotifikasiItem[]> {
  const sesi = await ambilSesiPengguna()
  const admin = createAdminClient()

  const { data } = await admin
    .from('notifications')
    .select('id, jenis, pesan, task_id, division_id, is_read, created_at')
    .eq('user_id', sesi.id)
    .order('created_at', { ascending: false })
    .limit(30)

  return (data ?? []).map((row) => ({
    id: row.id,
    jenis: row.jenis,
    pesan: row.pesan,
    taskId: row.task_id,
    divisionId: row.division_id,
    isRead: row.is_read,
    createdAt: row.created_at,
  }))
}

export async function ambilJumlahBelumDibaca(): Promise<number> {
  const sesi = await ambilSesiPengguna()
  const admin = createAdminClient()

  const { count } = await admin
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', sesi.id)
    .eq('is_read', false)

  return count ?? 0
}

export async function tandaiDibaca(notifikasiId: string): Promise<{ sukses: boolean }> {
  const sesi = await ambilSesiPengguna()
  const admin = createAdminClient()

  const { error } = await admin
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notifikasiId)
    .eq('user_id', sesi.id)

  return { sukses: !error }
}

export async function tandaiSemuaDibaca(): Promise<{ sukses: boolean }> {
  const sesi = await ambilSesiPengguna()
  const admin = createAdminClient()

  const { error } = await admin
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', sesi.id)
    .eq('is_read', false)

  return { sukses: !error }
}
