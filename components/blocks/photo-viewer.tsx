'use client'

import { Photo } from '@/types'
import Image from 'next/image'
import { X } from 'lucide-react'

interface PhotoViewerProps {
  photo: Photo
  onClose: () => void
}

export function PhotoViewer({ photo, onClose }: PhotoViewerProps) {
  return (
    <div 
      className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[200]"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
      >
        <X className="h-6 w-6 text-white" />
      </button>

      <div 
        className="relative w-full h-full max-w-7xl max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <Image
          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/scene-photos/${photo.file_path}?v=${new Date().getTime()}`}
          alt={photo.file_name}
          fill
          className="object-contain"
          sizes="(max-width: 1280px) 100vw, 1280px"
          priority
          quality={100}
        />
      </div>
    </div>
  )
}
