'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Project } from '@/types'
import { DeleteProjectButton } from './delete-project-button'
import { formatDate } from '@/lib/utils'

interface ProjectsListProps {
  initialProjects: Project[]
}

export function ProjectsList({ initialProjects }: ProjectsListProps) {
  const [projects, setProjects] = useState(initialProjects)

  const handleProjectDeleted = (deletedProjectId: string) => {
    setProjects(projects.filter(project => project.id !== deletedProjectId))
  }

  if (!projects.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          Non hai ancora creato nessun progetto
        </p>
        <p className="text-sm text-muted-foreground">
          Crea il tuo primo progetto per iniziare a organizzare il tuo lavoro
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <div
          key={project.id}
          className="relative border rounded-lg p-4 hover:border-primary transition-colors group"
        >
          <Link href={`/projects/${project.id}`} className="block">
            <h3 className="font-semibold mb-2">{project.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {project.description}
            </p>
            <div className="text-xs text-muted-foreground">
              Creato il {formatDate(project.created_at)}
            </div>
          </Link>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DeleteProjectButton 
              project={project} 
              onDeleted={() => handleProjectDeleted(project.id)}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
