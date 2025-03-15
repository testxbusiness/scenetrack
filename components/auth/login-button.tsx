'use client'

import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function LoginButton() {
  const handleLogin = async () => {
    const supabase = createClientComponentClient()
    
    // Per debug: log dell'origine
    console.log('Login Button - Origin:', window.location.origin)
    console.log('Login Button - Redirect URL:', `${window.location.origin}/auth/callback`)

    try {
      // Assicurati che l'URL di reindirizzamento sia completo e corretto
      const redirectUrl = `${window.location.origin}/auth/callback`
      
      console.log('Login Button - Inizializzazione login con Google...')
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      console.log('Login Button - Risposta auth:', data ? 'success' : 'no data')
      
      if (error) {
        console.error('Login Button - Error logging in:', error.message)
      }
    } catch (error) {
      console.error('Login Button - Unexpected error:', error)
    }
  }

  return (
    <Button
      onClick={handleLogin}
      className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
    >
      <svg width="24" height="24" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z"
        />
      </svg>
      Accedi con Google
    </Button>
  )
}
