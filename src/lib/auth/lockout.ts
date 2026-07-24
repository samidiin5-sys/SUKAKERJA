export const BATAS_PERCOBAAN_GAGAL = 5
export const DURASI_KUNCI_MENIT = 15

export function harusMenguncilAkun(jumlahGagal: number): boolean {
  return jumlahGagal >= BATAS_PERCOBAAN_GAGAL
}

export function hitungWaktuBukaKunci(sekarang: Date): Date {
  return new Date(sekarang.getTime() + DURASI_KUNCI_MENIT * 60 * 1000)
}

export function akunSedangTerkunci(lockedUntil: string | null, sekarang: Date): boolean {
  if (!lockedUntil) return false
  return new Date(lockedUntil).getTime() > sekarang.getTime()
}

export function sisaMenitTerkunci(lockedUntil: string, sekarang: Date): number {
  const selisihMs = new Date(lockedUntil).getTime() - sekarang.getTime()
  return Math.max(1, Math.ceil(selisihMs / 60000))
}
