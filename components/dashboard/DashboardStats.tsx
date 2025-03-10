'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Project, Sequence, Block } from '@/types'
import TimeOfDayChart from './charts/TimeOfDayChart'
import LocationTypeChart from './charts/LocationTypeChart'
import SceneProgressionChart from './charts/SceneProgressionChart'
import LocationHeatmap from './charts/LocationHeatmap'
import CompletionStatusChart from './charts/CompletionStatusChart'

interface DashboardStatsProps {
  userId: string
}

export default function DashboardStats({ userId }: DashboardStatsProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [sequences, setSequences] = useState<Sequence[]>([])
  const [selectedSequence, setSelectedSequence] = useState<string | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (error) throw error
        if (data) {
          setProjects(data)
          if (data.length > 0 && !selectedProject) {
            setSelectedProject(data[0].id)
          }
        }
      } catch (error) {
        console.error('Error fetching projects:', error)
      }
    }

    if (userId) {
      fetchProjects()
    }
  }, [userId, supabase, selectedProject])

  // Fetch sequences when project changes
  useEffect(() => {
    const fetchSequences = async () => {
      if (!selectedProject) return

      try {
        const { data, error } = await supabase
          .from('sequences')
          .select('*')
          .eq('project_id', selectedProject)
          .order('created_at', { ascending: false })

        if (error) throw error
        if (data) {
          setSequences(data)
          setSelectedSequence(null) // Reset selected sequence when project changes
        }
      } catch (error) {
        console.error('Error fetching sequences:', error)
      }
    }

    if (selectedProject) {
      fetchSequences()
    }
  }, [selectedProject, supabase])

  // Fetch blocks based on selected project and sequence
  useEffect(() => {
    const fetchBlocks = async () => {
      if (!selectedProject) return
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
            .eq('project_id', selectedProject)

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
  }, [selectedProject, selectedSequence, supabase])

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
        <div>
          <label htmlFor="project-select" className="block text-sm font-medium mb-1">
            Progetto
          </label>
          <select
            id="project-select"
            value={selectedProject || ''}
            onChange={(e) => setSelectedProject(e.target.value || null)}
            className="w-full p-2 rounded-md border bg-background"
          >
            <option value="">Tutti i progetti</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {selectedProject && (
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
            Seleziona un progetto diverso o crea nuove scene
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
          
          <div className="bg-card rounded-lg shadow p-4 md:col-span-2">
            <h3 className="text-lg font-medium mb-4">Stato Completamento</h3>
            <CompletionStatusChart data={completionData} total={totalBlocks} />
          </div>
        </div>
      )}
    </div>
  )
}
