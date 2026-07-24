import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { ambilDataShell } from '@/lib/shell-data'
import { pastikanAnggotaDivisi } from '@/lib/auth/otorisasi'
import { ambilAnggotaDivisi, ambilDetailDivisi } from '../actions'
import { ambilRealisasi } from './actions'
import TargetClient from './target-client'

export default async function HalamanTarget({
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

  const [anggota, realisasi] = await Promise.all([ambilAnggotaDivisi(id), ambilRealisasi(id)])

  const bolehKelola = sesi.roleSistem === 'super_admin' || sesi.roleSistem === 'owner'

  return (
    <AppShell data={data}>
      <div className="mx-auto max-w-3xl">
        <a href={`/divisi/${id}`} className="mb-4 inline-block text-xs font-semibold text-maroon-700 hover:underline">
          ← Kembali ke Papan {divisi.nama}
        </a>

        <div className="mb-5">
          <h2 className="text-lg font-black text-maroon-800">Target & Realisasi — {divisi.nama}</h2>
          <p className="text-sm text-muted">Pantau target penyelesaian task per anggota per periode.</p>
        </div>

        <TargetClient
          divisionId={id}
          anggota={anggota}
          realisasiAwal={realisasi}
          bolehKelola={bolehKelola}
          currentUserId={sesi.id}
        />
      </div>
    </AppShell>
  )
}
