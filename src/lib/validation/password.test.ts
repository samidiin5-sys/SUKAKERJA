import { describe, it, expect } from 'vitest'
import { validasiKekuatanPassword } from './password'

describe('validasiKekuatanPassword', () => {
  it('menolak password kurang dari 8 karakter', () => {
    const hasil = validasiKekuatanPassword('abc123', 'user@test.com', 'Budi')
    expect(hasil.valid).toBe(false)
    expect(hasil.alasan).toContain('Password minimal 8 karakter')
  })

  it('menolak password tanpa huruf', () => {
    const hasil = validasiKekuatanPassword('12345678', 'user@test.com', 'Budi')
    expect(hasil.valid).toBe(false)
    expect(hasil.alasan).toContain('Password harus mengandung minimal satu huruf')
  })

  it('menolak password tanpa angka', () => {
    const hasil = validasiKekuatanPassword('abcdefgh', 'user@test.com', 'Budi')
    expect(hasil.valid).toBe(false)
    expect(hasil.alasan).toContain('Password harus mengandung minimal satu angka')
  })

  it('menolak password yang termasuk daftar umum', () => {
    const hasil = validasiKekuatanPassword('password1', 'user@test.com', 'Budi')
    expect(hasil.valid).toBe(false)
    expect(hasil.alasan).toContain('Password terlalu umum, gunakan kombinasi yang lebih unik')
  })

  it('menolak password yang sama dengan bagian lokal email', () => {
    const hasil = validasiKekuatanPassword('rizky123', 'rizky123@sukashawarma.com', 'Rizky')
    expect(hasil.valid).toBe(false)
    expect(hasil.alasan).toContain('Password tidak boleh sama dengan email')
  })

  it('menerima password yang memenuhi seluruh ketentuan', () => {
    const hasil = validasiKekuatanPassword('EditorHebat24', 'rizky@sukashawarma.com', 'Rizky')
    expect(hasil.valid).toBe(true)
    expect(hasil.alasan).toEqual([])
  })
})
