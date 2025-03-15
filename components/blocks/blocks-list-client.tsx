'use client'

import { useState, useRef, useEffect } from 'react'
import { Block, DragResult } from '@/types'
import { BlockActions } from './block-actions'
import { NewBlockDialog } from './new-block-dialog'
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd'
import { createClientComponentClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
// Replace ExpandedBlockDialog import with SceneDetailsDialog
import { SceneDetailsDialog } from './scene-details-dialog'
import { ViewModeSelector, type ViewMode } from './view-mode-selector'
import { SearchDialog } from './search-dialog'
import { Search } from 'lucide-react'

interface BlocksListProps {
  initialBlocks: Block[]
  sequenceId: string
}

export function BlocksList({ initialBlocks, sequenceId }: BlocksListProps) {
  const [blocks, setBlocks] = useState(initialBlocks)
  const [showNewBlockDialog, setShowNewBlockDialog] = useState(false)
  const [insertPosition, setInsertPosition] = useState(1)
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('horizontal')
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [showSearchDialog, setShowSearchDialog] = useState(false)
  const [filteredBlocks, setFilteredBlocks] = useState<Block[]>(initialBlocks)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleDragEnd = async (result: DragResult) => {
    if (!result.destination) return

    try {
      const items = Array.from(blocks)
      const [reorderedItem] = items.splice(result.source.index, 1)
      items.splice(result.destination.index, 0, reorderedItem)

      // Update scene order
      const updatedBlocks = items.map((block, index) => ({
        ...block,
        order_number: index + 1,
      }))

      // Update local state first
      setBlocks(updatedBlocks)
      setFilteredBlocks(updatedBlocks)

      // Then update database
      const { error } = await supabase.rpc('reorder_blocks', {
        p_sequence_id: sequenceId,
        p_blocks: updatedBlocks.map(block => ({
          id: block.id,
          order_number: block.order_number,
        })),
      })

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Error reordering scenes:', error)
      alert('Errore durante il riordinamento delle scene. La pagina verrà ricaricata.')
      router.refresh()
    }
  }

  const handleAddBlock = (position: number) => {
    const actualPosition = position === blocks.length ? 
      blocks.length + 1 : 
      blocks[position]?.order_number || 1

    setInsertPosition(actualPosition)
    setShowNewBlockDialog(true)
  }

  const handleBlockCreated = (newBlock: Block) => {
    const updatedBlocks = [...blocks, newBlock].sort((a, b) => a.order_number - b.order_number)
    setBlocks(updatedBlocks)
    setFilteredBlocks(updatedBlocks)
    setShowNewBlockDialog(false)
    setInsertPosition(1)
  }

  const handleBlockDeleted = (deletedBlockId: string) => {
    const updatedBlocks = blocks.filter(block => block.id !== deletedBlockId)
    setBlocks(updatedBlocks)
    setFilteredBlocks(updatedBlocks)
  }

  const handleFilteredBlocksChange = (newFilteredBlocks: Block[]) => {
    setFilteredBlocks(newFilteredBlocks)
  }

  // Check scroll position and update scroll state
  const checkScrollPosition = () => {
    if (scrollContainerRef.current && viewMode === 'horizontal') {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      // Removed canScrollLeft check
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Add scroll event listener
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer && viewMode === 'horizontal') {
      scrollContainer.addEventListener('scroll', checkScrollPosition);
      // Initial check
      checkScrollPosition();
      // Set initial scroll state - removed canScrollLeft
      setCanScrollRight(filteredBlocks.length > 0);
      return () => scrollContainer.removeEventListener('scroll', checkScrollPosition);
    }
  }, [filteredBlocks, viewMode]);

  // Handle scroll buttons - removed handleScrollLeft
  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // We'll move the ref handling inside the Droppable render props function where 'provided' is available

  return (
    <div className="space-y-4 relative">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setShowSearchDialog(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
        >
          <Search size={16} />
          <span>Cerca Scene</span>
        </button>
        <ViewModeSelector currentMode={viewMode} onChange={setViewMode} />
      </div>

      {/* Scroll controls - only visible in horizontal mode */}
      {viewMode === 'horizontal' && (
        <div className="absolute top-1/2 -translate-y-1/2 w-full z-20 pointer-events-none flex justify-between px-2">
          {/* Left scroll button removed */}
        </div>
      )}
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="relative w-full overflow-x-auto">
        <Droppable droppableId="blocks" direction={viewMode === 'vertical' ? 'vertical' : 'horizontal'}>
          {(provided: DroppableProvided) => (
            <div 
              {...provided.droppableProps} 
              ref={(el) => {
                provided.innerRef(el);
                // Per evitare l'errore, forziamo il cast a MutableRefObject
                (scrollContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
              }}
              className={`
                ${viewMode === 'horizontal' ? 'flex gap-4 pb-4 overflow-x-auto overflow-y-hidden max-w-full' : ''}
                ${viewMode === 'vertical' ? 'flex flex-col gap-4' : ''}
                ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : ''}
              `}
              style={viewMode === 'horizontal' ? { 
                minWidth: filteredBlocks.length * 320 + (filteredBlocks.length - 1) * 16,
                width: 'max-content',
                scrollBehavior: 'smooth',
                height: 'auto',
                maxHeight: '100%'
              } : undefined}
            >
              {filteredBlocks.map((block, index) => (
                <Draggable key={block.id} draggableId={block.id} index={index}>
                  {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`
                        relative
                        ${viewMode === 'horizontal' ? 'w-[300px]' : 'w-full'}
                      `}
                    >
                      <div
                        className={`bg-card p-6 rounded-lg shadow-sm transition-all h-full cursor-pointer ${
                          snapshot.isDragging ? 'scale-105 shadow-lg' : ''
                        } hover:shadow-md hover:border-primary border-2 relative overflow-hidden`}
                        onClick={() => setSelectedBlock(block)}
                      >
                        {/* Background image with transparency */}
                        <div className="absolute inset-0 opacity-10 z-0">
                          <Image
                            src="/Movie track plan black and white.jpg"
                            alt="Background"
                            fill
                            className="object-cover"
                            priority={false}
                            quality={50}
                          />
                        </div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">
                              {block.scene_number ? `Scena ${block.scene_number}` : `Scena ${block.order_number}`}
                            </h3>
                            <BlockActions block={block} onDeleted={() => handleBlockDeleted(block.id)} />
                          </div>
                          <div className="mb-4">
                          {/* Status indicator */}
                          <div className="flex items-center mb-2">
                            <div className={`w-3 h-3 rounded-full ${block.completed ? 'bg-green-500' : 'bg-yellow-500'} mr-2`}></div>
                            <span className="text-xs text-muted-foreground">
                              {block.completed ? 'Completata' : 'Da completare'}
                            </span>
                          </div>
                          {block.interior_exterior && block.location && block.time_of_day && (
                            <div className="text-sm text-muted-foreground mb-2">
                              {block.interior_exterior}. {block.location} - {block.time_of_day}
                            </div>
                          )}
                          <h4 className="font-medium mb-2">{block.scene_name || block.title}</h4>
                          <p className="text-muted-foreground">{block.notes}</p>
                          </div>
                        </div>
                        {block.photos && block.photos.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2">Foto</h4>
                            <div className="grid grid-cols-3 gap-2">
                              {block.photos.map((photo) => (
                                <div key={photo.id} className="relative aspect-square">
                                  <Image
                                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/scene-photos/${photo.file_path}?v=${Date.now()}`}
                                    alt={photo.file_name}
                                    fill
                                    className="object-cover rounded"
                                    sizes="100px"
                                    priority
                                    loading="eager"
                                    quality={75}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Add scene button */}
                      <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 z-10">
                        <button
                          onClick={() => handleAddBlock(index + 1)}
                          className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center hover:bg-primary/90 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}

              {/* Add scene button when no scenes exist */}
              {filteredBlocks.length === 0 && blocks.length === 0 && (
                <div className="flex justify-center w-full mt-4">
                  <button
                    onClick={() => handleAddBlock(0)}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Aggiungi Scena
                  </button>
                </div>
              )}
              
              {/* Message when no scenes match the search criteria */}
              {filteredBlocks.length === 0 && blocks.length > 0 && (
                <div className="flex justify-center w-full mt-4 p-6 bg-muted rounded-lg">
                  <div className="text-center">
                    <p className="text-lg font-medium mb-2">Nessuna scena corrisponde ai criteri di ricerca</p>
                    <button
                      onClick={() => setFilteredBlocks(blocks)}
                      className="text-primary hover:underline"
                    >
                      Mostra tutte le scene
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Droppable>
        </div>
      </DragDropContext>

      {showNewBlockDialog && (
        <NewBlockDialog
          sequenceId={sequenceId}
          insertPosition={insertPosition}
          onClose={() => {
            setShowNewBlockDialog(false)
            setInsertPosition(1)
          }}
          onCreated={handleBlockCreated}
        />
      )}

      {selectedBlock && (
        <SceneDetailsDialog
          block={selectedBlock}
          onClose={() => setSelectedBlock(null)}
          onDeleted={() => {
            handleBlockDeleted(selectedBlock.id)
            setSelectedBlock(null)
          }}
          onUpdated={(updatedBlock) => {
            const updatedBlocks = blocks.map(b => 
              b.id === updatedBlock.id ? updatedBlock : b
            )
            setBlocks(updatedBlocks)
            setFilteredBlocks(updatedBlocks)
          }}
        />
      )}
      
      {showSearchDialog && (
        <SearchDialog
          blocks={blocks}
          onClose={() => setShowSearchDialog(false)}
          onFilteredBlocksChange={handleFilteredBlocksChange}
        />
      )}
    </div>
  )
}
