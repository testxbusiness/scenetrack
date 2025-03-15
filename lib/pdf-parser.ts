import { type PDFDocumentProxy } from 'pdfjs-dist'

interface SceneInfo {
  scene_number?: string
  location?: string
  interior_exterior?: string
  time_of_day?: string
  cast?: string[]
  scene_name?: string; // Nuova proprietà per il nome completo della scena
}

export async function parseScriptPDF(file: File): Promise<{ scenes: SceneInfo[], allCastMembers: string[] }> {
  const scenes: SceneInfo[] = []
  const allCastMembers = new Set<string>()
  
  try {
    // Verify file type
    if (!file.type.includes('pdf')) {
      throw new Error('Il file deve essere in formato PDF')
    }

    if (file.size > 20 * 1024 * 1024) { // 20MB limit
      throw new Error('Il file è troppo grande. La dimensione massima è 20MB.')
    }

    console.log('Starting PDF parsing...', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    })

    // Convert File to ArrayBuffer
    let arrayBuffer: ArrayBuffer;
    try {
      arrayBuffer = await file.arrayBuffer()
    } catch (error) {
      console.error('Error reading file:', error)
      throw new Error('Impossibile leggere il file. Verifica che il file non sia danneggiato.')
    }

    // Dynamically import PDF.js
    let pdfjs;
    try {
      pdfjs = await import('pdfjs-dist')
    } catch (error) {
      console.error('Error importing PDF.js:', error)
      throw new Error('Impossibile caricare la libreria PDF.js. Ricarica la pagina e riprova.')
    }

    const { getDocument, GlobalWorkerOptions } = pdfjs
    
    // Initialize worker
    try {
      if (typeof window !== 'undefined') {
        GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
      }
    } catch (error) {
      console.error('Error setting worker source:', error)
      throw new Error('Errore di inizializzazione del worker PDF. Ricarica la pagina e riprova.')
    }

    // Load PDF document
    let pdf: PDFDocumentProxy;
    try {
      const loadingTask = getDocument(new Uint8Array(arrayBuffer))
      pdf = await loadingTask.promise
    } catch (error) {
      console.error('Error loading PDF:', error)
      throw new Error('Impossibile caricare il PDF. Verifica che il file sia un PDF valido e non sia protetto da password.')
    }

    console.log('PDF loaded successfully', {
      numPages: pdf.numPages
    })

    if (pdf.numPages === 0) {
      throw new Error('Il PDF non contiene pagine.')
    }
    
    // Regular expressions for scene detection
    // Define time indicators separately for better readability
    const timeIndicators = [
      'GIORNO', 'NOTTE', 'ALBA', 'TRAMONTO', 'CREPUSCOLO', 'MATTINA', 'POMERIGGIO', 'SERA',
      'NIGHT', 'DAY', 'DAWN', 'DUSK', 'MORNING', 'AFTERNOON', 'EVENING',
      'LATER', 'MOMENTS LATER', 'HOURS LATER', 'FLASHBACK'
    ].join('|')
    
    // Regular expression for character/dialogue detection
    // Looks for character names which are typically in all caps and may be followed by parenthetical
    const characterRegex = /^([A-Z][A-Z\s]+)(?:\s*\([^)]*\))?$/

    const sceneHeaderRegex = new RegExp(
      '^' +
      '(?:(?:SCENA\\s+\\d+\\s+)?[-\\s]*)?' + // Optional scene number prefix
      '(INT\\.?|EST\\.?|EXT\\.?|INT\\/EST|EST\\/INT|INT-EST|EST-INT|INT\\.?\\/EST\\.?|EST\\.?\\/INT\\.)' + // Interior/Exterior
      '(?:\\s+)' + // Required space
      '(.+?)' + // Location (non-greedy)
      `(?:\\s*[-–]\\s*(${timeIndicators})(?:\\s*\\([^)]*\\))?)?` + // Optional time of day with optional parenthetical
      '$', 
      'i'
    )

    // Helper function to process location parts
    const processLocation = (location: string): string => {
      // Remove any trailing separators or spaces
      location = location.replace(/\s*[-–]\s*$/, '')
      
      // Split by separators but preserve them in the output
      const parts = location.split(/\s*[-–\/]\s*/)
      
      // Filter out common time-related suffixes that might have been included
      const timeRelatedWords = ['LATER', 'MOMENTS LATER', 'HOURS LATER', 'MINUTES LATER']
      return parts
        .filter(part => !timeRelatedWords.some(word => part.toUpperCase().includes(word)))
        .join(' - ')
        .trim()
    }

    // Helper function to normalize time of day
    const normalizeTimeOfDay = (time?: string): string | undefined => {
      if (!time) return undefined

      // Remove any parenthetical notes
      time = time.replace(/\s*\([^)]*\)/, '').trim()

      const timeMap: { [key: string]: string | undefined } = {
        'NIGHT': 'NOTTE',
        'DAY': 'GIORNO',
        'DAWN': 'ALBA',
        'DUSK': 'TRAMONTO',
        'MORNING': 'MATTINA',
        'AFTERNOON': 'POMERIGGIO',
        'EVENING': 'SERA',
        'LATER': undefined,
        'MOMENTS LATER': undefined,
        'HOURS LATER': undefined,
        'FLASHBACK': undefined
      }

      const upperTime = time.toUpperCase()
      return timeMap[upperTime] || upperTime
    }
    const sceneNumberRegex = /^SCENA\s+(\d+)/i
    
      // Process each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        console.log(`Processing page ${pageNum}/${pdf.numPages}`)
        let page;
        let textContent;
        
        try {
          page = await pdf.getPage(pageNum)
          textContent = await page.getTextContent()
        } catch (error) {
          console.error(`Error extracting text from page ${pageNum}:`, error)
          continue // Skip this page and try the next one
        }
        
        // Group text items by their vertical position to form lines
        const lines: { [y: number]: string[] } = {}
        textContent.items.forEach((item: any) => {
          if (!item.str) return
          const y = Math.round(item.transform[5]) // Vertical position
          if (!lines[y]) {
            lines[y] = []
          }
          lines[y].push(item.str)
        })

        // Convert grouped items to lines of text
        const pageText = Object.entries(lines)
          .sort(([y1], [y2]) => Number(y2) - Number(y1)) // Sort by vertical position, top to bottom
          .map(([_, lineItems]) => lineItems.join(' ').trim())
          .filter(line => line.length > 0)
        
        console.log(`Page ${pageNum} text extracted, ${pageText.length} lines`)
        console.log('Sample lines:', pageText.slice(0, 3))
        
        let currentScene: SceneInfo | null = null;
        let currentSceneCast = new Set<string>();
        
        // Process each line
        for (let i = 0; i < pageText.length; i++) {
          const line = pageText[i].trim();
          
          // Check for scene headers
          const headerMatch = line.match(sceneHeaderRegex)
          if (headerMatch) {
            // If we were processing a scene, add its cast to the scene
            if (currentScene && currentSceneCast.size > 0) {
              currentScene.cast = Array.from(currentSceneCast);
              // Add cast members to the global set
              currentSceneCast.forEach(member => allCastMembers.add(member));
              currentSceneCast.clear();
            }
            
            // Crea l'oggetto scena usando le parti estratte
            currentScene = {
            interior_exterior: headerMatch[1].toUpperCase().replace(/\./g, '').replace(/-/g, '/'),
            location: processLocation(headerMatch[2]),
            time_of_day: normalizeTimeOfDay(headerMatch[3]),
            scene_name: line // Qui salvi l'intera riga come nome della scena
          };

            console.log('Found scene header:', line)
            currentScene = {
              interior_exterior: headerMatch[1].toUpperCase()
                .replace(/\./g, '') // Remove dots
                .replace(/-/g, '/'), // Standardize separator to /
              location: processLocation(headerMatch[2]),
              time_of_day: normalizeTimeOfDay(headerMatch[3])
            }

            console.log('Processed scene:', {
              original: line,
              processed: currentScene
            })
            
            // Look for scene number in current or previous lines
            const numberMatch = line.match(sceneNumberRegex)
            if (numberMatch) {
              currentScene.scene_number = numberMatch[1]
            } else {
              // Look in previous lines
              for (let j = i - 1; j >= 0 && j >= i - 3; j--) {
                const prevNumberMatch = pageText[j].match(sceneNumberRegex)
                if (prevNumberMatch) {
                  currentScene.scene_number = prevNumberMatch[1]
                  break
                }
              }
            }
            
            // If no scene number found, use array length + 1
            if (!currentScene.scene_number) {
              currentScene.scene_number = (scenes.length + 1).toString()
            }
            
            scenes.push(currentScene)
            console.log('Added scene:', currentScene)
          } 
          // Check for character names (typically in all caps)
          else if (currentScene) {
            const characterMatch = line.match(characterRegex);
            if (characterMatch) {
              const character = characterMatch[1].trim();
              // Exclude common non-character all-caps text
              const excludedTerms = ['INT', 'EST', 'EXT', 'FINE', 'SCENA', 'SCENE', 'CUT TO', 'FADE IN', 'FADE OUT'];
              if (!excludedTerms.some(term => character.includes(term))) {
                currentSceneCast.add(character);
                console.log('Found character in scene:', character);
              }
            }
          }
        }
        
        // Handle the last scene's cast
        if (currentScene && currentSceneCast.size > 0) {
          currentScene.cast = Array.from(currentSceneCast);
          // Add cast members to the global set
          currentSceneCast.forEach(member => allCastMembers.add(member));
        }
      }
    
    if (scenes.length === 0) {
      // Try a more lenient approach if no scenes were found
      console.log('No scenes found with standard regex, trying more lenient approach...')
      
      // Simplified regex that just looks for INT/EST patterns
      const simpleSceneHeaderRegex = /^(INT\.?|EST\.?|EXT\.?|INT\/?EST|EST\/?INT)[\s\.\-]+(.+?)$/i
      
      // Try again with the simpler regex
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum)
          const textContent = await page.getTextContent()
          
          // Group text items by their vertical position to form lines
          const lines: { [y: number]: string[] } = {}
          textContent.items.forEach((item: any) => {
            if (!item.str) return
            const y = Math.round(item.transform[5]) // Vertical position
            if (!lines[y]) {
              lines[y] = []
            }
            lines[y].push(item.str)
          })

          // Convert grouped items to lines of text
          const pageText = Object.entries(lines)
            .sort(([y1], [y2]) => Number(y2) - Number(y1)) // Sort by vertical position, top to bottom
            .map(([_, lineItems]) => lineItems.join(' ').trim())
            .filter(line => line.length > 0)
          
          // Process each line with the simpler regex
          for (let i = 0; i < pageText.length; i++) {
            const line = pageText[i].trim()
            const simpleMatch = line.match(simpleSceneHeaderRegex)
            
            if (simpleMatch) {
              console.log('Found scene with lenient regex:', line)
              const scene: SceneInfo = {
                interior_exterior: simpleMatch[1].toUpperCase().replace(/\./g, ''),
                location: simpleMatch[2].trim(),
                scene_number: (scenes.length + 1).toString()
              }
              scenes.push(scene)
            }
          }
        } catch (error) {
          console.error(`Error in lenient parsing for page ${pageNum}:`, error)
          continue
        }
      }
    }
    
    if (scenes.length === 0) {
      throw new Error('Nessuna scena trovata nel PDF. Assicurati che il formato della sceneggiatura sia corretto. ' +
        'Il PDF dovrebbe contenere scene nel formato "INT. LOCATION - GIORNO" o simili.')
    }
    
    console.log(`Successfully parsed ${scenes.length} scenes from PDF with ${allCastMembers.size} cast members`)
    return { 
      scenes, 
      allCastMembers: Array.from(allCastMembers) 
    }
  } catch (error) {
    console.error('PDF parsing error:', error)
    
    if (error instanceof Error) {
      // Don't wrap errors that we've already formatted
      if (error.message.includes('Nessuna scena trovata') || 
          error.message.includes('Impossibile') ||
          error.message.includes('Errore di inizializzazione')) {
        throw error
      }
      
      // Format other errors
      console.error('PDF parsing details:', {
        error,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        message: error.message
      })
      throw new Error(`Errore durante l'analisi del PDF: ${error.message}. Assicurati che il file sia un PDF valido e riprova.`)
    } else {
      throw new Error('Errore sconosciuto durante l\'analisi del PDF. Riprova con un altro file.')
    }
  }
}
