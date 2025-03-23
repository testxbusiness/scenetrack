/**
 * Modulo dedicato per PDF.js con import statico
 * Questo approccio fa sì che il bundler includa PDF.js e il suo worker nel bundle principale
 * risolvendo i problemi di caricamento su dispositivi mobili
 */
import * as pdfjs from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.entry';

export default pdfjs;
