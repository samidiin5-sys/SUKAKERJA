import { randomBytes } from 'crypto'

const KARAKTER = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'

export function buatPasswordSementara(panjang = 12): string {
  const bytes = randomBytes(panjang)
  let hasil = ''
  for (let i = 0; i < panjang; i++) {
    hasil += KARAKTER[bytes[i] % KARAKTER.length]
  }
  return hasil
}
