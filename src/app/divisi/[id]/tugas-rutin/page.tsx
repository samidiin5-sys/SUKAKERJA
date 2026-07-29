import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { ambilDataShell } from '@/lib/shell-data'
import { pastikanAnggotaDivisi } from '@/lib/auth/otorisasi'
import { ambilAnggotaDivisi, ambilDetailDivisi } from '../actions'
import { ambilTemplates } from './actions'
import DaftarTemplate from './daftar-template'

export default async function HalamanTugasRutin({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await ambilDataShell()

  let sesi
  try {
    sesi = await pastikanAnggotaDivisi(id)
  } catch {
    redirect('/dashboard')
  }

  const divisi = await ambilDetailDivisi(id)
  if (!divisi) {
    redirect('/dashboard')
  }

  const [templates, anggota] = await Promise.all([
    ambilTemplates(id),
    ambilAnggotaDivisi(id),
  ])

  const bolehKelola = sesi.roleSistem === 'super_admin' || sesi.roleSistem === 'owner'

  return (
    <AppShell data={data}>
      <div className="mx-auto max-w-3xl">
        <a
          href={`/divisi/${id}`}
          className="mb-4 inline-block text-xs font-semibold text-maroon-700 hover:underline"
        >
          ← Kembali ke Papan {divisi.nama}
        </a>

        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-maroon-800">Tugas Rutin — {divisi.nama}</h2>
            <p className="text-sm text-muted">
              Template tugas yang dibuat secara otomatis sesuai jadwal berulang.
            </p>
          </div>
        </div>

        <DaftarTemplate
          divisionId={id}
          templatesAwal={templates}
          anggota={anggota}
          bolehKelola={bolehKelola}
        />
      </div>
    </AppShell>
  )
}
