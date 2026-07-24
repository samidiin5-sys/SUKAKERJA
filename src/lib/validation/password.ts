const PASSWORD_UMUM = [
  'password', 'password1', '12345678', '123456789', 'qwerty123',
  'admin123', 'welcome1', 'letmein1', 'abc12345', 'passw0rd',
]

export type HasilValidasiPassword = {
  valid: boolean
  alasan: string[]
}

export function validasiKekuatanPassword(
  password: string,
  email: string,
  nama: string
): HasilValidasiPassword {
  const alasan: string[] = []

  if (password.length < 8) {
    alasan.push('Password minimal 8 karakter')
  }
  if (!/[a-zA-Z]/.test(password)) {
    alasan.push('Password harus mengandung minimal satu huruf')
  }
  if (!/[0-9]/.test(password)) {
    alasan.push('Password harus mengandung minimal satu angka')
  }
  if (PASSWORD_UMUM.includes(password.toLowerCase())) {
    alasan.push('Password terlalu umum, gunakan kombinasi yang lebih unik')
  }
  const emailLokal = email.split('@')[0]?.toLowerCase()
  if (emailLokal && password.toLowerCase() === emailLokal) {
    alasan.push('Password tidak boleh sama dengan email')
  }
  if (nama && password.toLowerCase() === nama.toLowerCase()) {
    alasan.push('Password tidak boleh sama dengan nama pengguna')
  }

  return { valid: alasan.length === 0, alasan }
}
