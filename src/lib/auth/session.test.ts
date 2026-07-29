import { describe, expect, it } from 'vitest'
import { shouldRedirectToLogin } from './session'

describe('shouldRedirectToLogin', () => {
  it('tidak mengarahkan ke login saat sesi masih ada walau user belum tersedia', () => {
    const session = { user: { id: 'user-1' } }

    expect(shouldRedirectToLogin({ session: session as never, user: null })).toBe(false)
  })

  it('mengarahkan ke login saat tidak ada sesi dan tidak ada user', () => {
    expect(shouldRedirectToLogin({ session: null, user: null })).toBe(true)
  })
})
