'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Block, CastMember } from '@/types'

interface EditBlockDialogProps {
  block: Block
  onClose: () => void
  onDeleted: () => void
}

// Global variable to track if the edit dialog is open
let isEditDialogOpen = false;

export function EditBlockDialog({ block, onClose, onDeleted }: EditBlockDialogProps) {
  // Set the dialog as open when component mounts
  useEffect(() => {
    isEditDialogOpen = true;
    return () => {
      isEditDialogOpen = false;
    };
  }, []);
  const [title, setTitle] = useState(block.title || '')
  const [notes, setNotes] = useState(block.notes || '')
  const [orderNumber, setOrderNumber] = useState(block.order_number.toString())
  const [sceneNumber, setSceneNumber] = useState(block.scene_number || '')
  const [location, setLocation] = useState(block.location || '')
  const [interiorExterior, setInteriorExterior] = useState(block.interior_exterior || '')
  const [timeOfDay, setTimeOfDay] = useState(block.time_of_day || '')
  const [history, setHistory] = useState(block.history || '')
  const [sceneDate, setSceneDate] = useState(block.scene_date || '')
  const [sceneTime, setSceneTime] = useState(block.scene_time || '')
  const [isLoading, setIsLoading] = useState(false)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [castMembers, setCastMembers] = useState<CastMember[]>([])
  const [selectedCastMembers, setSelectedCastMembers] = useState<string[]>([])
  const [newCastMember, setNewCastMember] = useState('')
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Fetch project ID from sequence
  useEffect(() => {
    const fetchProjectId = async () => {
      try {
        const { data, error } = await supabase
          .from('sequences')
          .select('project_id')
          .eq('id', block.sequence_id)
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
  }, [block.sequence_id, supabase])

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

  // Fetch current cast for this block
  useEffect(() => {
    const fetchBlockCast = async () => {
      try {
        const { data, error } = await supabase
          .from('block_cast')
          .select('cast_member_id')
          .eq('block_id', block.id)

        if (error) throw error
        if (data) {
          setSelectedCastMembers(data.map(item => item.cast_member_id))
        }
      } catch (error) {
        console.error('Error fetching block cast:', error)
      }
    }

    fetchBlockCast()
  }, [block.id, supabase])

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

  const toggleCastMember = (id: string) => {
    if (selectedCastMembers.includes(id)) {
      setSelectedCastMembers(selectedCastMembers.filter(cmId => cmId !== id))
    } else {
      setSelectedCastMembers([...selectedCastMembers, id])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Update the block
      const { error } = await supabase
        .from('blocks')
        .update({
          title,
          notes,
          order_number: parseInt(orderNumber),
          scene_number: sceneNumber || null,
          location: location || null,
          interior_exterior: interiorExterior || null,
          time_of_day: timeOfDay || null,
          history: history || null,
          scene_date: sceneDate || null,
          scene_time: sceneTime || null,
        })
        .eq('id', block.id)

      if (error) throw error
      
      // Close the dialog after successful update
      router.refresh()

      // Update cast relationships
      // First, delete all existing relationships
      const { error: deleteError } = await supabase
        .from('block_cast')
        .delete()
        .eq('block_id', block.id)

      if (deleteError) throw deleteError

      // Then create new relationships
      if (selectedCastMembers.length > 0) {
        const blockCastRelations = selectedCastMembers.map(castMemberId => ({
          block_id: block.id,
          cast_member_id: castMemberId
        }))

        const { error: insertError } = await supabase
          .from('block_cast')
          .insert(blockCastRelations)

        if (insertError) {
          console.error('Error updating cast relationships:', insertError)
          // Non-critical error, don't throw
        }
      }

      onClose()
    } catch (error) {
      console.error('Error updating scene:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Sei sicuro di voler eliminare questa scena?')) return

    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('id', block.id)

      if (error) throw error

      onDeleted()
      onClose()
      router.refresh()
    } catch (error) {
      console.error('Error deleting scene:', error)
      alert('Errore durante l\'eliminazione della scena')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-background rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Modifica Scena</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="orderNumber" className="block text-sm font-medium mb-1">
                Numero Ordine
              </label>
              <input
                type="number"
                id="orderNumber"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full p-2 rounded-md border bg-background"
                required
                min="1"
              />
            </div>
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
                <option value="CREPUSCOLO">Crepuscolo</option>
                <option value="MATTINA">Mattina</option>
                <option value="POMERIGGIO">Pomeriggio</option>
                <option value="SERA">Sera</option>
              </select>
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
            <label htmlFor="history" className="block text-sm font-medium mb-1">
              Cronologia
            </label>
            <textarea
              id="history"
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              className="w-full p-2 rounded-md border bg-background h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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

          <div className="flex justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              Elimina
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvataggio...' : 'Salva'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
