# SceneTrack

![SceneTrack Logo](/public/scenetrack_logo.png)

SceneTrack è un'applicazione web progettata per i professionisti del cinema e della produzione video per organizzare, gestire e tenere traccia di tutti gli aspetti della produzione cinematografica.

## Caratteristiche Principali

- **Gestione Progetti**: Crea e gestisci progetti cinematografici con descrizioni dettagliate
- **Organizzazione Sequenze**: Suddividi i tuoi progetti in sequenze logiche
- **Tracciamento Scene**: Gestisci ogni scena con dettagli come:
  - Numero di scena
  - Localizzazione (interna/esterna)
  - Orario del giorno
  - Note e descrizioni
  - Data e ora della scena
- **Gestione Cast**: Associa membri del cast alle scene
- **Galleria Fotografica**: Carica e organizza foto per ogni scena
- **Dashboard Analitico**: Visualizza statistiche e grafici sulla progressione del progetto
- **Interfaccia Intuitiva**: Design moderno e reattivo con supporto per tema chiaro/scuro

## Tecnologie Utilizzate

- **Frontend**:
  - Next.js 14
  - React 18
  - Tailwind CSS
  - Radix UI Components
  - Chart.js e D3.js per visualizzazioni dati
  - Fabric.js per editing immagini
  - PDF.js per parsing documenti

- **Backend**:
  - Supabase per autenticazione e database
  - API Routes di Next.js

## Requisiti di Sistema

- Node.js 18.x o superiore
- NPM o Yarn
- Account Supabase (per database e autenticazione)

## Installazione

1. Clona il repository:
   ```bash
   git clone https://github.com/testxbusiness/scenetrack.git
   cd scenetrack
   ```

2. Installa le dipendenze:
   ```bash
   npm install
   # oppure
   yarn install
   ```

3. Configura le variabili d'ambiente:
   Crea un file `.env.local` nella root del progetto con le seguenti variabili:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Configura il database Supabase:
   Esegui gli script SQL nella cartella `/supabase` per configurare le tabelle e le policy di sicurezza.

5. Avvia il server di sviluppo:
   ```bash
   npm run dev
   # oppure
   yarn dev
   ```

6. Apri [http://localhost:3000](http://localhost:3000) nel tuo browser.

## Struttura del Database

L'applicazione utilizza le seguenti tabelle principali:

- **projects**: Progetti cinematografici
- **sequences**: Sequenze all'interno di un progetto
- **blocks**: Scene individuali all'interno di una sequenza
- **photos**: Immagini associate alle scene
- **cast_members**: Membri del cast del progetto
- **block_cast**: Associazione tra scene e membri del cast

## Licenza

© 2025 SceneTrack. Tutti i diritti riservati.
