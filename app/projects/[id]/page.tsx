import { createServerComponentClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { NewSequenceDialog } from '@/components/sequences/new-sequence-dialog'
import { SequencesList } from '@/components/sequences/sequences-list'
import ProjectDashboard from '@/components/projects/project-dashboard'
import { LogoutButtonWrapper } from '@/components/auth/logout-button-wrapper'

export default async function ProjectPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerComponentClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/')
  }

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .single()

  if (projectError || !project) {
    notFound()
  }

  const { data: sequences } = await supabase
    .from('sequences')
    .select('*')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <div className="relative w-[120px] h-[48px]">
                <Image
                  src="/scenetrack_logo.png"
                  alt="SceneTrack Logo"
                  fill
                  className="object-contain dark:invert"
                  priority
                />
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <span className="text-muted-foreground">/</span>
              <h1 className="text-xl font-semibold tracking-tight">{project.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user.user_metadata.avatar_url && (
              <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-background">
                <Image
                  src={user.user_metadata.avatar_url}
                  alt="Avatar"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            {/* Sostituito form con LogoutButtonWrapper per evitare prefetching */}
            <LogoutButtonWrapper 
              variant="link" 
              size="sm"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors p-0 h-auto"
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <div className="mb-10 bg-card p-6 rounded-xl border shadow-sm">
          <h1 className="text-2xl font-bold mb-3 tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">{project.description || "Nessuna descrizione"}</p>
          <div className="flex items-center mt-4 text-sm text-muted-foreground">
            <span className="inline-block w-2 h-2 rounded-full bg-primary/60 mr-2"></span>
            Creato il {formatDate(project.created_at)}
          </div>
        </div>

        <div className="space-y-16">
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold tracking-tight">Sequenze</h2>
              <NewSequenceDialog projectId={project.id} />
            </div>
            <div className="bg-card rounded-xl p-6 shadow-sm border">
              <SequencesList initialSequences={sequences || []} />
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold tracking-tight">Panoramica</h2>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-sm border">
              <ProjectDashboard projectId={project.id} />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
