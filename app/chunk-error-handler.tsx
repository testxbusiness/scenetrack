'use client'

import { useEffect } from 'react'

/**
 * Componente client per gestire gli errori di caricamento dei chunk
 * Questo componente aggiunge un event listener per intercettare gli errori di caricamento
 * dei chunk JavaScript e ricarica automaticamente la pagina per tentare di recuperare
 */
export default function ChunkErrorHandler() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Gestisci gli errori di caricamento dei chunk
      window.addEventListener('error', (event) => {
        // Verifica se l'errore è relativo al caricamento di un chunk
        const errorMessage = event.message || '';
        const errorStack = event.error?.stack || '';
        
        if (
          (errorMessage.includes('Loading chunk') && errorMessage.includes('failed')) ||
          (errorStack.includes('ChunkLoadError')) ||
          (errorMessage.includes('_next/static/chunks'))
        ) {
          console.error('Errore di caricamento chunk:', event);
          // Mostra un messaggio all'utente
          console.log('Tentativo di recupero dal fallimento di caricamento chunk...');
          
          // Ricarica la pagina dopo un breve ritardo
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      });
    }
  }, []);

  return null;
}
