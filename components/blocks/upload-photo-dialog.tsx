'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface UploadPhotoDialogProps {
  blockId: string
  onClose: () => void
}

export function UploadPhotoDialog({ blockId, onClose }: UploadPhotoDialogProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [comment, setComment] = useState('')
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return

    setIsUploading(true)
    try {
      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = fileName

      // Check file size
      if (selectedFile.size > 5 * 1024 * 1024) {
        throw new Error('La dimensione del file non può superare 5MB')
      }

      // Check file type
      if (!selectedFile.type.startsWith('image/')) {
        throw new Error('Il file deve essere un\'immagine')
      }

      console.log('Attempting to upload file:', {
        fileName,
        fileSize: selectedFile.size,
        fileType: selectedFile.type
      })

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('scene-photos')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: selectedFile.type
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        if (uploadError.message.includes('duplicate')) {
          throw new Error('Esiste già una foto con lo stesso nome')
        }
        if (uploadError.message.includes('security')) {
          throw new Error('Errore di permessi durante il caricamento')
        }
        throw new Error('Errore durante il caricamento della foto')
      }

      console.log('File uploaded successfully:', uploadData)

      // Create photo record
      const { data: photoData, error: dbError } = await supabase
        .from('photos')
        .insert([
          {
            block_id: blockId,
            file_path: filePath,
            file_name: selectedFile.name,
            comment: comment || null,
          },
        ])

      if (dbError) {
        console.error('Database insert error:', dbError)
        // If database insert fails, clean up the uploaded file
        await supabase.storage
          .from('scene-photos')
          .remove([filePath])
        throw new Error(`Errore di database: ${dbError.message}`)
      }

      console.log('Photo record created:', photoData)

      // Success - refresh and close
      await router.refresh()
      onClose()
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-background rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Carica Foto</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="photo" className="block text-sm font-medium mb-1">
              Foto
            </label>
            <input
              type="file"
              id="photo"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full p-2 rounded-md border bg-background"
              required
            />
          </div>
          <div>
            <label htmlFor="comment" className="block text-sm font-medium mb-1">
              Commento (opzionale)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-2 rounded-md border bg-background h-24"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={isUploading || !selectedFile}>
              {isUploading ? 'Caricamento...' : 'Carica'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
