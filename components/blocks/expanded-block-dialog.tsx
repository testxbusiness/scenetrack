'use client'

import { useState } from 'react'
import { Block, Photo } from '@/types'
import { Button } from '@/components/ui/button'
import { createClientComponentClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Trash2, X, Upload, Edit, Edit2 } from 'lucide-react'
import { PhotoViewer } from './photo-viewer'
import { PhotoEditor } from './photo-editor'

interface ExpandedBlockDialogProps {
  block: Block
  onClose: () => void
  onDeleted: () => void
  onUpdated: (updatedBlock: Block) => void
}

export function ExpandedBlockDialog({ block, onClose, onDeleted, onUpdated }: ExpandedBlockDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(block.title || '')
  const [notes, setNotes] = useState(block.notes || '')
  const [sceneNumber, setSceneNumber] = useState(block.scene_number || '')
  const [location, setLocation] = useState(block.location || '')
  const [interiorExterior, setInteriorExterior] = useState(block.interior_exterior || '')
  const [timeOfDay, setTimeOfDay] = useState(block.time_of_day || '')
  const [completed, setCompleted] = useState(block.completed || false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null)
  const [cacheKey, setCacheKey] = useState(Date.now())
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSave = async () => {
    try {
      const { data, error } = await supabase
        .from('blocks')
        .update({
          title,
          notes,
          scene_number: sceneNumber || null,
          location: location || null,
          interior_exterior: interiorExterior || null,
          time_of_day: timeOfDay || null,
          completed,
        })
        .eq('id', block.id)
        .select()
        .single()

      if (error) throw error
      if (data) {
        onUpdated(data)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error updating scene:', error)
      alert('Errore durante l\'aggiornamento della scena')
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = fileName

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('La dimensione del file non può superare 5MB')
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('Il file deve essere un\'immagine')
      }

      const { error: uploadError } = await supabase.storage
        .from('scene-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        })

      if (uploadError) throw uploadError

      const { error: dbError } = await supabase
        .from('photos')
        .insert([
          {
            block_id: block.id,
            file_path: filePath,
            file_name: file.name,
          },
        ])

      if (dbError) {
        await supabase.storage
          .from('scene-photos')
          .remove([filePath])
        throw dbError
      }

      // Refresh block data to get updated photos
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
        .single()

      if (data) {
        setCacheKey(Date.now())
        onUpdated(data)
      }
    } catch (error) {
      console.error('Error uploading photo:', error)
      let errorMessage = 'Errore durante il caricamento della foto.'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      alert(errorMessage + ' Per favore riprova.')
    } finally {
      setIsUploading(false)
    }
  }

  const handlePhotoDelete = async (photo: Photo) => {
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

      // Refresh block data to get updated photos
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
        .single()

      if (data) {
        setCacheKey(Date.now())
        onUpdated(data)
      }
    } catch (error) {
      console.error('Error deleting photo:', error)
      alert('Errore durante l\'eliminazione della foto')
    }
  }

  const handleSaveEdit = async (editedImageUrl: string) => {
    if (!editingPhoto) return

    try {
      // Convert data URL to blob
      const response = await fetch(editedImageUrl)
      const blob = await response.blob()

      // Delete the old file
      const { error: deleteError } = await supabase.storage
        .from('scene-photos')
        .remove([editingPhoto.file_path])

      if (deleteError) throw deleteError

      // Upload the new file with the same path
      const { error: uploadError } = await supabase.storage
        .from('scene-photos')
        .upload(editingPhoto.file_path, blob, {
          cacheControl: '3600',
          upsert: true,
          contentType: blob.type
        })

      if (uploadError) throw uploadError

      // Refresh block data to get updated photos
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
        .single()

      if (data) {
        setEditingPhoto(null)
        onUpdated(data)
      }
    } catch (error) {
      console.error('Error saving edited photo:', error)
      alert('Errore durante il salvataggio della foto modificata')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-background rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {block.scene_number ? `Scena ${block.scene_number}` : `Scena ${block.order_number}`}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Numero Scena
                </label>
                <input
                  type="text"
                  value={sceneNumber}
                  onChange={(e) => setSceneNumber(e.target.value)}
                  className="w-full p-2 rounded-md border bg-background"
                  placeholder="es. 1A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-2 rounded-md border bg-background"
                  placeholder="es. CASA DI MARIO"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Stato
                </label>
                <select
                  value={completed ? 'completed' : 'pending'}
                  onChange={(e) => setCompleted(e.target.value === 'completed')}
                  className="w-full p-2 rounded-md border bg-background"
                >
                  <option value="pending">Da completare</option>
                  <option value="completed">Completata</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Location
                </label>
                <select
                  value={interiorExterior}
                  onChange={(e) => setInteriorExterior(e.target.value)}
                  className="w-full p-2 rounded-md border bg-background"
                >
                  <option value="">Seleziona...</option>
                  <option value="INT">Interno</option>
                  <option value="EST">Esterno</option>
                  <option value="INT/EST">Interno/Esterno</option>
                  <option value="EST/INT">Esterno/Interno</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tempo
                </label>
                <select
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                  className="w-full p-2 rounded-md border bg-background"
                >
                  <option value="">Seleziona...</option>
                  <option value="GIORNO">Giorno</option>
                  <option value="NOTTE">Notte</option>
                  <option value="ALBA">Alba</option>
                  <option value="TRAMONTO">Tramonto</option>
                  <option value="CREPUSCOLO">Crepuscolo</option>
                  <option value="MATTINA">Mattina</option>
                  <option value="POMERIGGIO">Pomeriggio</option>
                  <option value="SERA">Sera</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Titolo
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 rounded-md border bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Note
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 rounded-md border bg-background h-24"
              />
            </div>
            <div className="flex justify-between">
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm('Sei sicuro di voler eliminare questa scena?')) {
                    onDeleted()
                    onClose()
                  }
                }}
              >
                Elimina Scena
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Annulla
                </Button>
                <Button onClick={handleSave}>
                  Salva
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {block.interior_exterior && block.location && block.time_of_day && (
              <div className="text-lg text-muted-foreground">
                {block.interior_exterior}. {block.location} - {block.time_of_day}
              </div>
            )}
            {block.title && (
              <div>
                <h3 className="font-medium mb-2">Titolo</h3>
                <p>{block.title}</p>
              </div>
            )}
            {block.notes && (
              <div>
                <h3 className="font-medium mb-2">Note</h3>
                <p className="whitespace-pre-wrap">{block.notes}</p>
              </div>
            )}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Foto</h3>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id={`photo-upload-${block.id}`}
                    disabled={isUploading}
                  />
                  <label
                    htmlFor={`photo-upload-${block.id}`}
                    className="cursor-pointer flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Upload className="h-4 w-4" />
                    {isUploading ? 'Caricamento...' : 'Carica Foto'}
                  </label>
                </div>
              </div>
              {block.photos && block.photos.length > 0 ? (
                <div className="grid grid-cols-4 gap-4">
                  {block.photos.map((photo) => (
                    <div key={photo.id} className="group relative aspect-square bg-muted rounded-lg overflow-hidden">
                      <div 
                        className="absolute inset-0 cursor-pointer"
                        onClick={() => setSelectedPhoto(photo)}
                      >
                        <Image
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/scene-photos/${photo.file_path}?v=${cacheKey}`}
                          alt={photo.file_name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 25vw, 200px"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute top-2 right-2 flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPhoto(photo);
                            }}
                            className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                          >
                            <Edit2 className="h-4 w-4 text-white" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePhotoDelete(photo);
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
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nessuna foto caricata
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedPhoto && (
        <PhotoViewer
          photo={{
            ...selectedPhoto,
            file_path: `${selectedPhoto.file_path}?v=${cacheKey}`
          }}
          onClose={() => setSelectedPhoto(null)}
        />
      )}

      {editingPhoto && (
        <PhotoEditor
          imageUrl={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/scene-photos/${editingPhoto.file_path}?v=${cacheKey}`}
          onSave={(editedImageUrl) => {
            handleSaveEdit(editedImageUrl);
            setCacheKey(Date.now());
          }}
          onClose={() => setEditingPhoto(null)}
        />
      )}
    </div>
  )
}
