'use client'

import { useState, useEffect } from 'react'
import { Block, Photo, CastMember } from '@/types'
import { Button } from '@/components/ui/button'
import { createClientComponentClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Trash2, X, Upload, Edit, Edit2 } from 'lucide-react'
import { PhotoViewer } from './photo-viewer'
import { PhotoEditor } from './photo-editor'
import { EditBlockDialog } from './edit-block-dialog'

interface SceneDetailsDialogProps {
  block: Block
  onClose: () => void
  onDeleted: () => void
  onUpdated: (updatedBlock: Block) => void
}

// Global variable to track if the scene details dialog is open
let isSceneDetailsDialogOpen = false;

export function SceneDetailsDialog({ block, onClose, onDeleted, onUpdated }: SceneDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const dialogId = `scene-details-${block.id}`
  
  // Set the dialog as open when component mounts
  useEffect(() => {
    isSceneDetailsDialogOpen = true;
    return () => {
      isSceneDetailsDialogOpen = false;
    };
  }, []);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null)
  const [castMembers, setCastMembers] = useState<CastMember[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Fetch cast members for this block
  useEffect(() => {
    const fetchCastMembers = async () => {
      if (!block.id) return

      try {
        const { data, error } = await supabase
          .from('block_cast')
          .select(`
            cast_member:cast_members (
              id,
              name,
              description
            )
          `)
          .eq('block_id', block.id)

        if (error) throw error
        if (data) {
          const members = data
            .map(item => item.cast_member as unknown as CastMember)
            .filter(Boolean)
          setCastMembers(members)
        }
      } catch (error) {
        console.error('Error fetching cast members:', error)
      }
    }

    fetchCastMembers()
  }, [block.id, supabase])

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
        onUpdated(data)
      }
    } catch (error) {
      console.error('Error deleting photo:', error)
      alert('Errore durante l\'eliminazione della foto')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('it-IT');
    } catch (e) {
      return dateString;
    }
  };

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
              onClick={() => {
                // Close this dialog first before opening the edit dialog
                onClose();
                // Small delay to ensure the dialog is closed before opening the edit dialog
                setTimeout(() => {
                  setIsEditing(true);
                }, 100);
              }}
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

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {block.interior_exterior && block.location && (
                <div>
                  <h3 className="font-medium mb-1">Location</h3>
                  <p className="text-lg">{block.interior_exterior}. {block.location}</p>
                </div>
              )}
              
              {block.time_of_day && (
                <div>
                  <h3 className="font-medium mb-1">Tempo</h3>
                  <p>{block.time_of_day}</p>
                </div>
              )}
              
              {block.title && (
                <div>
                  <h3 className="font-medium mb-1">Titolo</h3>
                  <p>{block.title}</p>
                </div>
              )}
              
              {castMembers.length > 0 && (
                <div>
                  <h3 className="font-medium mb-1">Cast</h3>
                  <div className="flex flex-wrap gap-1">
                    {castMembers.map(member => (
                      <span 
                        key={member.id} 
                        className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                      >
                        {member.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {(block.scene_date || block.scene_time) && (
                <div>
                  <h3 className="font-medium mb-1">Data e Ora</h3>
                  <p>
                    {block.scene_date && formatDate(block.scene_date)}
                    {block.scene_date && block.scene_time && ' - '}
                    {block.scene_time}
                  </p>
                </div>
              )}
              
              {block.notes && (
                <div>
                  <h3 className="font-medium mb-1">Note</h3>
                  <p className="whitespace-pre-wrap">{block.notes}</p>
                </div>
              )}
              
              {block.history && (
                <div>
                  <h3 className="font-medium mb-1">Cronologia</h3>
                  <p className="whitespace-pre-wrap">{block.history}</p>
                </div>
              )}
            </div>
          </div>

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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {block.photos.map((photo) => (
                  <div key={photo.id} className="group relative aspect-square bg-muted rounded-lg overflow-hidden">
                    <div 
                      className="absolute inset-0 cursor-pointer"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <Image
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/scene-photos/${photo.file_path}?v=${new Date().getTime()}`}
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
      </div>

      {selectedPhoto && (
        <PhotoViewer
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}

      {editingPhoto && (
        <PhotoEditor
          imageUrl={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/scene-photos/${editingPhoto.file_path}?v=${new Date().getTime()}`}
          onSave={async (editedImageUrl) => {
            if (!editingPhoto) return;

            try {
              // Convert data URL to blob
              const base64Data = editedImageUrl.split(',')[1];
              const byteCharacters = atob(base64Data);
              const byteArrays = [];
              
              for (let offset = 0; offset < byteCharacters.length; offset += 512) {
                const slice = byteCharacters.slice(offset, offset + 512);
                const byteNumbers = new Array(slice.length);
                
                for (let i = 0; i < slice.length; i++) {
                  byteNumbers[i] = slice.charCodeAt(i);
                }
                
                const byteArray = new Uint8Array(byteNumbers);
                byteArrays.push(byteArray);
              }
              
              const blob = new Blob(byteArrays, { type: 'image/png' });

              // Generate a unique filename with timestamp
              const timestamp = Date.now();
              const random = Math.floor(Math.random() * 10000);
              const fileName = `edited_${timestamp}_${random}.png`;
              const filePath = fileName;

              const { error: uploadError } = await supabase.storage
                .from('scene-photos')
                .upload(filePath, blob);

              if (uploadError) throw uploadError;

              await supabase.storage
                .from('scene-photos')
                .remove([editingPhoto.file_path]);

              // Update photo record with new file path and timestamp
              const { error: dbError } = await supabase
                .from('photos')
                .update({
                  file_path: filePath,
                  updated_at: new Date().toISOString() // Add timestamp to force refresh
                })
                .eq('id', editingPhoto.id);

              if (dbError) throw dbError;

              // Refresh block data
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
                onUpdated(data);
              }
              
              setEditingPhoto(null);
            } catch (error) {
              console.error('Error saving edited photo:', error);
              alert('Errore durante il salvataggio della foto. Per favore riprova.');
            }
          }}
          onClose={() => setEditingPhoto(null)}
        />
      )}

      {isEditing && (
        <EditBlockDialog
          block={block}
          onClose={() => {
            setIsEditing(false);
            // Refresh block data
            supabase
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
              .then(({ data }) => {
                if (data) {
                  onUpdated(data);
                }
              });
          }}
          onDeleted={() => {
            setIsEditing(false);
            onDeleted();
          }}
        />
      )}
    </div>
  )
}
