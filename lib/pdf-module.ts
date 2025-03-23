/**
 * Modulo dedicato per PDF.js con import statico
 * Questo approccio fa sì che il bundler includa PDF.js e il suo worker nel bundle principale
 * risolvendo i problemi di caricamento su dispositivi mobili
 */
import * as pdfjs from 'pdfjs-dist';

// Imposta manualmente il worker URL
if (typeof window !== 'undefined') {
  const pdfjsLib = pdfjs as any;
  if (pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('/pdf.worker.min.js', window.location.origin).href;
    console.log('PDF.js worker URL set to:', pdfjsLib.GlobalWorkerOptions.workerSrc);
  }
}

export default pdfjs;
