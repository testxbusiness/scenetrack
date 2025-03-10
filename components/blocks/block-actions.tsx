'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Block } from '@/types'
import { createClientComponentClient } from '@/lib/supabase/client'
import { SceneDetailsDialog } from './scene-details-dialog'
import { UploadPhotoDialog } from './upload-photo-dialog'

// Keep track of open dialogs globally to prevent multiple dialogs
let activeDialog: string | null = null;

interface BlockActionsProps {
  block: Block
  onDeleted: () => void
  isAnyDialogOpen?: () => boolean
  setDialogOpen?: (isOpen: boolean) => void
}

export function BlockActions({ block, onDeleted, isAnyDialogOpen, setDialogOpen }: BlockActionsProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const dialogId = `block-${block.id}`;

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (activeDialog === dialogId) {
        activeDialog = null;
      }
    };
  }, [dialogId]);

  const openDetailsDialog = () => {
    // Check if any dialog is open using the parent's tracking
    if ((isAnyDialogOpen && isAnyDialogOpen()) || activeDialog) {
      return;
    }
    
    activeDialog = dialogId;
    setIsDetailsOpen(true);
    
    // Notify parent component that a dialog is open
    if (setDialogOpen) {
      setDialogOpen(true);
    }
  };

  const openUploadDialog = () => {
    // Check if any dialog is open using the parent's tracking
    if ((isAnyDialogOpen && isAnyDialogOpen()) || activeDialog) {
      return;
    }
    
    activeDialog = dialogId;
    setIsUploadOpen(true);
    
    // Notify parent component that a dialog is open
    if (setDialogOpen) {
      setDialogOpen(true);
    }
  };

  const closeDetailsDialog = () => {
    setIsDetailsOpen(false);
    activeDialog = null;
    
    // Notify parent component that dialog is closed
    if (setDialogOpen) {
      setDialogOpen(false);
    }
  };

  const closeUploadDialog = async () => {
    // Fetch updated block data with photos
    const { data } = await supabase
      .from('blocks')
      .select(`
        *,
        photos (
          id,
          file_path,
          file_name,
          comment
        )
      `)
      .eq('id', block.id)
      .single();

    if (data) {
      // Update the block in the local state
      const updatedBlock = data as Block;
      block.photos = updatedBlock.photos;
    }

    setIsUploadOpen(false);
    activeDialog = null;
    
    // Notify parent component that dialog is closed
    if (setDialogOpen) {
      setDialogOpen(false);
    }
    
    router.refresh();
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <button
          className="text-sm text-muted-foreground hover:text-foreground"
          onClick={openUploadDialog}
        >
          Carica Foto
        </button>
      </div>

      {isDetailsOpen && (
        <SceneDetailsDialog
          block={block}
          onClose={closeDetailsDialog}
          onDeleted={() => {
            onDeleted();
            activeDialog = null;
          }}
          onUpdated={(updatedBlock) => {
            // Update the block in the local state
            Object.assign(block, updatedBlock);
          }}
        />
      )}
      {isUploadOpen && (
        <UploadPhotoDialog
          blockId={block.id}
          onClose={closeUploadDialog}
        />
      )}
    </>
  )
}
