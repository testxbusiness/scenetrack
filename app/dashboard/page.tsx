import { createServerComponentClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
// Fix the import path - ensure it matches the actual file name
import { ProjectsList } from '@/components/projects/projects-list'
import { NewProjectButton } from '@/components/projects/new-project-button'

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
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-10 tracking-tight">Dashboard</h1>
        
        <div className="space-y-12">
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold tracking-tight">I tuoi progetti</h2>
              <NewProjectButton />
            </div>
            <div className="bg-card rounded-xl p-6 shadow-sm border">
              <ProjectsList initialProjects={projects || []} />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
