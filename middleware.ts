import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Per debug: log dell'URL richiesto
  console.log('Middleware - URL richiesto:', request.url)
  
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Ottieni l'hostname per impostare correttamente i cookie
  const hostname = request.headers.get('host') || ''
  const cookieDomain = hostname.includes('localhost') ? undefined : '.' + hostname.split(':')[0]
  
  // Per debug: log del dominio dei cookie
  console.log('Middleware - Cookie domain:', cookieDomain)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = request.cookies.get(name)
          // Per debug: log del cookie recuperato
          console.log(`Middleware - Getting cookie ${name}:`, cookie?.value ? 'exists' : 'not found')
          return cookie?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Assicurati che i cookie siano impostati per il dominio corretto
          const cookieOptions = {
            ...options,
            domain: cookieDomain,
          }
          
          // Per debug: log del cookie impostato
          console.log(`Middleware - Setting cookie ${name}`, { domain: cookieOptions.domain })
          
          response.cookies.set({
            name,
            value,
            ...cookieOptions,
          })
        },
        remove(name: string, options: CookieOptions) {
          // Assicurati che i cookie siano rimossi per il dominio corretto
          const cookieOptions = {
            ...options,
            domain: cookieDomain,
          }
          
          // Per debug: log del cookie rimosso
          console.log(`Middleware - Removing cookie ${name}`, { domain: cookieOptions.domain })
          
          response.cookies.set({
            name,
            value: '',
            ...cookieOptions,
          })
        },
      },
    }
  )

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    
    // Per debug: log della sessione
    console.log('Middleware - Session:', session ? 'authenticated' : 'not authenticated')

    // Se l'utente non è autenticato e sta cercando di accedere a una pagina protetta
    if (!session && (
      request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/projects') ||
      request.nextUrl.pathname.startsWith('/sequences')
    )) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/'
      return NextResponse.redirect(redirectUrl)
    }

    // Se l'utente è autenticato e sta cercando di accedere alla home
    if (session && request.nextUrl.pathname === '/') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      return NextResponse.redirect(redirectUrl)
    }
  } catch (error) {
    // Per debug: log degli errori
    console.error('Middleware - Error:', error)
  }

  return response
}

export const config = {
  matcher: [
    '/',
    '/dashboard',
    '/projects/:path*',
    '/sequences/:path*',
  ],
}
