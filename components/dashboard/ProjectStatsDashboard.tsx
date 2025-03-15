"use client"

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

interface ProjectStatsDashboardProps {
  projectId: string
}

export default function ProjectStatsDashboard({ projectId }: ProjectStatsDashboardProps) {
  const [blocks, setBlocks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [photoCount, setPhotoCount] = useState(0)
  const [completedBlocks, setCompletedBlocks] = useState(0)
  const supabase = createClientComponentClient()

  // Funzione per recuperare i dati del progetto
  const fetchProjectData = async () => {
    if (!projectId) return
    setLoading(true)
    try {
      // Recupera le sequenze associate al progetto
      const { data: projectSequences, error: sequencesError } = await supabase
        .from('sequences')
        .select('id')
        .eq('project_id', projectId)

      if (sequencesError) throw sequencesError

      if (!projectSequences || projectSequences.length === 0) {
        setBlocks([])
        setPhotoCount(0)
        setCompletedBlocks(0)
        setLoading(false)
        return
      }

      const sequenceIds = projectSequences.map(seq => seq.id)

      // Recupera i blocchi (scene) con le relative foto
      const { data: blocksData, error: blocksError } = await supabase
        .from('blocks')
        .select(`
          *,
          photos (id, file_path, file_name)
        `)
        .in('sequence_id', sequenceIds)
        .order('order_number', { ascending: true })

      if (blocksError) throw blocksError

      if (blocksData) {
        setBlocks(blocksData)
        let photos = 0
        let completed = 0

        // Conta le scene completate e le foto caricate
        blocksData.forEach(block => {
          if (block.completed) completed++
          if (block.photos) {
            photos += block.photos.length
          }
        })

        setPhotoCount(photos)
        setCompletedBlocks(completed)
      }
    } catch (error) {
      console.error('Error fetching project data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjectData()
  }, [projectId])

  const totalBlocks = blocks.length
  const completionPercentage = totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0

  // Calcola la distribuzione del tempo di scena
  const validTimes = ['GIORNO', 'NOTTE', 'ALBA', 'TRAMONTO', 'CREPUSCOLO', 'MATTINA', 'POMERIGGIO', 'SERA']
  const timeDistribution = blocks.reduce((acc, block) => {
    let time: string;
    if (!block.time_of_day) {
      time = 'NON DISPONIBILE'
    } else {
      time = block.time_of_day.toUpperCase()
      if (!validTimes.includes(time)) {
        time = 'ALTRO'
      }
    }
    acc[time] = (acc[time] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const timeLabels = Object.keys(timeDistribution)
  const timeCounts = Object.values(timeDistribution)
  const timeData = {
    labels: timeLabels,
    datasets: [
      {
        data: timeCounts,
        backgroundColor: ['#4F46E5', '#10B981', '#8B5CF6', '#EC4899', '#06B6D4', '#F59E0B', '#EF4444', '#14B8A6', '#A1A1AA'],
        hoverBackgroundColor: ['#4338CA', '#059669', '#7C3AED', '#DB2777', '#0891B2', '#D97706', '#DC2626', '#0D9488', '#71717A'],
      },
    ],
  }

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Card per l'overview del progetto */}
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Overview Progetto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalBlocks}</div>
                  <div className="text-sm text-muted-foreground">Scene Totali</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">{completedBlocks}</div>
                  <div className="text-sm text-muted-foreground">Scene Completate</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{photoCount}</div>
                  <div className="text-sm text-muted-foreground">Foto Caricate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card con il grafico donut per la progressione delle scene completate */}
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Progressione Scene Completate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-32 h-32 mx-auto">
                  <CircularProgressbar
                    value={completionPercentage}
                    text={`${completionPercentage}%`}
                    styles={buildStyles({
                      textSize: '16px',
                      pathColor: '#4F46E5',
                      textColor: '#4F46E5',
                      trailColor: '#D1D5DB'
                    })}
                  />
                </div>
                <p className="text-center mt-4">{completedBlocks} su {totalBlocks} scene completate</p>
              </CardContent>
            </Card>
            
            {/* Card per il grafico donut della distribuzione del tempo di scena */}
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Distribuzione Tempo Scene</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-64 h-64 mx-auto">
                  <Doughnut data={timeData} options={{ plugins: { legend: { position: 'bottom' } } }} />
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
