/**
 * Modulo dedicato per PDF.js con import statico ottimizzato
 * Questo approccio fa sì che il bundler includa PDF.js e il suo worker nel bundle principale
 * risolvendo i problemi di caricamento su dispositivi mobili
 */
import * as pdfjs from 'pdfjs-dist';

// Imposta manualmente il worker URL con gestione errori migliorata
if (typeof window !== 'undefined') {
  try {
    const pdfjsLib = pdfjs as any;
    if (pdfjsLib.GlobalWorkerOptions) {
      // Verifica se il worker è già configurato
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        const workerUrl = new URL('/pdf.worker.min.js', window.location.origin).href;
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
        console.log('PDF.js worker URL set to:', workerUrl);
      } else {
        console.log('PDF.js worker already configured:', pdfjsLib.GlobalWorkerOptions.workerSrc);
      }
    }
  } catch (error) {
    console.error('Error configuring PDF.js worker:', error);
  }
}

export default pdfjs;
