'use client'

import { useState, useEffect } from 'react'
import { Block } from '@/types'
import { X, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SearchDialogProps {
  blocks: Block[]
  onClose: () => void
  onFilteredBlocksChange: (filteredBlocks: Block[]) => void
}

type SearchCriteria = {
  completed?: boolean | null
  notCompleted?: boolean | null
  timeOfDay?: string | null
  interiorExterior?: string | null
  hasPhotos?: boolean | null
  hasCast?: boolean | null
  location?: string | null
  searchText?: string | null
}

export function SearchDialog({ blocks, onClose, onFilteredBlocksChange }: SearchDialogProps) {
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({})
  const [availableTimeOfDay, setAvailableTimeOfDay] = useState<string[]>([])
  const [availableLocations, setAvailableLocations] = useState<string[]>([])
  const [availableInteriorExterior, setAvailableInteriorExterior] = useState<string[]>([])
  
  // Extract unique values for dropdowns
  useEffect(() => {
    const timeOfDaySet = new Set<string>()
    const locationsSet = new Set<string>()
    const interiorExteriorSet = new Set<string>()
    
    blocks.forEach(block => {
      if (block.time_of_day) timeOfDaySet.add(block.time_of_day)
      if (block.location) locationsSet.add(block.location)
      if (block.interior_exterior) interiorExteriorSet.add(block.interior_exterior)
    })
    
    setAvailableTimeOfDay(Array.from(timeOfDaySet).sort())
    setAvailableLocations(Array.from(locationsSet).sort())
    setAvailableInteriorExterior(Array.from(interiorExteriorSet).sort())
  }, [blocks])
  
  // Apply filters whenever search criteria changes
  useEffect(() => {
    const filteredBlocks = blocks.filter(block => {
      // Check completion status
      if (searchCriteria.completed && !block.completed) return false
      if (searchCriteria.notCompleted && block.completed) return false
      
      // Check time of day
      if (searchCriteria.timeOfDay && block.time_of_day !== searchCriteria.timeOfDay) return false
      
      // Check interior/exterior
      if (searchCriteria.interiorExterior && block.interior_exterior !== searchCriteria.interiorExterior) return false
      
      // Check location
      if (searchCriteria.location && block.location !== searchCriteria.location) return false
      
      // Check if has photos
      if (searchCriteria.hasPhotos && (!block.photos || block.photos.length === 0)) return false
      
      // Check if has cast members
      if (searchCriteria.hasCast && (!block.block_cast || block.block_cast.length === 0)) return false
      
      // Check text search (in title, notes, scene number)
      if (searchCriteria.searchText) {
        const searchLower = searchCriteria.searchText.toLowerCase()
        const titleMatch = block.title?.toLowerCase().includes(searchLower) || false
        const notesMatch = block.notes?.toLowerCase().includes(searchLower) || false
        const sceneNumberMatch = block.scene_number?.toLowerCase().includes(searchLower) || false
        const locationMatch = block.location?.toLowerCase().includes(searchLower) || false
        
        if (!(titleMatch || notesMatch || sceneNumberMatch || locationMatch)) return false
      }
      
      return true
    })
    
    onFilteredBlocksChange(filteredBlocks)
  }, [searchCriteria, blocks, onFilteredBlocksChange])
  
  const handleCriteriaChange = (key: keyof SearchCriteria, value: any) => {
    setSearchCriteria(prev => ({
      ...prev,
      [key]: value
    }))
  }
  
  const resetFilters = () => {
    setSearchCriteria({})
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-card p-6 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Cerca Scene</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Text search */}
          <div>
            <label className="block text-sm font-medium mb-1">Testo di ricerca</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Cerca per titolo, note, numero scena..."
                className="w-full p-2 pr-8 border rounded-md"
                value={searchCriteria.searchText || ''}
                onChange={(e) => handleCriteriaChange('searchText', e.target.value || null)}
              />
              <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          
          {/* Status filters */}
          <div>
            <label className="block text-sm font-medium mb-1">Stato</label>
            <div className="flex gap-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!!searchCriteria.completed}
                  onChange={(e) => handleCriteriaChange('completed', e.target.checked || null)}
                  className="rounded"
                />
                <span>Completate</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!!searchCriteria.notCompleted}
                  onChange={(e) => handleCriteriaChange('notCompleted', e.target.checked || null)}
                  className="rounded"
                />
                <span>Da completare</span>
              </label>
            </div>
          </div>
          
          {/* Time of day filter */}
          <div>
            <label htmlFor="timeOfDay" className="block text-sm font-medium mb-1">Orario</label>
            <select
              id="timeOfDay"
              className="w-full p-2 border rounded-md"
              value={searchCriteria.timeOfDay || ''}
              onChange={(e) => handleCriteriaChange('timeOfDay', e.target.value || null)}
            >
              <option value="">Tutti</option>
              {availableTimeOfDay.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
          
          {/* Interior/Exterior filter */}
          <div>
            <label htmlFor="interiorExterior" className="block text-sm font-medium mb-1">Interno/Esterno</label>
            <select
              id="interiorExterior"
              className="w-full p-2 border rounded-md"
              value={searchCriteria.interiorExterior || ''}
              onChange={(e) => handleCriteriaChange('interiorExterior', e.target.value || null)}
            >
              <option value="">Tutti</option>
              {availableInteriorExterior.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          {/* Location filter */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium mb-1">Location</label>
            <select
              id="location"
              className="w-full p-2 border rounded-md"
              value={searchCriteria.location || ''}
              onChange={(e) => handleCriteriaChange('location', e.target.value || null)}
            >
              <option value="">Tutte</option>
              {availableLocations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
          
          {/* Has photos filter */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={!!searchCriteria.hasPhotos}
                onChange={(e) => handleCriteriaChange('hasPhotos', e.target.checked || null)}
                className="rounded"
              />
              <span>Con foto</span>
            </label>
          </div>
          
          {/* Has cast filter */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={!!searchCriteria.hasCast}
                onChange={(e) => handleCriteriaChange('hasCast', e.target.checked || null)}
                className="rounded"
              />
              <span>Con personaggi</span>
            </label>
          </div>
          
          <div className="flex justify-between pt-2">
            <Button
              variant="outline"
              onClick={resetFilters}
              className="text-sm"
            >
              Resetta filtri
            </Button>
            <Button
              onClick={onClose}
              className="text-sm"
            >
              Chiudi
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}