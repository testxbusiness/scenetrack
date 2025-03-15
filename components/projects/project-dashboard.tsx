'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Sequence, Block } from '@/types'
import ProjectStatsDashboard from '../dashboard/ProjectStatsDashboard'

interface ProjectDashboardProps {
  projectId: string
}

export default function ProjectDashboard({ projectId }: ProjectDashboardProps) {
  const [sequences, setSequences] = useState<Sequence[]>([])
  const [selectedSequence, setSelectedSequence] = useState<string | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  // Fetch sequences for this project
  useEffect(() => {
    const fetchSequences = async () => {
      if (!projectId) return

      try {
        const { data, error } = await supabase
          .from('sequences')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })

        if (error) throw error
        if (data) {
          setSequences(data)
        }
      } catch (error) {
        console.error('Error fetching sequences:', error)
      }
    }

    if (projectId) {
      fetchSequences()
    }
  }, [projectId, supabase])

  // Fetch blocks based on selected sequence or all sequences in the project
  useEffect(() => {
    const fetchBlocks = async () => {
      if (!projectId) return
      setLoading(true)

      try {
        let query = supabase
          .from('blocks')
          .select(`
            *,
            photos (
              id,
              file_path,
              file_name,
              comment
            ),
            block_cast (
              id,
              cast_member_id,
              cast_member:cast_members(id, name)
            )
          `)
          .order('order_number', { ascending: true })

        // If a sequence is selected, filter by that sequence
        if (selectedSequence) {
          query = query.eq('sequence_id', selectedSequence)
        } else {
          // Otherwise, get blocks from all sequences in the project
          const { data: projectSequences } = await supabase
            .from('sequences')
            .select('id')
            .eq('project_id', projectId)

          if (projectSequences && projectSequences.length > 0) {
            const sequenceIds = projectSequences.map(seq => seq.id)
            query = query.in('sequence_id', sequenceIds)
          }
        }

        const { data, error } = await query

        if (error) throw error
        if (data) {
          setBlocks(data)
        }
      } catch (error) {
        console.error('Error fetching blocks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBlocks()
  }, [projectId, selectedSequence, supabase])

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {sequences.length > 0 && (
          <div>
            <label htmlFor="sequence-select" className="block text-sm font-medium mb-1">
              Sequenza
            </label>
            <select
              id="sequence-select"
              value={selectedSequence || ''}
              onChange={(e) => setSelectedSequence(e.target.value || null)}
              className="w-full p-2 rounded-md border bg-background"
            >
              <option value="">Tutte le sequenze</option>
              {sequences.map((sequence) => (
                <option key={sequence.id} value={sequence.id}>
                  {sequence.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : blocks.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium">Nessuna scena trovata</h3>
          <p className="text-muted-foreground mt-2">
            Crea nuove scene per visualizzare le statistiche
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Project Stats Dashboard - Card-based layout with circular progress */}
          <ProjectStatsDashboard projectId={projectId} />
        </div>
      )}
    </div>
  )
}
