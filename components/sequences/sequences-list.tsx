'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sequence } from '@/types'
import { DeleteSequenceButton } from './delete-sequence-button'
import { formatDate } from '@/lib/utils'

interface SequencesListProps {
  initialSequences: Sequence[]
}

export function SequencesList({ initialSequences }: SequencesListProps) {
  const [sequences, setSequences] = useState(initialSequences)

  const handleSequenceDeleted = (deletedSequenceId: string) => {
    setSequences(sequences.filter(sequence => sequence.id !== deletedSequenceId))
  }

  if (!sequences.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          Non hai ancora creato nessuna sequenza
        </p>
        <p className="text-sm text-muted-foreground">
          Crea la tua prima sequenza per iniziare a organizzare il tuo lavoro
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {sequences.map((sequence) => (
        <div
          key={sequence.id}
          className="relative border rounded-lg p-4 hover:border-primary transition-colors group"
        >
          <Link href={`/sequences/${sequence.id}`} className="block">
            <h3 className="font-semibold mb-2">{sequence.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {sequence.description}
            </p>
            <div className="text-xs text-muted-foreground">
              Creata il {formatDate(sequence.created_at)}
            </div>
          </Link>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DeleteSequenceButton 
              sequence={sequence} 
              onDeleted={() => handleSequenceDeleted(sequence.id)}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
