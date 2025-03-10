'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface DeleteSequenceDialogProps {
  sequenceId: string
  sequenceName: string
  projectId: string
  onClose: () => void
}

export function DeleteSequenceDialog({ sequenceId, sequenceName, projectId, onClose }: DeleteSequenceDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleDelete = async () => {
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('sequences')
        .delete()
        .eq('id', sequenceId)

      if (error) throw error

      router.refresh()
      router.push(`/projects/${projectId}`)
    } catch (error) {
      console.error('Error deleting sequence:', error)
      alert('Errore durante l\'eliminazione della sequenza. Per favore riprova.')
    } finally {
      setIsLoading(false)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Elimina Sequenza</h2>
        <p className="text-muted-foreground mb-6">
          Sei sicuro di voler eliminare la sequenza &quot;{sequenceName}&quot;? Questa azione non può essere annullata.
        </p>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Annulla
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? 'Eliminazione...' : 'Elimina'}
          </Button>
        </div>
      </div>
    </div>
  )
}
