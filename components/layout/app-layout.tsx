'use client'

import { ReactNode } from 'react'
import { AppNavbar } from './app-navbar'
import { Project } from '@/types'

interface AppLayoutProps {
  children: ReactNode
  projects: Project[]
  userAvatarUrl?: string
}

export function AppLayout({ children, projects, userAvatarUrl }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <AppNavbar projects={projects} userAvatarUrl={userAvatarUrl} />
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  )
}