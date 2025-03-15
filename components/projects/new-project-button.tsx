'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { ProjectWizard } from './project-wizard'

export function NewProjectButton() {
  const [showWizard, setShowWizard] = useState(false)

  return (
    <>
      <Button 
        onClick={() => setShowWizard(true)}
        className="flex items-center gap-2"
      >
        <Plus size={16} />
        <span>Nuovo Progetto</span>
      </Button>

      {showWizard && (
        <ProjectWizard />
      )}
    </>
  )
}