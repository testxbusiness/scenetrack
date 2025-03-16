  import { createServerClient, type CookieOptions } from '@supabase/ssr'
  import { cookies } from 'next/headers'
  import { NextResponse, type NextRequest } from 'next/server'

  export async function GET(request: NextRequest) {
    // Per debug: log dell'URL richiesto e dei parametri
    const requestUrl = new URL(request.url)
    console.log('Auth Callback - URL richiesto:', request.url)
    console.log('Auth Callback - Origin:', requestUrl.origin)
    
    const code = requestUrl.searchParams.get('code')
    console.log('Auth Callback - Code presente:', !!code)
    
  // Ottieni l'hostname per impostare correttamente i cookie
  const hostname = request.headers.get('host') || ''
  // Non impostare esplicitamente il dominio dei cookie per evitare problemi di accesso
  const cookieDomain = hostname.includes('localhost') ? undefined : undefined
  console.log('Auth Callback - Hostname:', hostname)
  console.log('Auth Callback - Cookie domain:', cookieDomain)
    
    const origin = requestUrl.origin

    if (code) {
      const cookieStore = cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              const cookie = cookieStore.get(name)
              console.log(`Auth Callback - Getting cookie ${name}:`, cookie?.value ? 'exists' : 'not found')
              return cookie?.value
            },
            set(name: string, value: string, options: CookieOptions) {
              // Assicurati che i cookie siano impostati per il dominio corretto
              const cookieOptions = {
                ...options,
                domain: cookieDomain,
              }
              console.log(`Auth Callback - Setting cookie ${name}`, { domain: cookieOptions.domain })
              cookieStore.set({ name, value, ...cookieOptions })
            },
            remove(name: string, options: CookieOptions) {
              // Assicurati che i cookie siano rimossi per il dominio corretto
              const cookieOptions = {
                ...options,
                domain: cookieDomain,
              }
              console.log(`Auth Callback - Removing cookie ${name}`, { domain: cookieOptions.domain })
              cookieStore.set({ name, value: '', ...cookieOptions })
            },
          },
        }
      )

      try {
        console.log('Auth Callback - Scambio del codice per la sessione...')
        const { error, data } = await supabase.auth.exchangeCodeForSession(code)
        
        if (error) {
          console.error('Auth Callback - Errore nello scambio del codice:', error.message)
          return NextResponse.redirect(`${origin}/auth/auth-code-error`)
        }
        
        console.log('Auth Callback - Sessione creata con successo')
        
        // Verifica che la sessione sia stata creata correttamente
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Auth Callback - Sessione verificata:', session ? 'presente' : 'assente')
        
        if (session) {
          console.log('Auth Callback - User ID:', session.user.id)
          console.log('Auth Callback - User Email:', session.user.email)
        }
        
        // Log di tutti i cookie disponibili
        const allCookies = cookieStore.getAll()
        console.log('Auth Callback - Cookies disponibili:', allCookies.map(c => c.name))
        
        console.log('Auth Callback - Reindirizzamento a /dashboard')
        
        // Forza un reindirizzamento completo con cache-control per evitare problemi di caching
        const redirectUrl = `${origin}/dashboard`
        const response = NextResponse.redirect(redirectUrl)
        
        // Aggiungi header per evitare il caching
        response.headers.set('Cache-Control', 'no-store, max-age=0')
        
        return response
      } catch (error) {
        console.error('Auth Callback - Errore imprevisto:', error)
        return NextResponse.redirect(`${origin}/auth/auth-code-error`)
      }
    }

    console.log('Auth Callback - Nessun codice trovato, reindirizzamento alla pagina di errore')
    // Return the user to an error page with some instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }
