import { createServerComponentClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { BlocksList } from '@/components/blocks/blocks-list-client'
import Link from 'next/link'

interface SequencePageProps {
  params: {
    id: string
  }
}

export default async function SequencePage({ params }: SequencePageProps) {
  const supabase = createServerComponentClient()

  // Ottieni la sequenza con il progetto associato
  const { data: sequence } = await supabase
    .from('sequences')
    .select(`
      *,
      project:projects (
        id,
        name
      )
    `)
    .eq('id', params.id)
    .single()

  if (!sequence) {
    notFound()
  }

  // Ottieni i blocchi con le foto associate
  const { data: blocks } = await supabase
    .from('blocks')
    .select(`
      *,
      photos (
        id,
        file_path,
        file_name,
        comment
      )
    `)
    .eq('sequence_id', params.id)
    .order('order_number')

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Link
              href={`/projects/${sequence.project.id}`}
              className="hover:text-foreground"
            >
              {sequence.project.name}
            </Link>
            <span>/</span>
            <span className="text-foreground">{sequence.name}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">{sequence.name}</h1>
          {sequence.description && (
            <p className="text-muted-foreground">{sequence.description}</p>
          )}
        </div>

        <BlocksList initialBlocks={blocks || []} sequenceId={params.id} />
      </main>
    </div>
  )
}
