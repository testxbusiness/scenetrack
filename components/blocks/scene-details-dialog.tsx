'use client'

import { useState, useEffect } from 'react'
import { Block, Photo, CastMember } from '@/types'
import { Button } from '@/components/ui/button'
import { createClientComponentClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Trash2, X, Upload, Edit, Edit2, MapPin, Clock, User, Package, ChevronLeft, Check } from 'lucide-react'
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
  const [cacheKey, setCacheKey] = useState(Date.now())
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    
    // If it starts with 'GIORNO', it's a custom day label, return as is
    if (dateString.startsWith('GIORNO')) {
      // Ensure proper formatting for GIORNO entries
      if (!dateString.startsWith('GIORNO ')) {
        return 'GIORNO ' + dateString.replace('GIORNO', '').trim();
      }
      return dateString;
    }
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateString; // Return original string if not a valid date
      }
      return date.toLocaleDateString('it-IT', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col z-[100] overflow-auto">
      {/* Header with back button and scene title */}
      <div className="flex items-center p-4 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="mr-2"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <div className="flex-1">
          <div className="text-base text-gray-600">Project</div>
          <h2 className="text-xl font-bold">
            {block.scene_number ? `Scene ${block.scene_number}: ${block.scene_number}: ${block.scene_name || block.title || ''}` : `Scene ${block.order_number}: ${block.scene_name || block.title || ''}`}
          </h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsEditing(true)}
          className="ml-2"
        >
          <Edit className="h-5 w-5" />
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Completed status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className={`w-6 h-6 rounded-full ${block.completed ? 'bg-green-100' : 'bg-yellow-100'} flex items-center justify-center mr-2`}>
              <Check className={`h-4 w-4 ${block.completed ? 'text-green-600' : 'text-yellow-600'}`} />
            </div>
            <span className={`text-base font-medium ${block.completed ? 'text-green-600' : 'text-yellow-600'}`}>
              {block.completed ? 'Completata' : 'Da completare'}
            </span>
          </div>
        </div>

        {/* Scene description */}
        {(block.notes || block.title) && (
          <div>
            <p className="text-base mb-4">
              {block.notes || block.title || ''}
            </p>
          </div>
        )}

        {/* Location and time */}
        <div className="space-y-3">
          {block.location && (
            <div className="flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-gray-500" />
              <div>
                <p className="text-gray-600">{block.location}</p>
                {block.interior_exterior && (
                  <p className="text-gray-500 text-sm">{block.interior_exterior}</p>
                )}
              </div>
            </div>
          )}

          {(block.scene_date || block.scene_time || block.time_of_day) && (
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-gray-500" />
              <div className="flex items-center flex-wrap">
                {block.scene_date && (
                  <span className="text-gray-600">{formatDate(block.scene_date)}</span>
                )}
                {block.scene_date && block.scene_time && (
                  <span className="mx-2 text-gray-400">•</span>
                )}
                {block.scene_time && (
                  <span className="text-gray-600">{block.scene_time}</span>
                )}
                {(block.scene_date || block.scene_time) && block.time_of_day && (
                  <span className="mx-2 text-gray-400">•</span>
                )}
                {block.time_of_day && (
                  <span className="text-gray-600">{block.time_of_day}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Characters section */}
        {castMembers.length > 0 && (
          <div>
            <div className="flex items-center mb-3">
              <User className="h-5 w-5 mr-2 text-gray-700" />
              <h3 className="text-lg font-medium">Characters</h3>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {castMembers.map(member => (
                <span key={member.id} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-full text-sm">
                  {member.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* History/Notes section */}
        {block.history && (
          <div>
            <h3 className="text-lg font-medium mb-2">Notes</h3>
            <p className="text-gray-700">{block.history}</p>
          </div>
        )}

        {/* Photos section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Photos</h3>
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
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium"
              >
                <Upload className="h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Add Photo'}
              </label>
            </div>
          </div>
          
          {block.photos && block.photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {block.photos.map((photo) => (
                <div key={photo.id} className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <div 
                    className="absolute inset-0 cursor-pointer"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <Image
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/scene-photos/${photo.file_path}?v=${cacheKey}`}
                      alt={photo.file_name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 200px"
                    />
                  </div>
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    {photo.comment && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
                        <p className="text-white text-sm truncate">{photo.comment}</p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-4">No photos yet</p>
              <label
                htmlFor={`photo-upload-${block.id}`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                Add First Photo
              </label>
            </div>
          )}
        </div>
      </div> {/* Closing tag for the main content div */}

      {/* Photo viewer modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          <PhotoViewer
            photo={selectedPhoto}
            onClose={() => setSelectedPhoto(null)}
          />
        </div>
      )}

      {/* Photo editor modal */}
      {editingPhoto && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4">
          <button
            onClick={() => setEditingPhoto(null)}
            className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          <PhotoEditor
            imageUrl={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/scene-photos/${editingPhoto.file_path}?v=${new Date().getTime()}`}
            onClose={() => setEditingPhoto(null)}
            onSave={async (editedImageUrl) => {
              try {
                const response = await fetch(editedImageUrl);
                const blob = await response.blob();

                const fileExt = editingPhoto.file_name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = fileName;

                const { error: uploadError } = await supabase.storage
                  .from('scene-photos')
                  .upload(filePath, blob);

                if (uploadError) throw uploadError;

                // Remove old photo
                await supabase.storage
                  .from('scene-photos')
                  .remove([editingPhoto.file_path]);

                // Update database record
                const { error: dbError } = await supabase
                  .from('photos')
                  .update({
                    file_path: filePath
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
                alert('Error saving edited photo. Please try again.');
              }
            }}
          />
        </div>
      )}

      {/* Edit dialog */}
      {isEditing && (
        <EditBlockDialog
          block={block}
          onClose={() => setIsEditing(false)}
          onDeleted={() => {
            onDeleted();
            setIsEditing(false);
          }}
          onUpdated={(updatedBlock) => {
            onUpdated(updatedBlock);
            setIsEditing(false);
          }}
        />
      )}
    </div>
  )
}
