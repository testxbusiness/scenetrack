'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Block, CastMember } from '@/types'

interface NewBlockDialogProps {
  sequenceId: string
  insertPosition: number
  onClose: () => void
  onCreated: (block: Block) => void
}

export function NewBlockDialog({ sequenceId, insertPosition, onClose, onCreated }: NewBlockDialogProps) {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [sceneNumber, setSceneNumber] = useState('')
  const [location, setLocation] = useState('')
  const [interiorExterior, setInteriorExterior] = useState('')
  const [timeOfDay, setTimeOfDay] = useState('')
  const [sceneDate, setSceneDate] = useState('')
  const [sceneTime, setSceneTime] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [castMembers, setCastMembers] = useState<CastMember[]>([])
  const [selectedCastMembers, setSelectedCastMembers] = useState<string[]>([])
  const [newCastMember, setNewCastMember] = useState('')
  const supabase = createClientComponentClient()

  // Fetch project ID from sequence
  useEffect(() => {
    const fetchProjectId = async () => {
      try {
        const { data, error } = await supabase
          .from('sequences')
          .select('project_id')
          .eq('id', sequenceId)
          .single()

        if (error) throw error
        if (data) {
          setProjectId(data.project_id)
        }
      } catch (error) {
        console.error('Error fetching project ID:', error)
      }
    }

    fetchProjectId()
  }, [sequenceId, supabase])

  // Fetch cast members for this project
  useEffect(() => {
    if (!projectId) return

    const fetchCastMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('cast_members')
          .select('*')
          .eq('project_id', projectId)
          .order('name', { ascending: true })

        if (error) throw error
        if (data) {
          setCastMembers(data)
        }
      } catch (error) {
        console.error('Error fetching cast members:', error)
      }
    }

    fetchCastMembers()
  }, [projectId, supabase])

  const handleAddCastMember = async () => {
    if (!newCastMember.trim() || !projectId) return

    try {
      const { data, error } = await supabase
        .from('cast_members')
        .insert([
          {
            project_id: projectId,
            name: newCastMember.trim(),
            description: 'Personaggio aggiunto manualmente'
          }
        ])
        .select()
        .single()

      if (error) throw error
      if (data) {
        setCastMembers([...castMembers, data])
        setSelectedCastMembers([...selectedCastMembers, data.id])
        setNewCastMember('')
      }
    } catch (error) {
      console.error('Error adding cast member:', error)
      alert('Errore durante l\'aggiunta del personaggio. Per favore riprova.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // First insert the block
      const { data, error } = await supabase
        .from('blocks')
        .insert([
          {
            sequence_id: sequenceId,
            title,
            notes,
            order_number: insertPosition,
            completed: false,
            scene_number: sceneNumber || null,
            location: location || null,
            interior_exterior: interiorExterior || null,
            time_of_day: timeOfDay || null,
            scene_date: sceneDate || null,
            scene_time: sceneTime || null,
          },
        ])
        .select()
        .single()

      if (error) throw error

      // Then create the cast relationships if any cast members are selected
      if (selectedCastMembers.length > 0) {
        const blockCastRelations = selectedCastMembers.map(castMemberId => ({
          block_id: data.id,
          cast_member_id: castMemberId
        }))

        const { error: relationError } = await supabase
          .from('block_cast')
          .insert(blockCastRelations)

        if (relationError) {
          console.error('Error creating cast relationships:', relationError)
          // Non-critical error, don't throw
        }
      }

      onCreated(data)
      onClose()
    } catch (error) {
      console.error('Error creating scene:', error)
      alert('Errore durante la creazione della scena. Per favore riprova.')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCastMember = (id: string) => {
    if (selectedCastMembers.includes(id)) {
      setSelectedCastMembers(selectedCastMembers.filter(cmId => cmId !== id))
    } else {
      setSelectedCastMembers([...selectedCastMembers, id])
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-background rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Nuova Scena</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="sceneNumber" className="block text-sm font-medium mb-1">
              Numero Scena
            </label>
            <input
              type="text"
              id="sceneNumber"
              value={sceneNumber}
              onChange={(e) => setSceneNumber(e.target.value)}
              className="w-full p-2 rounded-md border bg-background"
              placeholder="es. 1A"
            />
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium mb-1">
              Location
            </label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-2 rounded-md border bg-background"
              placeholder="es. CASA DI MARIO"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="interiorExterior" className="block text-sm font-medium mb-1">
                Interno/Esterno
              </label>
              <select
                id="interiorExterior"
                value={interiorExterior}
                onChange={(e) => setInteriorExterior(e.target.value)}
                className="w-full p-2 rounded-md border bg-background"
              >
                <option value="">Seleziona...</option>
                <option value="INT">Interno</option>
                <option value="EST">Esterno</option>
                <option value="INT/EST">Interno/Esterno</option>
                <option value="EST/INT">Esterno/Interno</option>
              </select>
            </div>
            <div>
              <label htmlFor="timeOfDay" className="block text-sm font-medium mb-1">
                Tempo
              </label>
              <select
                id="timeOfDay"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className="w-full p-2 rounded-md border bg-background"
              >
                <option value="">Seleziona...</option>
                <option value="GIORNO">Giorno</option>
                <option value="NOTTE">Notte</option>
                <option value="ALBA">Alba</option>
                <option value="TRAMONTO">Tramonto</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Timeline della scena
            </label>
            <div className="grid grid-cols-1 gap-2 mb-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="useDate"
                  name="dateType"
                  checked={!sceneDate.startsWith('GIORNO')}
                  onChange={() => {
                    if (sceneDate.startsWith('GIORNO')) {
                      setSceneDate('');
                    }
                  }}
                  className="mr-2"
                />
                <label htmlFor="useDate" className="text-sm">Usa data specifica</label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="useDay"
                  name="dateType"
                  checked={sceneDate.startsWith('GIORNO')}
                  onChange={() => {
                    if (!sceneDate.startsWith('GIORNO')) {
                      setSceneDate('GIORNO ');
                    }
                  }}
                  className="mr-2"
                />
                <label htmlFor="useDay" className="text-sm">Usa giorno generico (es. GIORNO 1)</label>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {sceneDate.startsWith('GIORNO') ? (
                <div>
                  <label htmlFor="sceneDay" className="block text-sm font-medium mb-1">
                    Giorno
                  </label>
                  <input
                    type="text"
                    id="sceneDay"
                    value={sceneDate}
                    onChange={(e) => setSceneDate(e.target.value)}
                    placeholder="GIORNO 1"
                    className="w-full p-2 rounded-md border bg-background"
                  />
                </div>
              ) : (
                <div>
                  <label htmlFor="sceneDate" className="block text-sm font-medium mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    id="sceneDate"
                    value={sceneDate}
                    onChange={(e) => setSceneDate(e.target.value)}
                    className="w-full p-2 rounded-md border bg-background"
                  />
                </div>
              )}
              <div>
                <label htmlFor="sceneTime" className="block text-sm font-medium mb-1">
                  Ora
                </label>
                <input
                  type="time"
                  id="sceneTime"
                  value={sceneTime}
                  onChange={(e) => setSceneTime(e.target.value)}
                  className="w-full p-2 rounded-md border bg-background"
                />
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Titolo
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 rounded-md border bg-background"
            />
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-1">
              Note
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 rounded-md border bg-background h-24"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Cast
            </label>
            <div className="border rounded-md p-2 bg-background mb-2">
              <div className="flex flex-wrap gap-1 mb-2">
                {castMembers.map(castMember => (
                  <button
                    key={castMember.id}
                    type="button"
                    onClick={() => toggleCastMember(castMember.id)}
                    className={`px-2 py-1 rounded-md text-sm ${
                      selectedCastMembers.includes(castMember.id)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {castMember.name}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCastMember}
                  onChange={(e) => setNewCastMember(e.target.value)}
                  placeholder="Aggiungi personaggio"
                  className="flex-1 p-2 rounded-md border bg-background text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddCastMember}
                  disabled={!newCastMember.trim()}
                >
                  +
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creazione...' : 'Crea Scena'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
