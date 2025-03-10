import { createServerComponentClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = createServerComponentClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    return NextResponse.json(
      { error: 'Errore durante il logout' },
      { status: 500 }
    )
  }

  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL))
}
