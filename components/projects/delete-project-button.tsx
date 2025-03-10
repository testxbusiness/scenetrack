'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeleteProjectDialog } from './delete-project-dialog'
import { Project } from '@/types'

interface DeleteProjectButtonProps {
  project: Project
  onDeleted: () => void
}

export function DeleteProjectButton({ project, onDeleted }: DeleteProjectButtonProps) {
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
        <DeleteProjectDialog
          projectId={project.id}
          projectName={project.name}
          onClose={() => {
            setShowDeleteDialog(false)
            onDeleted()
          }}
        />
      )}
    </>
  )
}
