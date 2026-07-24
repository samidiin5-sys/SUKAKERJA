import { NextResponse } from 'next/server'
import { jalankanBuatTugasRutin } from '@/lib/cron/buat-tugas-rutin'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const secret = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : request.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const hasil = await jalankanBuatTugasRutin()
    return NextResponse.json(hasil)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
