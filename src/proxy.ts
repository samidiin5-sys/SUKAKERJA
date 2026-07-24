import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const RUTE_PUBLIK = ['/login']

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isPublicRoute = RUTE_PUBLIK.includes(path)

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (user && !isPublicRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('must_change_password, status')
      .eq('id', user.id)
      .single()

    // Akun bisa saja dinonaktifkan Super Admin SETELAH sesi ini terbentuk.
    // Sesi Supabase yang masih valid tidak otomatis tahu soal itu, jadi
    // status diperiksa ulang di setiap permintaan dan sesi diakhiri paksa
    // kalau ternyata sudah nonaktif.
    if (profile?.status === 'nonaktif') {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('nonaktif', '1')
      return NextResponse.redirect(url)
    }

    if (profile?.must_change_password && path !== '/ganti-password') {
      const url = request.nextUrl.clone()
      url.pathname = '/ganti-password'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
