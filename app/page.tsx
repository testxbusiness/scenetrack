import { createServerComponentClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { LoginButton } from '@/components/auth/login-button'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = createServerComponentClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[500px] overflow-hidden">
        <Image
          src="/Movie making black and white.jpg"
          alt="Film production scene"
          fill
          priority
          className="object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background"></div>
        
        <div className="relative container mx-auto px-4 h-full flex flex-col items-center justify-center text-center z-10">
          <div className="relative w-[400px] h-[400px] mx-auto mb-8">
            <Image
              src="/scenetrack_logo.png"
              alt="SceneTrack Logo"
              fill
              priority
              sizes="400px"
              className="object-contain dark:invert"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold max-w-3xl mb-6">
          Il tuo strumento essenziale per un'edizione sempre organizzata
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mb-8">
          Gestisci i tuoi progetti, organizza le sequenze e tieni traccia di ogni dettaglio del tuo lavoro
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <LoginButton />
            <Link href="#features" className="text-primary hover:text-primary/90 font-medium transition-colors">
              Scopri di più →
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Perché i professionisti del cinema scelgono SceneTrack</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="h-48 relative mb-6 overflow-hidden rounded-lg">
                <Image 
                  src="/Movie track twisted.jpg" 
                  alt="Organized Planning" 
                  fill 
                  className="object-cover hover:scale-105 transition-transform duration-300" 
                />
              </div>
              <h3 className="text-xl font-semibold mb-3">Organizzazione Semplificata</h3>
              <p className="text-muted-foreground">Tieni tutte le tue scene, sequenze e dettagli di produzione in un unico posto per un accesso rapido e una gestione efficiente.</p>
            </div>
            
            <div className="bg-card p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="h-48 relative mb-6 overflow-hidden rounded-lg">
                <Image 
                  src="/Director ciak.jpg" 
                  alt="Director with clapperboard" 
                  fill 
                  className="object-cover hover:scale-105 transition-transform duration-300" 
                />
              </div>
              <h3 className="text-xl font-semibold mb-3">Collaborazione migliorata</h3>
              <p className="text-muted-foreground">Condividi i dettagli del progetto con il tuo team in tempo reale, garantendo che tutti siano sempre allineati durante la produzione.</p>
            </div>
            
            <div className="bg-card p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="h-48 relative mb-6 overflow-hidden rounded-lg">
                <Image 
                  src="/Movie camera POV.jpg" 
                  alt="Camera perspective" 
                  fill 
                  className="object-cover hover:scale-105 transition-transform duration-300" 
                />
              </div>
              <h3 className="text-xl font-semibold mb-3">Tracking dettagliato</h3>
              <p className="text-muted-foreground">Monitora ogni aspetto della tua produzione con strumenti di tracciamento avanzati, progettati appositamente per i professionisti del cinema.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto bg-card p-8 rounded-xl border shadow-sm">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <Image
                src="/Ciak rainbow.jpg"
                alt="Colorful clapperboard"
                fill
                className="object-cover rounded-full"
              />
            </div>
            <p className="text-xl italic mb-6">"SceneTrack ha rivoluzionato il modo in cui gestiamo le nostre produzioni. Ciò che prima richiedeva ore, ora si completa in pochi minuti. È uno strumento essenziale per ogni filmmaker serio."</p>
            <p className="font-semibold">Marco Rossi</p>
            <p className="text-sm text-muted-foreground">Regista, Roma</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Sei pronto a rivoluzionare il tuo flusso di lavoro nella produzione?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">Unisciti a migliaia di professionisti del cinema che si affidano a SceneTrack per mantenere le loro produzioni organizzate ed efficienti.</p>
          <div className="flex justify-center">
            <LoginButton />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Nessuna carta di credito richiesta. Inizia in pochi secondi.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} SceneTrack. All rights reserved.</p>
          <div className="mt-2">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <span className="mx-2">•</span>
            <Link href="/terms" className="hover:text-foreground transition-colors">Termini di Servizio</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
