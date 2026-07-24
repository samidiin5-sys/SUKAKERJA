import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { ambilDataShell } from '@/lib/shell-data'
import { ambilDetailKaryawan } from '../actions'
import RingkasanBebanKerja from './ringkasan-beban'

function formatTanggal(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function inisial(nama: string) {
  return nama.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

const LABEL_ROLE_DIVISI: Record<string, string> = {
  staff: 'Staff',
}

export default async function HalamanDetailKaryawan({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await ambilDataShell()

  if (data.roleSistem !== 'super_admin') {
    redirect('/dashboard')
  }

  const detail = await ambilDetailKaryawan(id)
  if (!detail) {
    redirect('/admin/karyawan')
  }

  return (
    <AppShell data={data}>
      <div className="mx-auto max-w-2xl">
        <a href="/admin/karyawan" className="mb-4 inline-block text-xs font-semibold text-maroon-700 hover:underline">
          ← Kembali ke Kelola Karyawan
        </a>

        <div className="mb-5 flex items-center gap-4 rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-maroon-800 text-lg font-black text-cream-50">
            {inisial(detail.nama)}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-black text-ink">{detail.nama}</p>
            <p className="text-sm text-muted">{detail.email}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-cream-200 px-2 py-0.5 font-bold text-muted">
                {detail.jabatan ?? 'Tanpa jabatan'}
              </span>
              <span className="rounded-full bg-cream-200 px-2 py-0.5 font-bold text-muted">
                {detail.roleSistem === 'super_admin' ? 'Super Admin' : 'Karyawan'}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 font-bold ${
                  detail.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {detail.status === 'aktif' ? 'Aktif' : 'Tidak Aktif'}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-muted">Bergabung {formatTanggal(detail.createdAt)}</p>
          </div>
        </div>

        <div className="mb-5">
          <h3 className="mb-2 text-xs font-bold tracking-widest text-muted">DIVISI</h3>
          {detail.divisi.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-cream-200 bg-white p-4 text-sm text-muted">
              Belum tergabung di divisi mana pun.
            </p>
          ) : (
            <ul className="space-y-2">
              {detail.divisi.map((d) => (
                <li key={d.id}>
                  <a
                    href={`/divisi/${d.id}`}
                    className="flex items-center justify-between rounded-xl border border-cream-200 bg-white px-4 py-2.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.warna }} aria-hidden />
                      <span className="text-sm font-bold text-ink">{d.nama}</span>
                    </span>
                    <span className="text-xs font-semibold text-muted">{LABEL_ROLE_DIVISI[d.role] ?? d.role}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <RingkasanBebanKerja userId={id} />
      </div>
    </AppShell>
  )
}
