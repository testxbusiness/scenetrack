'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Pencil, Highlighter, Type, Undo, Save, X } from 'lucide-react'

interface PhotoEditorProps {
  imageUrl: string
  onSave: (editedImageUrl: string) => void
  onClose: () => void
}

interface TextBox {
  id: number
  text: string
  x: number
  y: number
  rotation: number // in gradi
}

export function PhotoEditor({ imageUrl, onSave, onClose }: PhotoEditorProps) {
  // Riferimenti per i due canvas
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const backgroundCtxRef = useRef<CanvasRenderingContext2D | null>(null)
  const overlayCtxRef = useRef<CanvasRenderingContext2D | null>(null)

  // Riferimento al container (relative) che contiene i canvas e le caselle di testo
  const containerRef = useRef<HTMLDivElement>(null)

  // Stato per gli strumenti, il disegno, la history e il caricamento
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState<'draw' | 'highlight' | 'text'>('draw')
  const [color, setColor] = useState('#000000')
  const [lineWidth, setLineWidth] = useState(2)
  const [history, setHistory] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Stato per le caselle di testo
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([])
  const nextTextBoxId = useRef(1)

  // Refs per gestire il dragging e la rotazione delle caselle di testo
  const draggingTextBoxRef = useRef<{
    id: number
    offsetX: number
    offsetY: number
  } | null>(null)
  const rotatingTextBoxRef = useRef<{
    id: number
    centerX: number
    centerY: number
    initialAngle: number
    initialRotation: number
  } | null>(null)

  // Inizializza i due canvas e carica l'immagine di base nel canvas di sfondo
  useEffect(() => {
    const bgCanvas = backgroundCanvasRef.current
    const ovCanvas = overlayCanvasRef.current
    if (!bgCanvas || !ovCanvas) return

    // Imposta le dimensioni fisse
    bgCanvas.width = 800
    bgCanvas.height = 600
    ovCanvas.width = 800
    ovCanvas.height = 600

    const bgCtx = bgCanvas.getContext('2d')
    const ovCtx = ovCanvas.getContext('2d')
    if (!bgCtx || !ovCtx) return

    backgroundCtxRef.current = bgCtx
    overlayCtxRef.current = ovCtx

    // Stili iniziali per il canvas di overlay
    ovCtx.strokeStyle = color
    ovCtx.lineWidth = lineWidth
    ovCtx.lineCap = 'round'
    ovCtx.lineJoin = 'round'

    // Carica l'immagine di base (con crossOrigin per evitare problemi)
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.src = imageUrl
    image.onload = () => {
      const scale = Math.min(bgCanvas.width / image.width, bgCanvas.height / image.height)
      const x = (bgCanvas.width - image.width * scale) / 2
      const y = (bgCanvas.height - image.height * scale) / 2

      bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height)
      bgCtx.drawImage(image, 0, 0, image.width, image.height, x, y, image.width * scale, image.height * scale)

      // Salva lo stato iniziale nella history
      saveState()
      setIsLoading(false)
    }
    image.onerror = () => {
      console.error('Error loading image')
      setIsLoading(false)
    }
  }, [imageUrl])

  // Aggiorna gli stili del canvas di overlay quando cambiano colore o spessore
  useEffect(() => {
    if (!overlayCtxRef.current) return
    overlayCtxRef.current.strokeStyle = color
    overlayCtxRef.current.lineWidth = lineWidth
    overlayCtxRef.current.lineCap = 'round'
    overlayCtxRef.current.lineJoin = 'round'
  }, [color, lineWidth])

  // Selezione dello strumento aggiorna colore e spessore
  useEffect(() => {
    switch (tool) {
      case 'draw':
        setColor('#000000')
        setLineWidth(2)
        break
      case 'highlight':
        setColor('rgba(255, 255, 0, 0.4)')
        setLineWidth(20)
        break
      case 'text':
        setColor('#000000')
        break
    }
  }, [tool])

  // Salva lo stato attuale del canvas di sfondo per l'undo
  const saveState = () => {
    const bgCanvas = backgroundCanvasRef.current
    if (!bgCanvas) return
    try {
      const dataUrl = bgCanvas.toDataURL('image/png')
      setHistory(prev => [...prev, dataUrl])
    } catch (error) {
      console.error('Error saving state:', error)
    }
  }

  // ------------------ Gestione del disegno (draw/highlight) sul canvas di overlay ------------------
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'text') return
    const ovCanvas = overlayCanvasRef.current
    if (!ovCanvas || !overlayCtxRef.current) return
    const rect = ovCanvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    overlayCtxRef.current.beginPath()
    overlayCtxRef.current.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || tool === 'text' || !overlayCtxRef.current) return
    const ovCanvas = overlayCanvasRef.current
    if (!ovCanvas) return
    const rect = ovCanvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    overlayCtxRef.current.lineTo(x, y)
    overlayCtxRef.current.stroke()
  }

  const stopDrawing = () => {
    if (!isDrawing || tool === 'text' || !overlayCtxRef.current || !backgroundCtxRef.current || !overlayCanvasRef.current) return
    overlayCtxRef.current.closePath()
    setIsDrawing(false)
    // Fondi il contenuto disegnato nell'overlay sullo sfondo
    backgroundCtxRef.current.drawImage(overlayCanvasRef.current, 0, 0)
    overlayCtxRef.current.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height)
    saveState()
  }

  // ------------------ Gestione delle caselle di testo ------------------
  // Crea una nuova casella di testo al doppio clic sul canvas di overlay (se lo strumento text è attivo)
  const handleOverlayDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool !== 'text') return
    const ovCanvas = overlayCanvasRef.current
    if (!ovCanvas) return

    const rect = ovCanvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newTextBox: TextBox = {
      id: nextTextBoxId.current++,
      text: 'Inserisci testo',
      x,
      y,
      rotation: 0
    }
    setTextBoxes(prev => [...prev, newTextBox])
  }

  // Avvia il drag di una casella di testo
  const handleTextBoxMouseDown = (e: React.MouseEvent, id: number) => {
    // Impedisce che il click attivi anche il doppio clic sul canvas
    e.stopPropagation()
    const target = e.currentTarget as HTMLElement
    const boxRect = target.getBoundingClientRect()
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return
    const offsetX = e.clientX - boxRect.left
    const offsetY = e.clientY - boxRect.top
    draggingTextBoxRef.current = { id, offsetX, offsetY }
  }

  // Avvia la rotazione (cliccando sull'handle di rotazione)
  const handleTextBoxRotateStart = (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    const target = (e.currentTarget as HTMLElement).parentElement
    if (!target || !containerRef.current) return
    const boxRect = target.getBoundingClientRect()
    const centerX = boxRect.left + boxRect.width / 2
    const centerY = boxRect.top + boxRect.height / 2
    const initialAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX)
    const currentBox = textBoxes.find(tb => tb.id === id)
    if (!currentBox) return
    rotatingTextBoxRef.current = {
      id,
      centerX,
      centerY,
      initialAngle,
      initialRotation: currentBox.rotation
    }
  }

  // Gestione globale del mousemove per drag e rotazione delle caselle di testo
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Drag della casella
      if (draggingTextBoxRef.current && containerRef.current) {
        const { id, offsetX, offsetY } = draggingTextBoxRef.current
        const containerRect = containerRef.current.getBoundingClientRect()
        const newX = e.clientX - containerRect.left - offsetX
        const newY = e.clientY - containerRect.top - offsetY
        setTextBoxes(prev =>
          prev.map(tb => (tb.id === id ? { ...tb, x: newX, y: newY } : tb))
        )
      }
      // Rotazione della casella
      if (rotatingTextBoxRef.current) {
        const { id, centerX, centerY, initialAngle, initialRotation } = rotatingTextBoxRef.current
        const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX)
        const angleDiff = currentAngle - initialAngle
        const newRotation = initialRotation + (angleDiff * 180) / Math.PI
        setTextBoxes(prev =>
          prev.map(tb => (tb.id === id ? { ...tb, rotation: newRotation } : tb))
        )
      }
    }

    const handleMouseUp = () => {
      draggingTextBoxRef.current = null
      rotatingTextBoxRef.current = null
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  // Aggiorna il testo della casella quando l'utente termina la modifica (blur)
  const updateTextBoxText = (id: number, newText: string) => {
    setTextBoxes(prev =>
      prev.map(tb => (tb.id === id ? { ...tb, text: newText } : tb))
    )
  }

  // ------------------ Undo ------------------
  const handleUndo = () => {
    if (history.length <= 1) return
    const newHistory = [...history]
    newHistory.pop() // Rimuove lo stato corrente
    const previousState = newHistory[newHistory.length - 1]

    const bgCanvas = backgroundCanvasRef.current
    const bgCtx = backgroundCtxRef.current
    if (!bgCanvas || !bgCtx) return

    const image = new Image()
    image.src = previousState
    image.onload = () => {
      bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height)
      bgCtx.drawImage(image, 0, 0, bgCanvas.width, bgCanvas.height)
      setHistory(newHistory)
    }
  }

  // ------------------ Salvataggio ------------------
  // Al salvataggio, fusi anche ogni casella di testo nel canvas di sfondo
  const handleSave = () => {
    const bgCanvas = backgroundCanvasRef.current
    const bgCtx = backgroundCtxRef.current
    if (!bgCanvas || !bgCtx) return

    // Per ogni casella di testo, disegna il contenuto sul canvas
    textBoxes.forEach(tb => {
      bgCtx.save()
      bgCtx.translate(tb.x, tb.y)
      bgCtx.rotate((tb.rotation * Math.PI) / 180)
      bgCtx.font = '20px Arial'
      bgCtx.fillStyle = '#000000'
      bgCtx.fillText(tb.text, 0, 20)
      bgCtx.restore()
    })

    // Pulisce le caselle di testo se non sono più necessarie
    setTextBoxes([])

    try {
      const dataUrl = bgCanvas.toDataURL('image/png')
      onSave(dataUrl)
    } catch (error) {
      console.error('Error saving image:', error)
      alert("Errore durante il salvataggio dell'immagine. Prova a ricaricare la pagina.")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[200]">
      <div className="bg-background rounded-lg p-6 w-full max-w-4xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant={tool === 'draw' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setTool('draw')}
              className="h-8 w-8"
              disabled={isLoading}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant={tool === 'highlight' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setTool('highlight')}
              className="h-8 w-8"
              disabled={isLoading}
            >
              <Highlighter className="h-4 w-4" />
            </Button>
            <Button
              variant={tool === 'text' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setTool('text')}
              className="h-8 w-8"
              disabled={isLoading}
            >
              <Type className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleUndo}
              disabled={history.length <= 1 || isLoading}
              className="h-8 w-8"
            >
              <Undo className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              size="icon"
              onClick={handleSave}
              className="h-8 w-8"
              disabled={isLoading}
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Container con posizione relativa: qui sono inclusi i due canvas e le caselle di testo */}
        <div
          ref={containerRef}
          className="relative bg-muted rounded-lg overflow-hidden"
          style={{ width: '800px', height: '600px' }}
        >
          <canvas ref={backgroundCanvasRef} className="absolute top-0 left-0" />
          <canvas
            ref={overlayCanvasRef}
            className="absolute top-0 left-0"
            onDoubleClick={tool === 'text' ? handleOverlayDoubleClick : undefined}
            onMouseDown={tool !== 'text' ? startDrawing : undefined}
            onMouseMove={tool !== 'text' ? draw : undefined}
            onMouseUp={tool !== 'text' ? stopDrawing : undefined}
            onMouseLeave={tool !== 'text' ? stopDrawing : undefined}
          />
          {/* Renderizzazione delle caselle di testo */}
          {textBoxes.map(tb => (
            <div
              key={tb.id}
              style={{
                position: 'absolute',
                left: tb.x,
                top: tb.y,
                transform: `rotate(${tb.rotation}deg)`,
                cursor: 'move',
                border: '1px dashed gray',
                padding: '4px',
                backgroundColor: 'rgba(255,255,255,0.8)',
                userSelect: 'none'
              }}
              onMouseDown={(e) => handleTextBoxMouseDown(e, tb.id)}
            >
              <div
                contentEditable
                suppressContentEditableWarning
                style={{ outline: 'none' }}
                onBlur={(e) => updateTextBoxText(tb.id, e.currentTarget.innerText)}
              >
                {tb.text}
              </div>
              {/* Handle per la rotazione */}
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: 'gray',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: -20,
                  right: -8,
                  cursor: 'grab'
                }}
                onMouseDown={(e) => handleTextBoxRotateStart(e, tb.id)}
              ></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
