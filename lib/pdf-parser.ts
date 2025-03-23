import { type PDFDocumentProxy } from 'pdfjs-dist'

interface SceneInfo {
  scene_number?: string
  location?: string
  interior_exterior?: string
  time_of_day?: string
  cast?: string[]
  scene_name?: string; // Salva l’intera riga come nome della scena
}

export async function parseScriptPDF(file: File): Promise<{ scenes: SceneInfo[], allCastMembers: string[] }> {
  const scenes: SceneInfo[] = [];
  const allCastMembers = new Set<string>();

  try {
    // Verifica il tipo di file
    if (!file.type.includes('pdf')) {
      throw new Error('Il file deve essere in formato PDF');
    }
    if (file.size > 20 * 1024 * 1024) {
      throw new Error('Il file è troppo grande. La dimensione massima è 20MB.');
    }
    console.log('Starting PDF parsing...', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    });

    // Conversione del file in ArrayBuffer
    let arrayBuffer: ArrayBuffer;
    try {
      arrayBuffer = await file.arrayBuffer();
    } catch (error) {
      console.error('Error reading file:', error);
      throw new Error('Impossibile leggere il file. Verifica che il file non sia danneggiato.');
    }

    // Import dinamico di PDF.js
    let pdfjs;
    try {
      pdfjs = await import('pdfjs-dist');
    } catch (error) {
      console.error('Error importing PDF.js:', error);
      throw new Error('Impossibile caricare la libreria PDF.js. Ricarica la pagina e riprova.');
    }

    const { getDocument, GlobalWorkerOptions } = pdfjs;

    // Inizializza il worker
    try {
      if (typeof window !== 'undefined') {
        // Usa un URL assoluto basato sull'origine corrente per garantire compatibilità mobile
        const workerUrl = new URL('/pdf.worker.min.js', window.location.origin).href;
        console.log('Setting PDF.js worker URL:', workerUrl);
        GlobalWorkerOptions.workerSrc = workerUrl;
      }
    } catch (error) {
      console.error('Error setting worker source:', error);
      throw new Error('Errore di inizializzazione del worker PDF. Ricarica la pagina e riprova.');
    }

    // Carica il PDF
    let pdf: PDFDocumentProxy;
    try {
      const loadingTask = getDocument(new Uint8Array(arrayBuffer));
      
      // Imposta un timeout per il caricamento
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timeout durante il caricamento del PDF. Questo potrebbe essere un problema di connessione o di memoria del dispositivo.'));
        }, 30000); // 30 secondi di timeout
      });
      
      // Usa Promise.race per gestire il timeout
      pdf = await Promise.race([
        loadingTask.promise,
        timeoutPromise
      ]);
    } catch (error: unknown) {
      console.error('Error loading PDF:', error);
      
      // Messaggi di errore più specifici per dispositivi mobili
      if (error instanceof Error) {
        if (error.message.includes('Timeout')) {
          throw error; // Usa il messaggio di timeout già definito
        } else if (error.message.includes('worker')) {
          throw new Error('Impossibile caricare il worker PDF.js. Prova a utilizzare un browser desktop o verifica la tua connessione internet.');
        } else if (error.name === 'RangeError' || error.message.includes('memory')) {
          throw new Error('Memoria insufficiente per elaborare il PDF. Prova con un file più piccolo o utilizza un dispositivo con più memoria.');
        }
      }
      
      // Fallback per errori generici
      throw new Error('Impossibile caricare il PDF. Verifica che il file sia un PDF valido e non sia protetto da password.');
    }
    console.log('PDF loaded successfully', { numPages: pdf.numPages });
    if (pdf.numPages === 0) {
      throw new Error('Il PDF non contiene pagine.');
    }

    // Regex per i nomi dei personaggi (tipicamente in maiuscolo)
    const characterRegex = /^([A-Z][A-Z\s]+)(?:\s*\([^)]*\))?$/;

    // Pattern aggiornato per estrarre il numero di scena (alphanumerico)
    // Accetta scene come "A8" o "B23" oppure con segmenti separati da punto, come "14.1A"
    // Dopo il numero, è richiesto un separatore: oppure un punto seguito da spazi oppure solo spazi.
    const sceneNumberRegex = /^(([A-Za-z]?\d+[A-Za-z]*)(?:\.([A-Za-z]?\d+[A-Za-z]*))*)(?:\.\s+|\s+)/;

    // Funzione per normalizzare il tempo
    const normalizeTimeOfDay = (time?: string): string | undefined => {
      if (!time) return undefined;
      time = time.replace(/\s*\([^)]*\)/, '').trim();
      const timeMap: { [key: string]: string | undefined } = {
        'NIGHT': 'NOTTE',
        'DAY': 'GIORNO',
        'DAWN': 'ALBA',
        'DUSK': 'TRAMONTO',
        'MORNING': 'MATTINA',
        'AFTERNOON': 'POMERIGGIO',
        'EVENING': 'SERA'
      };
      const upperTime = time.toUpperCase();
      return timeMap[upperTime] || upperTime;
    };

    // Funzione per processare la location
    const processLocation = (location: string): string => {
      location = location.replace(/\s*[-–]\s*$/, '');
      const parts = location.split(/\s*[-–\/]\s*/);
      const timeRelatedWords = ['LATER', 'MOMENTS LATER', 'HOURS LATER', 'MINUTES LATER'];
      return parts.filter(part => !timeRelatedWords.some(word => part.toUpperCase().includes(word)))
                  .join(' - ')
                  .trim();
    };

    // Funzione principale per il parsing dell’header della scena (caso standard)
    const parseSceneHeader = (line: string): SceneInfo | null => {
      let scene_number: string | undefined;
      const numberMatch = line.match(sceneNumberRegex);
      if (numberMatch) {
        scene_number = numberMatch[1]; // es. "A8", "B23", "14.1A", "14BIS", ecc.
        line = line.replace(sceneNumberRegex, '');
      }
      const timeIndicators = [
        'GIORNO', 'NOTTE', 'ALBA', 'TRAMONTO', 'CREPUSCOLO',
        'MATTINA', 'POMERIGGIO', 'SERA', 'DAY', 'NIGHT'
      ].join('|');

      const sceneHeaderRegex = new RegExp(
        '^' +
        '((?:INT|EXT)(?:[\\.\\/-](?:INT|EXT))?\\.?)(?=\\s+)' + // Marker INT/EXT
        '\\s+' +
        '(.+?)' + // Location
        '(?:\\s*[-–]\\s*' +
          '((?:' + timeIndicators + ')(?:\\/(?:' + timeIndicators + '))?)' + // Tempo opzionale
        ')?' +
        '(?:\\s*\\([^)]*\\))*' + // eventuali note
        '$', 'i'
      );

      const headerMatch = line.match(sceneHeaderRegex);
      if (!headerMatch) return null;
      let interior_exterior = headerMatch[1].toUpperCase().replace(/[\.\/-]/g, '/');
      let location = processLocation(headerMatch[2]);
      let time_of_day = headerMatch[3] ? normalizeTimeOfDay(headerMatch[3]) : undefined;

      return {
        scene_number,
        interior_exterior,
        location,
        time_of_day,
        scene_name: line
      };
    };

    // Nuovo fallback per righe che iniziano con numerazione ma in cui il marker INT/EXT compare in una posizione intermedia
    const parseSceneHeaderWithMarkerInMiddle = (line: string): SceneInfo | null => {
      // Verifica la presenza della numerazione
      const numberMatch = line.match(sceneNumberRegex);
      if (!numberMatch) return null;
      const scene_number = numberMatch[1];
      const rest = line.replace(sceneNumberRegex, '').trim();
      // Cerca il marker INT. o EXT. all'interno della riga
      const markerMatch = rest.match(/(INT\.?|EXT\.?)/i);
      if (!markerMatch) return null;
      const markerIndex = markerMatch.index!;
      const prefix = rest.substring(0, markerIndex).trim(); // parte precedente al marker
      const headerPortion = rest.substring(markerIndex).trim(); // dal marker in poi

      // Riformatta: metti il marker all'inizio, inserisci il prefix come parte della location
      const newHeader = `${markerMatch[0]} ${prefix} - ${headerPortion.substring(markerMatch[0].length).trim()}`;
      console.log('Riformattazione header (marker in posizione intermedia):', newHeader);
      const parsed = parseSceneHeader(newHeader);
      if (parsed) {
        parsed.scene_number = scene_number;
        return parsed;
      }
      return null;
    };

    // Fallback per sceneggiature senza numerazione che iniziano direttamente con INT/EXT
    const parseSceneHeaderFallback = (line: string): SceneInfo | null => {
      const fallbackRegex = /^(INT\.?|EXT\.?|INT\/?EST|EST\/?INT)[\s\.\-]+(.+?)$/i;
      const match = line.match(fallbackRegex);
      if (match) {
        return {
          interior_exterior: match[1].toUpperCase().replace(/\./g, ''),
          location: processLocation(match[2]),
          time_of_day: undefined,
          scene_name: line
        };
      }
      return null;
    };

    let currentScene: SceneInfo | null = null;
    let currentSceneCast = new Set<string>();

    // Itera su ogni pagina del PDF
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`Processing page ${pageNum}/${pdf.numPages}`);
      let page, textContent;
      try {
        page = await pdf.getPage(pageNum);
        textContent = await page.getTextContent();
      } catch (error) {
        console.error(`Error extracting text from page ${pageNum}:`, error);
        continue;
      }

      // Raggruppa gli elementi in base alla posizione verticale
      const lines: { [y: number]: string[] } = {};
      textContent.items.forEach((item: any) => {
        if (!item.str) return;
        const y = Math.round(item.transform[5]);
        if (!lines[y]) lines[y] = [];
        lines[y].push(item.str);
      });

      const pageText = Object.entries(lines)
        .sort(([y1], [y2]) => Number(y2) - Number(y1))
        .map(([_, lineItems]) => lineItems.join(' ').trim())
        .filter(line => line.length > 0);

      console.log(`Page ${pageNum} text extracted, ${pageText.length} lines`);
      console.log('Sample lines:', pageText.slice(0, 3));

      for (let i = 0; i < pageText.length; i++) {
        const line = pageText[i].trim();
        let parsedScene = parseSceneHeader(line);
        // Se la scena non è stata trovata e la riga contiene numerazione, prova il fallback con marker in posizione intermedia
        if (!parsedScene && sceneNumberRegex.test(line)) {
          parsedScene = parseSceneHeaderWithMarkerInMiddle(line);
        }
        // Se ancora non viene trovata e la riga inizia con INT/EXT senza numerazione, usa il fallback base
        if (!parsedScene && /^(INT\.?|EXT\.?|INT\/?EST|EST\/?INT)/i.test(line)) {
          parsedScene = parseSceneHeaderFallback(line);
        }
        if (parsedScene) {
          if (currentScene && currentSceneCast.size > 0) {
            currentScene.cast = Array.from(currentSceneCast);
            currentSceneCast.forEach(member => allCastMembers.add(member));
            currentSceneCast.clear();
          }
          // Se il numero di scena non è stato assegnato, assegna un numero sequenziale
          if (!parsedScene.scene_number) {
            parsedScene.scene_number = (scenes.length + 1).toString();
          }
          currentScene = parsedScene;
          scenes.push(currentScene);
          console.log('Aggiunta scena:', currentScene);
        } else if (currentScene) {
          // Cerca nomi di personaggio
          const characterMatch = line.match(characterRegex);
          if (characterMatch) {
            const character = characterMatch[1].trim();
            const excludedTerms = ['INT', 'EST', 'EXT', 'FINE', 'SCENA', 'SCENE', 'CUT TO', 'FADE IN', 'FADE OUT'];
            if (!excludedTerms.some(term => character.includes(term))) {
              currentSceneCast.add(character);
              console.log('Trovato personaggio nella scena:', character);
            }
          }
        }
      }
      if (currentScene && currentSceneCast.size > 0) {
        currentScene.cast = Array.from(currentSceneCast);
        currentSceneCast.forEach(member => allCastMembers.add(member));
      }
    }

    // Fallback leniente se nessuna scena è stata trovata
    if (scenes.length === 0) {
      console.log('Nessuna scena trovata con le regex principali, uso approccio leniente...');
      const simpleSceneHeaderRegex = /^(INT\.?|EXT\.?|INT\/?EST|EST\/?INT)[\s\.\-]+(.+?)$/i;
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const lines: { [y: number]: string[] } = {};
          textContent.items.forEach((item: any) => {
            if (!item.str) return;
            const y = Math.round(item.transform[5]);
            if (!lines[y]) lines[y] = [];
            lines[y].push(item.str);
          });
          const pageText = Object.entries(lines)
            .sort(([y1], [y2]) => Number(y2) - Number(y1))
            .map(([_, lineItems]) => lineItems.join(' ').trim())
            .filter(line => line.length > 0);
          for (let i = 0; i < pageText.length; i++) {
            const line = pageText[i].trim();
            const simpleMatch = line.match(simpleSceneHeaderRegex);
            if (simpleMatch) {
              console.log('Scena trovata con approccio leniente:', line);
              const scene: SceneInfo = {
                interior_exterior: simpleMatch[1].toUpperCase().replace(/\./g, ''),
                location: processLocation(simpleMatch[2]),
                scene_number: (scenes.length + 1).toString(),
                scene_name: line
              };
              scenes.push(scene);
            }
          }
        } catch (error) {
          console.error(`Errore nel parsing leniente per la pagina ${pageNum}:`, error);
          continue;
        }
      }
    }

    if (scenes.length === 0) {
      throw new Error('Nessuna scena trovata nel PDF. Assicurati che il formato della sceneggiatura sia corretto.');
    }

    console.log(`Parsing completato: ${scenes.length} scene trovate con ${allCastMembers.size} membri del cast totali`);
    return { scenes, allCastMembers: Array.from(allCastMembers) };
  } catch (error) {
    console.error('PDF parsing error:', error);
    if (error instanceof Error) {
      if (error.message.includes('Nessuna scena trovata') ||
          error.message.includes('Impossibile') ||
          error.message.includes('Errore di inizializzazione')) {
        throw error;
      }
      console.error('Dettagli dell’errore:', {
        error,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        message: error.message
      });
      throw new Error(`Errore durante l'analisi del PDF: ${error.message}. Assicurati che il file sia un PDF valido e riprova.`);
    } else {
      throw new Error('Errore sconosciuto durante l\'analisi del PDF. Riprova con un altro file.');
    }
  }
}
