import { createServerComponentClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { LoginButton } from '@/components/auth/login-button'

export default async function HomePage() {
  const supabase = createServerComponentClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="relative w-[120px] h-[120px] mx-auto mb-8">
          <Image
            src="/scenetrack_logo.png"
            alt="SceneTrack Logo"
            fill
            priority
            sizes="120px"
            className="object-contain dark:invert"
          />
        </div>
        <h1 className="text-2xl font-bold">
          Il tuo strumento essenziale per un&apos;edizione sempre in ordine
        </h1>
        <p className="text-muted-foreground">
          Gestisci i tuoi progetti, organizza le sequenze e tieni traccia
          di ogni dettaglio del tuo lavoro.
        </p>
        <div className="pt-4 flex justify-center">
          <LoginButton />
        </div>
      </div>
    </div>
  )
}
