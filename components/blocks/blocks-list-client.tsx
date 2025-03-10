'use client'

import { useState } from 'react'
import { Block, DragResult } from '@/types'
import { BlockActions } from './block-actions'
import { NewBlockDialog } from './new-block-dialog'
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd'
import { createClientComponentClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ExpandedBlockDialog } from './expanded-block-dialog'
import { ViewModeSelector, type ViewMode } from './view-mode-selector'

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
    setBlocks([...blocks, newBlock].sort((a, b) => a.order_number - b.order_number))
    setShowNewBlockDialog(false)
    setInsertPosition(1)
  }

  const handleBlockDeleted = (deletedBlockId: string) => {
    setBlocks(blocks.filter(block => block.id !== deletedBlockId))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <ViewModeSelector currentMode={viewMode} onChange={setViewMode} />
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="blocks" direction={viewMode === 'vertical' ? 'vertical' : 'horizontal'}>
          {(provided: DroppableProvided) => (
            <div 
              {...provided.droppableProps} 
              ref={provided.innerRef}
              className={`
                ${viewMode === 'horizontal' ? 'flex gap-4 min-w-full pb-4 overflow-x-auto' : ''}
                ${viewMode === 'vertical' ? 'flex flex-col gap-4' : ''}
                ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : ''}
              `}
              style={viewMode === 'horizontal' ? { 
                minWidth: blocks.length * 320 + (blocks.length - 1) * 16,
                width: 'max-content' 
              } : undefined}
            >
              {blocks.map((block, index) => (
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
                        } hover:shadow-md hover:border-primary border-2`}
                        onClick={() => setSelectedBlock(block)}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">
                            {block.scene_number ? `Scena ${block.scene_number}` : `Scena ${block.order_number}`}
                          </h3>
                          <BlockActions block={block} onDeleted={() => handleBlockDeleted(block.id)} />
                        </div>
                        <div className="mb-4">
                          {block.interior_exterior && block.location && block.time_of_day && (
                            <div className="text-sm text-muted-foreground mb-2">
                              {block.interior_exterior}. {block.location} - {block.time_of_day}
                            </div>
                          )}
                          <h4 className="font-medium mb-2">{block.title}</h4>
                          <p className="text-muted-foreground">{block.notes}</p>
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
              {blocks.length === 0 && (
                <div className="flex justify-center w-full mt-4">
                  <button
                    onClick={() => handleAddBlock(0)}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Aggiungi Scena
                  </button>
                </div>
              )}
            </div>
          )}
        </Droppable>
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
        <ExpandedBlockDialog
          block={selectedBlock}
          onClose={() => setSelectedBlock(null)}
          onDeleted={() => {
            handleBlockDeleted(selectedBlock.id)
            setSelectedBlock(null)
          }}
          onUpdated={(updatedBlock) => {
            setBlocks(blocks.map(b => 
              b.id === updatedBlock.id ? updatedBlock : b
            ))
          }}
        />
      )}
    </div>
  )
}
