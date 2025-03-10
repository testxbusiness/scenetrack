'use client'

import { useState } from 'react'
import { Photo } from '@/types'
import Image from 'next/image'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Trash2, Plus, Edit2 } from 'lucide-react'
import { PhotoViewer } from './photo-viewer'
import { PhotoEditor } from './photo-editor'

interface PhotoGridProps {
  photos: Photo[]
  blockId: string
  onPhotosUpdated: () => void
}

export function PhotoGrid({ photos, blockId, onPhotosUpdated }: PhotoGridProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null)
  const supabase = createClientComponentClient()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `photos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('scene-photos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { error: dbError } = await supabase
        .from('photos')
        .insert([
          {
            block_id: blockId,
            file_path: filePath,
            file_name: file.name,
          },
        ])

      if (dbError) throw dbError

      onPhotosUpdated()
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Errore durante il caricamento della foto. Per favore riprova.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (photo: Photo) => {
    if (!confirm('Sei sicuro di voler eliminare questa foto?')) return

    try {
      const { error: storageError } = await supabase.storage
        .from('scene-photos')
        .remove([photo.file_path])

      if (storageError) throw storageError

      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photo.id)

      if (dbError) throw dbError

      onPhotosUpdated()
    } catch (error) {
      console.error('Error deleting photo:', error)
      alert('Errore durante l\'eliminazione della foto. Per favore riprova.')
    }
  }

  const handleSaveEdit = async (editedImageUrl: string) => {
    if (!editingPhoto) return

    try {
      const response = await fetch(editedImageUrl)
      const blob = await response.blob()

      const fileExt = editingPhoto.file_name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `photos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('scene-photos')
        .upload(filePath, blob)

      if (uploadError) throw uploadError

      await supabase.storage
        .from('scene-photos')
        .remove([editingPhoto.file_path])

      const { error: dbError } = await supabase
        .from('photos')
        .update({
          file_path: filePath
        })
        .eq('id', editingPhoto.id)

      if (dbError) throw dbError

      onPhotosUpdated()
      setEditingPhoto(null)
    } catch (error) {
      console.error('Error saving edited photo:', error)
      alert('Errore durante il salvataggio della foto. Per favore riprova.')
    }
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium">Foto</h4>
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id={`photo-upload-${blockId}`}
            disabled={isUploading}
          />
          <label
            htmlFor={`photo-upload-${blockId}`}
            className="cursor-pointer inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            {isUploading ? 'Caricamento...' : 'Aggiungi'}
          </label>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo) => (
          <div key={photo.id} className="group relative aspect-square bg-muted rounded-lg overflow-hidden">
            <div 
              className="absolute inset-0 cursor-pointer"
              onClick={() => setSelectedPhoto(photo)}
            >
              <Image
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/scene-photos/${photo.file_path}?v=${Date.now()}`}
                alt={photo.file_name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 33vw, 300px"
                priority
                quality={75}
              />
            </div>

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingPhoto(photo)
                  }}
                  className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                >
                  <Edit2 className="h-4 w-4 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(photo)
                  }}
                  className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedPhoto && (
        <PhotoViewer
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}

      {editingPhoto && (
        <PhotoEditor
          imageUrl={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/scene-photos/${editingPhoto.file_path}`}
          onSave={handleSaveEdit}
          onClose={() => setEditingPhoto(null)}
        />
      )}
    </div>
  )
}
