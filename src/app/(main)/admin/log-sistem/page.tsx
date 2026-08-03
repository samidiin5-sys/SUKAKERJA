import { pastikanOwnerAtauSuperAdmin } from '@/lib/auth/otorisasi'
import { createAdminClient } from '@/lib/supabase/admin'
import { ambilLogSistem } from './actions'
import LogSistemClient from './log-sistem-client'

export default async function HalamanLogSistem() {
  await pastikanOwnerAtauSuperAdmin()

  const admin = createAdminClient()
  const [{ entries, total }, { data: divisiRaw }] = await Promise.all([
    ambilLogSistem({ halaman: 1 }),
    admin.from('divisions').select('id, nama, deskripsi, warna, status, division_members(count)').is('deleted_at', null).order('nama'),
  ])

  type BarisDivisi = {
    id: string
    nama: string
    deskripsi: string | null
    warna: string
    status: string
    division_members: { count: number }[]
  }

  const divisiList = ((divisiRaw as unknown as BarisDivisi[] | null) ?? []).map((d) => ({
    id: d.id,
    nama: d.nama,
    deskripsi: d.deskripsi,
    warna: d.warna,
    status: d.status,
    jumlahAnggota: d.division_members?.[0]?.count ?? 0,
  }))

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 rounded-[24px] border border-cream-200 bg-white p-5 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">Audit sistem</p>
        <h2 className="mt-1 text-lg font-black text-maroon-800">Log Sistem</h2>
        <p className="mt-1 text-sm text-muted">Riwayat semua aktivitas di sistem.</p>
      </div>
      <LogSistemClient entriesAwal={entries} totalAwal={total} divisiList={divisiList} />
    </div>
  )
}
