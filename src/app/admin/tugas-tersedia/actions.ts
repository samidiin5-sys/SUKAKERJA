'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { pastikanOwnerAtauSuperAdmin } from '@/lib/auth/otorisasi'
import { kirimTugasPool } from '@/app/divisi/[id]/actions'

export type BoardDivisi = { id: string; nama: string }

export async function ambilBoardUntukPool(divisionId: string): Promise<BoardDivisi[]> {
  if (!divisionId) return []
  await pastikanOwnerAtauSuperAdmin()
  const admin = createAdminClient()

  const { data } = await admin
    .from('boards')
    .select('id, nama')
    .eq('division_id', divisionId)
    .is('deleted_at', null)
    .order('urutan', { ascending: true })

  return ((data as { id: string; nama: string }[] | null) ?? [])
}

export { kirimTugasPool }
