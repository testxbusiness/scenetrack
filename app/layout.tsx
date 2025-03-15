import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"
import { AppLayout } from '@/components/layout/app-layout'
import { createServerComponentClient } from '@/lib/supabase/server'
import { cn } from "@/lib/utils"
// Update Toaster import to use Sonner which is compatible with Next.js 14
import { Toaster } from "sonner"

// Define fontSans variable
const fontSans = GeistSans

export const metadata: Metadata = {
  title: "SceneTrack - Gestione Segretari di Edizione",
  description: "Piattaforma professionale per segretari di edizione: gestisci progetti, sequenze e dettagli del set in modo efficiente.",
  icons: {
    icon: '/favicon.ico',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  let projects: any[] = []
  let userAvatarUrl: string | undefined

  if (session) {
    // Fetch user's projects
    const { data: projectsData } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    
    projects = projectsData || []
    userAvatarUrl = session.user?.user_metadata?.avatar_url
  }

  return (
    <html lang="en">
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {session ? (
            <AppLayout projects={projects} userAvatarUrl={userAvatarUrl}>
              {children}
            </AppLayout>
          ) : (
            children
          )}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
