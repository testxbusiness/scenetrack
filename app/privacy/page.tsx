import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - SceneTrack',
  description: 'Informativa sulla privacy di SceneTrack',
}

export default function PrivacyPage() {
  // Get current date in Italian format for the "Last updated" field
  const currentDate = new Date().toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <Link 
            href="/" 
            className="text-primary hover:text-primary/90 font-medium transition-colors"
          >
            ← Torna alla home
          </Link>
        </div>

        <div className="bg-card p-8 rounded-xl border shadow-sm">
          <h1 className="text-3xl font-bold mb-2 text-center">INFORMATIVA SULLA PRIVACY</h1>
          
          <p className="text-center mb-8 text-muted-foreground">
            <strong>Ultimo aggiornamento:</strong> {currentDate}
          </p>
          
          <p className="mb-8">
            Ai sensi degli articoli <strong>13 e 14 del Regolamento (UE) 2016/679 (GDPR)</strong> e della normativa italiana in materia di protezione dei dati personali
            (<strong>D.Lgs. 196/2003, così come modificato dal D.Lgs. 101/2018</strong>), desideriamo informarti su come trattiamo i tuoi dati personali quando utilizzi la nostra web app <strong>SceneTrack</strong>.
          </p>
          
          <hr className="my-8 border-t border-border" />
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">1. TITOLARE DEL TRATTAMENTO</h2>
            <p className="mb-4">Il Titolare del Trattamento è:</p>
            <p className="mb-1"><strong>SceneTrack S.r.l.</strong></p>
            <p className="mb-1">📍 Indirizzo: Via Roma 123, 00100 Roma, Italia</p>
            <p className="mb-4">📧 Email di contatto: privacy@scenetrack.it</p>
            <p>Se hai domande sul trattamento dei tuoi dati, puoi contattarci in qualsiasi momento.</p>
          </section>
          
          <hr className="my-8 border-t border-border" />
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">2. DATI PERSONALI RACCOLTI</h2>
            <p className="mb-4">Trattiamo esclusivamente i dati strettamente necessari al funzionamento della web app.</p>
            
            <h3 className="text-xl font-semibold mb-2">2.1 Dati forniti dall'utente</h3>
            <p className="mb-2">Durante la registrazione e l'utilizzo della web app, raccogliamo i seguenti dati personali:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li><strong>Nome e cognome</strong></li>
              <li><strong>Indirizzo email</strong></li>
              <li><strong>Immagine del profilo (se disponibile)</strong></li>
              <li><strong>ID utente univoco assegnato da Google</strong></li>
            </ul>
            <p className="mb-4">L'autenticazione avviene tramite il tuo <strong>account Google</strong>, gestita da <strong>Auth0 e Supabase</strong>. <strong>Non raccogliamo né conserviamo la tua password</strong>.</p>
            
            <h3 className="text-xl font-semibold mb-2">2.2 Dati relativi ai contenuti caricati</h3>
            <p className="mb-2">Gli utenti possono caricare contenuti originali sulla piattaforma, come <strong>sceneggiature cinematografiche</strong>, che potrebbero essere coperti da copyright.</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li><strong>I contenuti caricati restano di proprietà dell'utente.</strong></li>
              <li>La web app <strong>non detiene alcun diritto</strong> su tali contenuti, salvo che l'utente ne autorizzi esplicitamente la diffusione.</li>
            </ul>
            
            <h3 className="text-xl font-semibold mb-2">2.3 Dati raccolti automaticamente</h3>
            <p className="mb-2">Quando navighi sulla nostra web app, raccogliamo automaticamente alcune informazioni tecniche:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li><strong>Indirizzo IP</strong></li>
              <li><strong>Tipo di browser e dispositivo</strong></li>
              <li><strong>Data e ora dell'accesso</strong></li>
              <li><strong>Pagine visitate</strong></li>
              <li><strong>Cookies e strumenti di tracciamento</strong> (vedi <strong>Sezione 7</strong>)</li>
            </ul>
            <p>Questi dati vengono raccolti per <strong>finalità statistiche e di sicurezza</strong>, senza identificare direttamente l'utente.</p>
          </section>
          
          <hr className="my-8 border-t border-border" />
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">3. BASE GIURIDICA DEL TRATTAMENTO</h2>
            <p className="mb-4">Il trattamento dei tuoi dati avviene nel rispetto delle seguenti basi giuridiche previste dal GDPR:</p>
            <ul className="list-none pl-6 mb-4 space-y-2">
              <li>✅ <strong>Esecuzione di un contratto</strong> (art. 6.1.b GDPR): per consentire l'uso della web app e gestire l'autenticazione.</li>
              <li>✅ <strong>Obblighi di legge</strong> (art. 6.1.c GDPR): per adempiere a obblighi fiscali, contabili o legali.</li>
              <li>✅ <strong>Legittimo interesse</strong> (art. 6.1.f GDPR): per garantire la sicurezza della web app e prevenire attività illecite.</li>
              <li>✅ <strong>Consenso</strong> (art. 6.1.a GDPR): per eventuali trattamenti facoltativi, come l'invio di comunicazioni promozionali (se applicabile).</li>
            </ul>
          </section>
          
          <hr className="my-8 border-t border-border" />
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">4. FINALITÀ DEL TRATTAMENTO</h2>
            <p className="mb-4">I tuoi dati personali vengono trattati per le seguenti finalità:</p>
            <ul className="list-none pl-6 mb-4 space-y-2">
              <li>✔ Fornire l'accesso alla web app e gestire l'autenticazione degli utenti.</li>
              <li>✔ Memorizzare e consentire la gestione dei contenuti caricati.</li>
              <li>✔ Garantire la sicurezza del sistema e prevenire attività fraudolente.</li>
              <li>✔ Analizzare il traffico e migliorare le funzionalità della web app.</li>
              <li>✔ Adempiere a obblighi legali e rispondere a richieste delle autorità.</li>
            </ul>
            <p>I tuoi dati <strong>non verranno utilizzati per finalità di marketing</strong> senza il tuo esplicito consenso.</p>
          </section>
          
          <hr className="my-8 border-t border-border" />
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">5. CONSERVAZIONE DEI DATI</h2>
            <p className="mb-4">I dati personali vengono conservati per il tempo strettamente necessario alle finalità sopra indicate:</p>
            <ul className="list-none pl-6 mb-4 space-y-2">
              <li>📌 <strong>Dati dell'account</strong>: fino alla chiusura dell'account da parte dell'utente.</li>
              <li>📌 <strong>Dati tecnici (log di accesso e cookies)</strong>: massimo 12 mesi.</li>
              <li>📌 <strong>Contenuti caricati</strong>: fino alla cancellazione da parte dell'utente o per il tempo concordato.</li>
              <li>📌 <strong>Dati per obblighi legali</strong>: per il periodo previsto dalla normativa vigente.</li>
            </ul>
            <p>Al termine di tali periodi, i dati verranno <strong>eliminati o resi anonimi</strong>.</p>
          </section>
          
          <hr className="my-8 border-t border-border" />
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">6. CONDIVISIONE DEI DATI</h2>
            <p className="mb-4">Non vendiamo né condividiamo i tuoi dati con terze parti per scopi commerciali. Tuttavia, potremmo condividerli con:</p>
            <ul className="list-none pl-6 mb-4 space-y-2">
              <li>👥 <strong>Fornitori di servizi IT</strong> (es. Supabase per l'autenticazione e l'hosting dei dati).</li>
              <li>📜 <strong>Autorità competenti</strong>, se richiesto per obblighi di legge o per tutelare i nostri diritti.</li>
            </ul>
            <p>Tutti i fornitori di servizi sono <strong>vincolati da contratti di trattamento dati</strong> conformi al GDPR.</p>
          </section>
          
          <hr className="my-8 border-t border-border" />
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">7. COOKIES E STRUMENTI DI TRACCIAMENTO</h2>
            <p className="mb-4">La nostra web app utilizza cookies e strumenti simili per migliorare l'esperienza utente. Puoi gestire le tue preferenze direttamente dalle impostazioni del browser.</p>
            <p>Per maggiori dettagli, consulta la nostra <strong>Cookie Policy</strong>.</p>
          </section>
          
          <hr className="my-8 border-t border-border" />
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">8. DIRITTI DELL'UTENTE</h2>
            <p className="mb-4">Ai sensi del GDPR, hai il diritto di:</p>
            <ul className="list-none pl-6 mb-4 space-y-2">
              <li>🔹 <strong>Accedere</strong> ai tuoi dati personali.</li>
              <li>🔹 <strong>Richiedere la rettifica</strong> o l'aggiornamento dei dati.</li>
              <li>🔹 <strong>Chiedere la cancellazione</strong> ("diritto all'oblio").</li>
              <li>🔹 <strong>Limitare il trattamento</strong> dei dati.</li>
              <li>🔹 <strong>Portabilità dei dati</strong>, per ricevere i tuoi dati in formato leggibile.</li>
              <li>🔹 <strong>Opposizione al trattamento</strong>, per motivi legittimi.</li>
            </ul>
            <p className="mb-4">Puoi esercitare i tuoi diritti contattandoci a <strong>privacy@scenetrack.it</strong>.</p>
            <p>Se ritieni che il trattamento violi il GDPR, puoi presentare un reclamo al <strong>Garante per la protezione dei dati personali</strong> (<a href="https://www.garanteprivacy.it/" className="text-primary hover:text-primary/90 transition-colors">www.garanteprivacy.it</a>).</p>
          </section>
          
          <hr className="my-8 border-t border-border" />
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">9. PROTEZIONE DEL COPYRIGHT</h2>
            <p className="mb-4">Gli utenti sono responsabili dei contenuti caricati. Se carichi materiale coperto da <strong>copyright</strong>, confermi di avere i diritti per farlo.</p>
            <p>Se ritieni che un contenuto violi i tuoi diritti d'autore, puoi segnalarcelo a <strong>copyright@scenetrack.it</strong>.</p>
          </section>
          
          <hr className="my-8 border-t border-border" />
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">10. MODIFICHE ALLA PRIVACY POLICY</h2>
            <p className="mb-4">Questa informativa può essere aggiornata in base a nuove normative o modifiche alla web app. In caso di variazioni significative, ti informeremo via email o con una notifica sulla piattaforma.</p>
          </section>
          
          <hr className="my-8 border-t border-border" />
          
          <section>
            <h2 className="text-2xl font-bold mb-4">11. CONTATTI</h2>
            <p className="mb-4">Per qualsiasi domanda o chiarimento riguardo la presente Privacy Policy, puoi contattarci ai seguenti recapiti:</p>
            <ul className="list-none pl-6 mb-4 space-y-2">
              <li>📧 Email: <strong>privacy@scenetrack.it</strong></li>
              <li>📍 Indirizzo: <strong>Via Roma 123, 00100 Roma, Italia</strong></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}