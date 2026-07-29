export type LemburReviewRow = {
  id: string
  user_id: string
  division_id: string
  tanggal: string
  jam_mulai: string
  jam_selesai: string
  alasan: string
  status: string | null
  catatan_owner: string | null
  created_at: string
}

export type LemburReviewItem = {
  id: string
  divisiNama: string
  tanggal: string
  jamMulai: string
  jamSelesai: string
  alasan: string
  status: 'menunggu' | 'disetujui' | 'ditolak'
  catatanOwner: string | null
  createdAt: string
  staffNama: string
  staffId: string
}

export function normalisasiStatusLembur(status: string | null | undefined): 'menunggu' | 'disetujui' | 'ditolak' {
  if (status === 'disetujui' || status === 'ditolak') return status
  return 'menunggu'
}

export function mapLemburReviewFromRows<T extends LemburReviewRow>(
  rows: T[],
  profiles: Array<{ id: string; nama: string }>,
  divisions: Array<{ id: string; nama: string }>
): LemburReviewItem[] {
  const profileById = new Map(profiles.map((p) => [p.id, p]))
  const divisionById = new Map(divisions.map((d) => [d.id, d]))

  return rows.map((r) => {
    const profile = profileById.get(r.user_id)
    const division = divisionById.get(r.division_id)

    return {
      id: r.id,
      divisiNama: division?.nama ?? 'Divisi tidak ditemukan',
      tanggal: r.tanggal,
      jamMulai: r.jam_mulai,
      jamSelesai: r.jam_selesai,
      alasan: r.alasan,
      status: normalisasiStatusLembur(r.status),
      catatanOwner: r.catatan_owner,
      createdAt: r.created_at,
      staffNama: profile?.nama ?? 'Staff tidak ditemukan',
      staffId: r.user_id,
    }
  })
}
