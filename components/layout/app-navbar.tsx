'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase/client'
import { LayoutDashboard, FolderOpen, ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LogoutButton } from '@/components/auth/logout-button'
import { Project } from '@/types'

interface AppNavbarProps {
  projects: Project[]
  userAvatarUrl?: string
}

export function AppNavbar({ projects, userAvatarUrl }: AppNavbarProps) {
  const [expanded, setExpanded] = useState(true)
  const pathname = usePathname()
  const supabase = createClientComponentClient()

  const toggleExpanded = () => {
    setExpanded(!expanded)
  }

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`)
  }

  return (
    <div className={`h-screen bg-card border-r flex flex-col transition-all duration-300 shadow-sm ${expanded ? 'w-64' : 'w-16'}`}>
      {/* Logo */}
      <div className="p-4 border-b flex justify-between items-center">
        <div className={`relative ${expanded ? 'w-[120px] h-[48px]' : 'w-8 h-8'}`}>
          <Image
            src="/scenetrack_logo.png"
            alt="SceneTrack Logo"
            fill
            className="object-contain dark:invert"
            priority
          />
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleExpanded}
          className="h-8 w-8 rounded-full hover:bg-primary/10"
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {expanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </Button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-1 px-3">
          <Link 
            href="/dashboard" 
            className={`flex items-center px-3 py-2.5 rounded-lg transition-all ${
              isActive('/dashboard') 
                ? 'bg-primary/10 text-primary font-medium' 
                : 'hover:bg-muted/60 text-foreground/80 hover:text-foreground'
            }`}
          >
            <LayoutDashboard size={18} strokeWidth={1.75} />
            {expanded && <span className="ml-3 text-sm">Dashboard</span>}
          </Link>

          {/* Projects Section */}
          <div className="mt-8">
            {expanded && <h3 className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Projects</h3>}
            <div className="space-y-1">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className={`flex items-center px-3 py-2.5 rounded-lg transition-all ${
                    isActive(`/projects/${project.id}`) 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'hover:bg-muted/60 text-foreground/80 hover:text-foreground'
                  }`}
                >
                  <FolderOpen size={18} strokeWidth={1.75} />
                  {expanded && (
                    <span className="ml-3 text-sm truncate">{project.name}</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </div>

      {/* User Profile & Logout */}
      <div className="p-4 border-t flex items-center justify-between">
        <div className="flex items-center">
          {userAvatarUrl ? (
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-background">
              <Image
                src={userAvatarUrl}
                alt="User Avatar"
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xs text-muted-foreground">U</span>
            </div>
          )}
          {expanded && (
            <span className="ml-3 text-sm font-medium truncate">Account</span>
          )}
        </div>
        {/* Sostituito form con LogoutButton per evitare prefetching */}
        <LogoutButton 
          variant="ghost" 
          iconOnly 
          className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive" 
        />
      </div>
    </div>
  )
}
