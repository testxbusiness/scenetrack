'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import SuccessDialog from '@/components/projects/SuccessDialog'

export function ProjectWizard() {
  const [isOpen, setIsOpen] = useState(true)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [numScenes, setNumScenes] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'select' | 'empty' | 'scenes' | 'script'>('select')
  const [successInfo, setSuccessInfo] = useState<{ projectId: string; projectName: string; scenesCount: number } | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    setIsLoading(true)
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('Error getting user:', userError)
        throw new Error('Impossibile ottenere l\'utente corrente. Riprova più tardi.')
      }
      
      if (!user) {
        throw new Error('Utente non autenticato. Effettua il login e riprova.')
      }

      // Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert([
          {
            name,
            description: description || null,
            user_id: user.id,
          },
        ])
        .select()
        .single()

      if (projectError) {
        console.error('Project creation error:', projectError)
        throw projectError
      }

      // Create default sequence
      const { data: sequence, error: sequenceError } = await supabase
        .from('sequences')
        .insert([
          {
            name: 'Sequenza principale',
            description: 'Sequenza creata automaticamente',
            project_id: project.id,
          },
        ])
        .select()
        .single()

      if (sequenceError) throw sequenceError

      // If number of scenes specified, create them
      if (step === 'scenes' && numScenes) {
        const scenes = Array.from({ length: parseInt(numScenes) }).map((_, i) => ({
          sequence_id: sequence.id,
          order_number: i + 1,
        }))

        const { error: scenesError } = await supabase
          .from('blocks')
          .insert(scenes)

        if (scenesError) throw scenesError
        
        // Show success dialog for scenes creation
        setSuccessInfo({
          projectId: project.id,
          projectName: name,
          scenesCount: parseInt(numScenes)
        })
      }

      // If script uploaded, parse it and create scenes
      if (step === 'script' && selectedFile) {
        try {
          const { parseScriptPDF } = await import('@/lib/pdf-parser')
          const { scenes, allCastMembers } = await parseScriptPDF(selectedFile)
          
          if (scenes.length === 0) {
            throw new Error('Nessuna scena trovata nel PDF. Verifica che il formato della sceneggiatura sia corretto.')
          }

          // First, insert all cast members
          if (allCastMembers.length > 0) {
            const castMembersToInsert = allCastMembers.map(name => ({
              project_id: project.id,
              name,
              description: `Personaggio estratto dalla sceneggiatura`
            }));

            const { data: insertedCastMembers, error: castError } = await supabase
              .from('cast_members')
              .insert(castMembersToInsert)
              .select();

            if (castError) {
              console.error('Error inserting cast members:', castError);
              throw new Error(`Errore durante l'inserimento dei personaggi: ${castError.message}`);
            }
            
            // Now insert scenes
            const { data: insertedBlocks, error: scenesError } = await supabase
              .from('blocks')
              .insert(scenes.map((scene, i) => {
                // Remove cast from the scene object as it will be handled separately
                const { cast, ...sceneData } = scene;
                return {
                  sequence_id: sequence.id,
                  order_number: i + 1,
                  ...sceneData,
                };
              }))
              .select();

            if (scenesError) {
              console.error('Error inserting scenes:', scenesError);
              throw new Error(`Errore durante l'inserimento delle scene: ${scenesError.message}`);
            }

            // Now create the relationships between blocks and cast members
            if (insertedBlocks) {
              const blockCastRelations: { block_id: string; cast_member_id: string }[] = [];
              
              for (let i = 0; i < scenes.length; i++) {
                const scene = scenes[i];
                const block = insertedBlocks[i];
                
                if (scene.cast && scene.cast.length > 0 && block) {
                  // Find the cast members for this scene
                  const sceneCastMembers = insertedCastMembers?.filter(cm => 
                    scene.cast?.includes(cm.name)
                  ) || [];
                  
                  // Create block_cast relations
                  sceneCastMembers.forEach(castMember => {
                    blockCastRelations.push({
                      block_id: block.id,
                      cast_member_id: castMember.id
                    });
                  });
                }
              }
              
              if (blockCastRelations.length > 0) {
                const { error: relationError } = await supabase
                  .from('block_cast')
                  .insert(blockCastRelations);
                
                if (relationError) {
                  console.error('Error creating block-cast relationships:', relationError);
                  // Non-critical error, don't throw
                }
              }
            }
            
            // Show success dialog with scene count
            setSuccessInfo({
              projectId: project.id,
              projectName: name,
              scenesCount: scenes.length
            })
          } else {
            // If no cast members were found, just insert the scenes
            const { error: scenesError } = await supabase
              .from('blocks')
              .insert(scenes.map((scene, i) => {
                const { cast, ...sceneData } = scene;
                return {
                  sequence_id: sequence.id,
                  order_number: i + 1,
                  ...sceneData,
                };
              }));

            if (scenesError) {
              console.error('Error inserting scenes:', scenesError);
              throw new Error(`Errore durante l'inserimento delle scene: ${scenesError.message}`);
            }
            
            // Show success dialog with scene count
            setSuccessInfo({
              projectId: project.id,
              projectName: name,
              scenesCount: scenes.length
            })
          }
        } catch (pdfError) {
          console.error('PDF parsing error:', pdfError)
          // Clean up the project and sequence we already created
          await supabase.from('projects').delete().eq('id', project.id)
          throw pdfError
        }
      }

      // For empty project, just show success without scene count
      if (step === 'empty') {
        setSuccessInfo({
          projectId: project.id,
          projectName: name,
          scenesCount: 0
        })
      }

      router.refresh()
    } catch (error) {
      console.error('Error creating project:', error)
      
      // Detailed error logging
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        })
        
        alert(`Errore durante la creazione del progetto: ${error.message}`)
      } else {
        console.error('Unknown error type:', typeof error, error)
        alert('Errore durante la creazione del progetto: Errore sconosciuto')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuccessClose = () => {
    setSuccessInfo(null)
    setIsOpen(false)
    if (successInfo?.projectId) {
      router.push(`/projects/${successInfo.projectId}`)
    }
  }

  const resetForm = () => {
    setStep('select')
    setName('')
    setDescription('')
    setNumScenes('')
    setSelectedFile(null)
  }

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]"
          onClick={(e) => {
            if (e.target === e.currentTarget && !successInfo) {
              setIsOpen(false)
              resetForm()
            }
          }}
        >
          {successInfo ? (
            <SuccessDialog
              projectName={successInfo.projectName}
              scenesCount={successInfo.scenesCount}
              onClose={handleSuccessClose}
            />
          ) : (
            <div 
              className="bg-background rounded-lg p-6 w-full max-w-4xl"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-6">Crea Nuovo Progetto</h2>

              {step === 'select' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <button
                    onClick={() => setStep('empty')}
                    className="bg-card hover:bg-accent p-6 rounded-lg border-2 border-transparent hover:border-primary transition-colors text-left"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 mb-4 text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <line x1="12" y1="8" x2="12" y2="16"/>
                          <line x1="8" y1="12" x2="16" y2="12"/>
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Progetto Vuoto</h3>
                      <p className="text-sm text-muted-foreground">
                        Crea un nuovo progetto senza scene
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setStep('scenes')}
                    className="bg-card hover:bg-accent p-6 rounded-lg border-2 border-transparent hover:border-primary transition-colors text-left"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 mb-4 text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="2" width="6" height="6"/>
                          <rect x="9" y="2" width="6" height="6"/>
                          <rect x="16" y="2" width="6" height="6"/>
                          <rect x="2" y="9" width="6" height="6"/>
                          <rect x="9" y="9" width="6" height="6"/>
                          <rect x="16" y="9" width="6" height="6"/>
                          <rect x="2" y="16" width="6" height="6"/>
                          <rect x="9" y="16" width="6" height="6"/>
                          <rect x="16" y="16" width="6" height="6"/>
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Scene Predefinite</h3>
                      <p className="text-sm text-muted-foreground">
                        Crea un progetto con un numero di scene predefinito
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setStep('script')}
                    className="bg-card hover:bg-accent p-6 rounded-lg border-2 border-transparent hover:border-primary transition-colors text-left"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 mb-4 text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="8" y1="13" x2="16" y2="13"/>
                          <line x1="8" y1="17" x2="16" y2="17"/>
                          <line x1="10" y1="9" x2="14" y2="9"/>
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Carica Sceneggiatura</h3>
                      <p className="text-sm text-muted-foreground">
                        Crea un progetto importando una sceneggiatura PDF
                      </p>
                    </div>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Nome Progetto
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-2 rounded-md border bg-background"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Descrizione (opzionale)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-2 rounded-md border bg-background h-24"
                    />
                  </div>

                  {step === 'scenes' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Numero di Scene
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={numScenes}
                        onChange={(e) => setNumScenes(e.target.value)}
                        className="w-full p-2 rounded-md border bg-background"
                        required
                      />
                    </div>
                  )}

                  {step === 'script' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Sceneggiatura (PDF)
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="w-full p-2 rounded-md border bg-background"
                        required
                      />
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setStep('select')
                        resetForm()
                      }}
                    >
                      Indietro
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={isLoading}
                      >
                        Annulla
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Creazione...' : 'Crea Progetto'}
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}
