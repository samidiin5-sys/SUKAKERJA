import { describe, it, expect } from 'vitest'
import {
  harusMenguncilAkun,
  hitungWaktuBukaKunci,
  akunSedangTerkunci,
  sisaMenitTerkunci,
  BATAS_PERCOBAAN_GAGAL,
  DURASI_KUNCI_MENIT,
} from './lockout'

describe('harusMenguncilAkun', () => {
  it('mengembalikan false sebelum mencapai batas percobaan', () => {
    expect(harusMenguncilAkun(BATAS_PERCOBAAN_GAGAL - 1)).toBe(false)
  })

  it('mengembalikan true tepat pada batas percobaan', () => {
    expect(harusMenguncilAkun(BATAS_PERCOBAAN_GAGAL)).toBe(true)
  })

  it('mengembalikan true melebihi batas percobaan', () => {
    expect(harusMenguncilAkun(BATAS_PERCOBAAN_GAGAL + 3)).toBe(true)
  })
})

describe('hitungWaktuBukaKunci', () => {
  it('menambahkan durasi kunci dalam menit ke waktu sekarang', () => {
    const sekarang = new Date('2026-07-21T10:00:00Z')
    const hasil = hitungWaktuBukaKunci(sekarang)
    const selisihMenit = (hasil.getTime() - sekarang.getTime()) / 60000
    expect(selisihMenit).toBe(DURASI_KUNCI_MENIT)
  })
})

describe('akunSedangTerkunci', () => {
  it('mengembalikan false jika locked_until kosong', () => {
    expect(akunSedangTerkunci(null, new Date())).toBe(false)
  })

  it('mengembalikan true jika waktu kunci masih di masa depan', () => {
    const sekarang = new Date('2026-07-21T10:00:00Z')
    const lockedUntil = new Date('2026-07-21T10:10:00Z').toISOString()
    expect(akunSedangTerkunci(lockedUntil, sekarang)).toBe(true)
  })

  it('mengembalikan false jika waktu kunci sudah lewat', () => {
    const sekarang = new Date('2026-07-21T10:20:00Z')
    const lockedUntil = new Date('2026-07-21T10:10:00Z').toISOString()
    expect(akunSedangTerkunci(lockedUntil, sekarang)).toBe(false)
  })
})

describe('sisaMenitTerkunci', () => {
  it('membulatkan ke atas sisa waktu dalam menit', () => {
    const sekarang = new Date('2026-07-21T10:00:00Z')
    const lockedUntil = new Date('2026-07-21T10:04:30Z').toISOString()
    expect(sisaMenitTerkunci(lockedUntil, sekarang)).toBe(5)
  })

  it('minimal mengembalikan 1 menit meski sisa waktu sangat singkat', () => {
    const sekarang = new Date('2026-07-21T10:00:00Z')
    const lockedUntil = new Date('2026-07-21T10:00:10Z').toISOString()
    expect(sisaMenitTerkunci(lockedUntil, sekarang)).toBe(1)
  })
})
