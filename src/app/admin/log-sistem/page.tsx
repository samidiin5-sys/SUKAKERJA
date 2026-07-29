import AppShell from '@/components/app-shell'
import { ambilDataShell } from '@/lib/shell-data'
import { pastikanOwnerAtauSuperAdmin } from '@/lib/auth/otorisasi'
import { ambilLogSistem } from './actions'
import { ambilSemuaDivisi } from '@/app/admin/divisi/actions'
import LogSistemClient from './log-sistem-client'

export default async function HalamanLogSistem() {
  await pastikanOwnerAtauSuperAdmin()
  const data = await ambilDataShell()
  const [{ entries, total }, divisiList] = await Promise.all([
    ambilLogSistem({ halaman: 1 }),
    ambilSemuaDivisi(),
  ])
  return (
    <AppShell data={data}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 rounded-[24px] border border-cream-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">Audit sistem</p>
          <h2 className="mt-1 text-lg font-black text-maroon-800">Log Sistem</h2>
          <p className="mt-1 text-sm text-muted">Riwayat semua aktivitas di sistem.</p>
        </div>
        <LogSistemClient entriesAwal={entries} totalAwal={total} divisiList={divisiList} />
      </div>
    </AppShell>
  )
}
