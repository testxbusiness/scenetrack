'use client'

import { useState, useEffect } from 'react'
import { Block, DragResult } from '@/types'
import { BlockActions } from './block-actions'
import { NewBlockDialog } from './new-block-dialog'
import { SceneDetailsDialog } from './scene-details-dialog'
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd'
import { createClientComponentClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface BlockListProps {
  blocks: Block[]
  sequenceId: string
}

// Global variable to track if any block dialog is open
let isAnyBlockDialogOpen = false;

export function BlockList({ blocks: initialBlocks, sequenceId }: BlockListProps) {
  const [blocks, setBlocks] = useState(initialBlocks)
  const [showNewBlockDialog, setShowNewBlockDialog] = useState(false)
  const [insertPosition, setInsertPosition] = useState(1)
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  // Reset the global dialog state when the component unmounts
  useEffect(() => {
    return () => {
      isAnyBlockDialogOpen = false;
    };
  }, []);

  const handleDragEnd = async (result: DragResult) => {
    if (!result.destination) return

    try {
      const items = Array.from(blocks)
      const [reorderedItem] = items.splice(result.source.index, 1)
      items.splice(result.destination.index, 0, reorderedItem)

      // Aggiorna l'ordine delle scene
      const updatedBlocks = items.map((block, index) => ({
        ...block,
        order_number: index + 1,
      }))

      // Aggiorna prima lo stato locale
      setBlocks(updatedBlocks)

      // Poi aggiorna il database
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

      // Aggiorna la pagina per riflettere i cambiamenti
      router.refresh()
    } catch (error) {
      console.error('Error reordering scenes:', error)
      alert('Errore durante il riordinamento delle scene. La pagina verrà ricaricata.')
      router.refresh()
    }
  }

  const handleAddBlock = (position: number) => {
    // Calcola la posizione effettiva per la nuova scena
    // Se clicchiamo a sinistra di una scena, usiamo il suo numero d'ordine
    // Se clicchiamo a destra dell'ultima scena o non ci sono scene, aggiungiamo alla fine
    const actualPosition = position === blocks.length ? 
      blocks.length + 1 : 
      blocks[position]?.order_number || 1

    setInsertPosition(actualPosition)
    setShowNewBlockDialog(true)
  }

  return (
    <div className="space-y-4 overflow-x-auto">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="blocks" direction="horizontal">
          {(provided: DroppableProvided) => (
            <div 
              {...provided.droppableProps} 
              ref={provided.innerRef}
              className="flex gap-4 min-w-full pb-4"
              style={{ 
                minWidth: blocks.length * 320 + (blocks.length - 1) * 16, // 320px per card + 16px gap
                width: 'max-content' 
              }}
            >
              {blocks.map((block, index) => (
                <div key={block.id} className="relative w-[300px]">
                  {/* Pulsante per aggiungere una scena a sinistra */}
                  <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 z-10">
                    <button
                      onClick={() => handleAddBlock(index)}
                      className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center hover:bg-primary/90 transition-colors"
                    >
                      +
                    </button>
                  </div>

                  <Draggable draggableId={block.id} index={index}>
                    {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`bg-card p-6 rounded-lg shadow-sm transition-all h-full cursor-pointer ${
                          snapshot.isDragging ? 'scale-105 shadow-lg' : ''
                        } hover:shadow-md hover:border-primary border-2`}
                        onClick={() => {
                          if (!isAnyBlockDialogOpen) {
                            setSelectedBlock(block);
                            isAnyBlockDialogOpen = true;
                          }
                        }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">
                            {block.scene_number ? `Scena ${block.scene_number}` : `Scena ${block.order_number}`}
                          </h3>
                          <BlockActions 
                            block={block} 
                            onDeleted={() => {
                              // Remove the block from the local state
                              setBlocks(blocks.filter(b => b.id !== block.id));
                            }}
                            isAnyDialogOpen={() => isAnyBlockDialogOpen}
                            setDialogOpen={(isOpen) => {
                              isAnyBlockDialogOpen = isOpen;
                            }}
                          />
                        </div>
                        <div className="mb-4">
                          {block.interior_exterior && block.location && (
                            <div className="text-sm text-muted-foreground mb-2">
                              <span className="font-medium">{block.interior_exterior}.</span> {block.location}
                              {block.time_of_day && <span> - {block.time_of_day}</span>}
                            </div>
                          )}
                          {block.title && (
                            <h4 className="font-medium mb-2">{block.title}</h4>
                          )}
                          {block.block_cast && block.block_cast.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs text-muted-foreground mb-1">Cast:</p>
                              <div className="flex flex-wrap gap-1">
                                {block.block_cast.map(relation => 
                                  relation.cast_member && (
                                    <span 
                                      key={relation.id} 
                                      className="px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded text-xs"
                                    >
                                      {relation.cast_member.name}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                          {block.notes && (
                            <p className="text-muted-foreground text-sm line-clamp-2">{block.notes}</p>
                          )}
                        </div>
                        {block.photos && block.photos.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mt-4">
                            {block.photos.slice(0, 3).map((photo) => (
                              <div key={photo.id} className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                                <Image
                                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/scene-photos/${photo.file_path}?v=${Date.now()}`}
                                  alt={photo.file_name}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 768px) 33vw, 100px"
                                />
                              </div>
                            ))}
                            {block.photos.length > 3 && (
                              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                +{block.photos.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>

                  {/* Pulsante per aggiungere una scena a destra (solo per l'ultima scena) */}
                  {index === blocks.length - 1 && (
                    <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 z-10">
                      <button
                        onClick={() => handleAddBlock(index + 1)}
                        className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center hover:bg-primary/90 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {provided.placeholder}

              {/* Pulsante per aggiungere una scena quando non ci sono scene */}
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

      {showNewBlockDialog && !isAnyBlockDialogOpen && (
        <NewBlockDialog
          sequenceId={sequenceId}
          insertPosition={insertPosition}
          onClose={() => {
            setShowNewBlockDialog(false)
            setInsertPosition(1)
            isAnyBlockDialogOpen = false;
            router.refresh()
          }}
          onCreated={(newBlock) => {
            setBlocks([...blocks, newBlock])
          }}
        />
      )}

      {selectedBlock && (
        <SceneDetailsDialog
          block={selectedBlock}
          onClose={() => {
            setSelectedBlock(null);
            isAnyBlockDialogOpen = false;
          }}
          onDeleted={() => {
            setBlocks(blocks.filter(b => b.id !== selectedBlock.id));
            setSelectedBlock(null);
            isAnyBlockDialogOpen = false;
          }}
          onUpdated={(updatedBlock) => {
            // Update the block in the local state
            const updatedBlocks = blocks.map(b => 
              b.id === updatedBlock.id ? { ...b, ...updatedBlock } : b
            );
            setBlocks(updatedBlocks);
          }}
        />
      )}
    </div>
  )
}
