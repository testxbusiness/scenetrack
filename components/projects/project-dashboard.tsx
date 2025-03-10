'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Sequence, Block, CastMember } from '@/types'
import TimeOfDayChart from '../dashboard/charts/TimeOfDayChart'
import LocationTypeChart from '../dashboard/charts/LocationTypeChart'
import SceneProgressionChart from '../dashboard/charts/SceneProgressionChart'
import LocationHeatmap from '../dashboard/charts/LocationHeatmap'
import CompletionStatusChart from '../dashboard/charts/CompletionStatusChart'
import CastDistributionChart from '../dashboard/charts/CastDistributionChart'

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

  // Prepare data for charts
  const timeOfDayData = blocks.reduce((acc, block) => {
    if (block.time_of_day) {
      const existing = acc.find(item => item.name === block.time_of_day)
      if (existing) {
        existing.value++
      } else {
        acc.push({ name: block.time_of_day, value: 1 })
      }
    }
    return acc
  }, [] as { name: string; value: number }[])

  const locationTypeData = blocks.reduce((acc, block) => {
    if (block.interior_exterior) {
      const existing = acc.find(item => item.name === block.interior_exterior)
      if (existing) {
        existing.value++
      } else {
        acc.push({ name: block.interior_exterior, value: 1 })
      }
    }
    return acc
  }, [] as { name: string; value: number }[])

  const locationData = blocks.reduce((acc, block) => {
    if (block.location) {
      const existing = acc.find(item => item.name === block.location)
      if (existing) {
        existing.value++
      } else {
        acc.push({ name: block.location, value: 1 })
      }
    }
    return acc
  }, [] as { name: string; value: number }[])

  // Prepare completion data
  const completedBlocks = blocks.filter(block => block.completed).length
  const totalBlocks = blocks.length
  const completionData = [
    { name: 'Completate', value: completedBlocks },
    { name: 'Da completare', value: totalBlocks - completedBlocks }
  ]

  // Prepare progression data (scenes created over time)
  const progressionData = blocks.reduce((acc, block) => {
    const date = new Date(block.created_at).toLocaleDateString()
    const existing = acc.find(item => item.date === date)
    if (existing) {
      existing.count++
    } else {
      acc.push({ date, count: 1 })
    }
    return acc
  }, [] as { date: string; count: number }[])
  
  // Prepare cast distribution data
  const castDistributionData = blocks.reduce((acc, block) => {
    if (block.block_cast && block.block_cast.length > 0) {
      block.block_cast.forEach(relation => {
        if (relation.cast_member) {
          const castMember = relation.cast_member as CastMember;
          const existing = acc.find(item => item.name === castMember.name)
          if (existing) {
            existing.count++
          } else {
            acc.push({ name: castMember.name, count: 1 })
          }
        }
      })
    }
    return acc
  }, [] as { name: string; count: number }[])
  
  // Sort progression data by date
  progressionData.sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })

  // Add cumulative count
  let cumulativeCount = 0
  const progressionDataWithCumulative = progressionData.map(item => {
    cumulativeCount += item.count
    return {
      ...item,
      cumulative: cumulativeCount
    }
  })

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg shadow p-4">
            <h3 className="text-lg font-medium mb-4">Distribuzione Tempo</h3>
            <TimeOfDayChart data={timeOfDayData} />
          </div>
          
          <div className="bg-card rounded-lg shadow p-4">
            <h3 className="text-lg font-medium mb-4">Interni vs Esterni</h3>
            <LocationTypeChart data={locationTypeData} />
          </div>
          
          <div className="bg-card rounded-lg shadow p-4">
            <h3 className="text-lg font-medium mb-4">Progressione Scene</h3>
            <SceneProgressionChart data={progressionDataWithCumulative} />
          </div>
          
          <div className="bg-card rounded-lg shadow p-4">
            <h3 className="text-lg font-medium mb-4">Distribuzione Location</h3>
            <LocationHeatmap data={locationData} />
          </div>
          
          <div className="bg-card rounded-lg shadow p-4">
            <h3 className="text-lg font-medium mb-4">Distribuzione Cast</h3>
            <CastDistributionChart data={castDistributionData} />
          </div>
          
          <div className="bg-card rounded-lg shadow p-4">
            <h3 className="text-lg font-medium mb-4">Stato Completamento</h3>
            <CompletionStatusChart data={completionData} total={totalBlocks} />
          </div>
        </div>
      )}
    </div>
  )
}
