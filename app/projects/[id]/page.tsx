import { createServerComponentClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { NewSequenceDialog } from '@/components/sequences/new-sequence-dialog'
import { SequencesList } from '@/components/sequences/sequences-list'
import ProjectDashboard from '@/components/projects/project-dashboard'

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
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <div className="relative w-[120px] h-[48px]">
                <Image
                  src="/scenetrack_logo.png"
                  alt="SceneTrack Logo"
                  fill
                  className="object-contain dark:invert"
                />
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
              <span className="text-muted-foreground">/</span>
              <h1 className="text-xl font-semibold">{project.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user.user_metadata.avatar_url && (
              <div className="relative w-8 h-8">
                <Image
                  src={user.user_metadata.avatar_url}
                  alt="Avatar"
                  fill
                  className="rounded-full object-cover"
                />
              </div>
            )}
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Esci
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <p className="text-muted-foreground">{project.description}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Creato il {formatDate(project.created_at)}
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Sequenze</h2>
              <NewSequenceDialog projectId={project.id} />
            </div>
            <SequencesList initialSequences={sequences || []} />
          </section>

          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Dashboard</h2>
            </div>
            <ProjectDashboard projectId={project.id} />
          </section>
        </div>
      </main>
    </div>
  )
}
