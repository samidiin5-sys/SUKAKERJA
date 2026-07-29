import { describe, expect, it } from 'vitest'
import { mapLemburReviewFromRows, normalisasiStatusLembur } from './lembur-utils'

describe('normalisasiStatusLembur', () => {
  it('menganggap status kosong sebagai menunggu', () => {
    expect(normalisasiStatusLembur(undefined)).toBe('menunggu')
    expect(normalisasiStatusLembur(null)).toBe('menunggu')
  })

  it('mempertahankan status yang sudah ada', () => {
    expect(normalisasiStatusLembur('disetujui')).toBe('disetujui')
    expect(normalisasiStatusLembur('ditolak')).toBe('ditolak')
  })
})

describe('mapLemburReviewFromRows', () => {
  it('memetakan row lembur menjadi data review walau relasi profil/divisi tidak tersedia secara langsung', () => {
    const rows = [
      {
        id: '1',
        user_id: 'user-1',
        division_id: 'division-1',
        tanggal: '2026-07-29',
        jam_mulai: '19:00',
        jam_selesai: '21:00',
        alasan: 'Perbaikan sistem',
        status: null,
        catatan_owner: null,
        created_at: '2026-07-29T10:00:00.000Z',
      },
    ]

    const result = mapLemburReviewFromRows(
      rows,
      [{ id: 'user-1', nama: 'Budi' }],
      [{ id: 'division-1', nama: 'IT' }]
    )

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      staffNama: 'Budi',
      divisiNama: 'IT',
      status: 'menunggu',
    })
  })
})
