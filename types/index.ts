import { DropResult } from '@hello-pangea/dnd'

export interface Project {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Sequence {
  id: string
  project_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
  project?: Project
}

export interface CastMember {
  id: string
  project_id: string
  name: string
  description: string | null
  created_at: string
}

export interface BlockCast {
  id: string
  block_id: string
  cast_member_id: string
  created_at: string
  cast_member?: CastMember
}

export interface Block {
  id: string
  sequence_id: string
  order_number: number
  scene_number: string | null
  location: string | null
  interior_exterior: string | null
  time_of_day: string | null
  title: string | null
  notes: string | null
  history: string | null
  scene_date: string | null
  scene_time: string | null
  completed: boolean
  created_at: string
  updated_at: string
  photos?: Photo[]
  cast?: CastMember[]
  block_cast?: BlockCast[]
}

export interface Photo {
  id: string
  block_id: string
  file_path: string
  file_name: string
  comment: string | null
  created_at: string
}

// Riutilizza il tipo DropResult dalla libreria
export type DragResult = DropResult
