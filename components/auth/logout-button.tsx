'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

interface LogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  children?: React.ReactNode
  iconOnly?: boolean
}

export function LogoutButton({ 
  variant = 'ghost', 
  size = 'default', 
  className = '',
  children,
  iconOnly = false
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleLogout = async () => {
    try {
      setIsLoading(true)
      console.log('LogoutButton - Inizializzazione logout...')
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('LogoutButton - Errore durante il logout:', error.message)
        return
      }
      
      console.log('LogoutButton - Logout completato con successo')
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('LogoutButton - Errore imprevisto:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (iconOnly) {
    return (
      <Button
        onClick={handleLogout}
        disabled={isLoading}
        variant={variant}
        size="icon"
        className={`h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive ${className}`}
        aria-label="Sign out"
      >
        <LogOut size={16} />
      </Button>
    )
  }

  return (
    <Button
      onClick={handleLogout}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      {children || (
        <>
          <LogOut size={16} className="mr-2" />
          Esci
        </>
      )}
    </Button>
  )
}
