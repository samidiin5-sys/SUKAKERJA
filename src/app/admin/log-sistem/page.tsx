import AppShell from '@/components/app-shell'
import { ambilDataShell } from '@/lib/shell-data'
import { pastikanSuperAdmin } from '@/lib/auth/otorisasi'
import { ambilLogSistem } from './actions'
import { ambilSemuaDivisi } from '@/app/admin/divisi/actions'
import LogSistemClient from './log-sistem-client'

export default async function HalamanLogSistem() {
  await pastikanSuperAdmin()
  const data = await ambilDataShell()
  const [{ entries, total }, divisiList] = await Promise.all([
    ambilLogSistem({ halaman: 1 }),
    ambilSemuaDivisi(),
  ])
  return (
    <AppShell data={data}>
      <div className="mb-5">
        <h2 className="text-lg font-black text-maroon-800">Log Sistem</h2>
        <p className="text-sm text-muted">Riwayat semua aktivitas di sistem.</p>
      </div>
      <LogSistemClient entriesAwal={entries} totalAwal={total} divisiList={divisiList} />
    </AppShell>
  )
}
