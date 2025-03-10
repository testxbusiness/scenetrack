import { createServerComponentClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ProjectWizard } from '@/components/projects/project-wizard'
import { ProjectsList } from '@/components/projects/projects-list'

export default async function DashboardPage() {
  const supabase = createServerComponentClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/')
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-[120px] h-[48px]">
              <Image
                src="/scenetrack_logo.png"
                alt="SceneTrack Logo"
                fill
                className="object-contain dark:invert"
                sizes="120px"
              />
            </div>
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            {user.user_metadata.avatar_url && (
              <div className="relative w-8 h-8">
                <Image
                  src={user.user_metadata.avatar_url}
                  alt="Avatar"
                  fill
                  className="rounded-full object-cover"
                  sizes="32px"
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
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">I tuoi progetti</h2>
            <ProjectWizard />
          </div>
          <ProjectsList initialProjects={projects || []} />
        </section>
      </main>
    </div>
  )
}
