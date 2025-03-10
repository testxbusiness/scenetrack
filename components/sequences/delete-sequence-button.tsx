'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeleteSequenceDialog } from './delete-sequence-dialog'
import { Sequence } from '@/types'

interface DeleteSequenceButtonProps {
  sequence: Sequence
  onDeleted: () => void
}

export function DeleteSequenceButton({ sequence, onDeleted }: DeleteSequenceButtonProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={(e) => {
          e.preventDefault() // Prevent link navigation
          setShowDeleteDialog(true)
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {showDeleteDialog && (
        <DeleteSequenceDialog
          sequenceId={sequence.id}
          sequenceName={sequence.name}
          projectId={sequence.project_id}
          onClose={() => {
            setShowDeleteDialog(false)
            onDeleted()
          }}
        />
      )}
    </>
  )
}
