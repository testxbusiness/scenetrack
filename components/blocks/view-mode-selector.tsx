'use client'

import { LayoutGrid, AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type ViewMode = 'horizontal' | 'vertical' | 'grid'

interface ViewModeSelectorProps {
  currentMode: ViewMode
  onChange: (mode: ViewMode) => void
}

export function ViewModeSelector({ currentMode, onChange }: ViewModeSelectorProps) {
  return (
    <div className="flex items-center gap-2 bg-card rounded-lg p-1">
      <Button
        variant={currentMode === 'horizontal' ? 'default' : 'ghost'}
        size="icon"
        onClick={() => onChange('horizontal')}
        className="h-8 w-8"
      >
        <AlignHorizontalJustifyCenter className="h-4 w-4" />
      </Button>
      <Button
        variant={currentMode === 'vertical' ? 'default' : 'ghost'}
        size="icon"
        onClick={() => onChange('vertical')}
        className="h-8 w-8"
      >
        <AlignVerticalJustifyCenter className="h-4 w-4" />
      </Button>
      <Button
        variant={currentMode === 'grid' ? 'default' : 'ghost'}
        size="icon"
        onClick={() => onChange('grid')}
        className="h-8 w-8"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  )
}
