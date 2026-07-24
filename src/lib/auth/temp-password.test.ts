import { describe, it, expect } from 'vitest'
import { buatPasswordSementara } from './temp-password'

describe('buatPasswordSementara', () => {
  it('menghasilkan password minimal 12 karakter secara bawaan', () => {
    const password = buatPasswordSementara()
    expect(password.length).toBeGreaterThanOrEqual(12)
  })

  it('tidak mengandung karakter ambigu seperti 0, O, 1, l, I', () => {
    const password = buatPasswordSementara()
    expect(password).not.toMatch(/[0O1lI]/)
  })

  it('menghasilkan password berbeda pada setiap pemanggilan', () => {
    const a = buatPasswordSementara()
    const b = buatPasswordSementara()
    expect(a).not.toBe(b)
  })

  it('menghormati panjang kustom yang diberikan', () => {
    const password = buatPasswordSementara(16)
    expect(password.length).toBe(16)
  })
})
