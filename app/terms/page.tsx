import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termini di Servizio - SceneTrack',
  description: 'Termini di servizio di SceneTrack',
}

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold mb-2 text-center">TERMINI DI SERVIZIO</h1>
          
          <p className="text-center mb-8 text-muted-foreground">
            <strong>Ultimo aggiornamento:</strong> {currentDate}
          </p>
          
          <p className="mb-8">
            Benvenuto su <strong>SceneTrack</strong>. Ti invitiamo a leggere attentamente i presenti <strong>Termini di Servizio</strong> ("Termini"), che regolano l'uso della nostra piattaforma. Utilizzando la web app, accetti di rispettare questi Termini. Se non sei d'accordo, ti preghiamo di non utilizzare il servizio.
          </p>
          
          <hr className="my-8 border-t border-border" />
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">1. INFORMAZIONI GENERALI</h2>
            <p className="mb-4"><strong>Titolare del Servizio:</strong></p>
            <p className="mb-1"><strong>SceneTrack S.r.l.</strong></p>
            <p className="mb-1">📍 Indirizzo: Via Roma 123, 00100 Roma, Italia</p>
            <p className="mb-4">📧 Email di contatto: info@scenetrack.it</p>
            <p>Il Titolare si riserva il diritto di modificare i Termini in qualsiasi momento. Gli utenti saranno notificati di eventuali aggiornamenti.</p>
          </section>
          
          <hr className="my-8 border-t border-border" />
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">2. REQUISITI PER L'UTILIZZO DEL SERVIZIO</h2>
            <p className="mb-4">Per utilizzare <strong>SceneTrack</strong>, devi:</p>
            <ul className="list-none pl-6 mb-4 space-y-2">
              <li>✅ Avere almeno 18 anni o il consenso di un genitore/tutore legale.</li>
              <li>✅ Disporre di un account Google per l'autenticazione.</li>
              <li>✅ Accettare i presenti Termini e la nostra <strong>Privacy Policy</strong>.</li>
            </ul>
            <p>Ci riserviamo il diritto di sospendere o chiudere il tuo account se violi questi Termini.</p>
          </section>
          
          <hr className="my-8 border-t border-border" />
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">3. DESCRIZIONE DEL SERVIZIO</h2>
            <p className="mb-4">La nostra web app consente agli utenti di <strong>caricare e gestire sceneggiature cinematografiche</strong>. Il servizio è fornito "così com'è", senza garanzie di disponibilità continua o assenza di errori.</p>
            <p>Non siamo responsabili per eventuali interruzioni o malfunzionamenti dovuti a cause tecniche, manutenzioni o eventi di forza maggiore.</p>
          </section>
          
          <hr className="my-8 border-t border-border" />
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">4. REGISTRAZIONE E AUTENTICAZIONE</h2>
            <p className="mb-4">L'accesso alla web app avviene tramite autenticazione con <strong>account Google</strong>, gestita da <strong>Auth0 e Supabase</strong>.</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Sei responsabile della sicurezza del tuo account Google.</li>
              <li>Non condividere le tue credenziali con terzi.</li>
              <li>Il Titolare non sarà responsabile per eventuali accessi non autorizzati derivanti dalla mancata protezione del tuo account.</li>
            </ul>
          </section>
          
          <hr className="my-8 border-t border-border" />
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">5. CONTENUTI CARICATI DAGLI UTENTI</h2>
            <p className="mb-4">Gli utenti possono caricare <strong>sceneggiature o altri contenuti</strong> sulla piattaforma. Caricando contenuti, dichiari e garantisci che:</p>
            <ul className="list-none pl-6 mb-4 space-y-2">
              <li>✅ Sei il <strong>proprietario del contenuto</strong> o hai i <strong>diritti legali</strong> per condividerlo.</li>
              <li>✅ Il contenuto non viola <strong>copyright, marchi registrati o diritti di terzi</strong>.</li>
              <li>✅ Il contenuto non è <strong>illecito, offensivo, diffamatorio o discriminatorio</strong>.</li>
            </ul>
            <p><strong>Il Titolare non acquisisce alcun diritto di proprietà sui contenuti caricati dagli utenti.</strong> Tuttavia, ci riserviamo il diritto di rimuovere contenuti che violano questi Termini o disposizioni di legge.</p>
          </section>
          
          <hr className="my-8 border-t border-border" />
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">6. UTILIZZO CONSENTITO DEL SERVIZIO</h2>
            <p className="mb-4">Utilizzando la web app, accetti di:</p>
            <ul className="list-none pl-6 mb-4 space-y-2">
              <li>✅ Usare il servizio in modo lecito e rispettoso degli altri utenti.</li>
              <li>✅ Non cercare di compromettere la sicurezza della piattaforma.</li>
              <li>✅ Non caricare virus, malware o codice dannoso.</li>
            </ul>
            <p>In caso di violazione, potremmo sospendere o chiudere il tuo account senza preavviso.</p>
          </section>
          
          <hr className="my-8 border-t border-border" />
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">7. PROPRIETÀ INTELLETTUALE</h2>
            <p className="mb-4">Tutti i diritti relativi al <strong>software, al design e ai contenuti della web app</strong> appartengono al Titolare. È vietato copiare, modificare o distribuire parti del sito senza autorizzazione scritta.</p>
            <p>Gli utenti mantengono la proprietà delle <strong>sceneggiature e dei contenuti caricati</strong>, ma concedono al Titolare una licenza limitata per la gestione tecnica del servizio.</p>
          </section>
          
          <hr className="my-8 border-t border-border" />
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">8. LIMITAZIONE DI RESPONSABILITÀ</h2>
            <p className="mb-4">Il Titolare non sarà responsabile per:</p>
            <ul className="list-none pl-6 mb-4 space-y-2">
              <li>❌ Perdita di dati causata da errori tecnici o attacchi informatici.</li>
              <li>❌ Uso improprio del servizio da parte degli utenti.</li>
              <li>❌ Contenuti caricati dagli utenti che violano diritti di terzi.</li>
            </ul>
            <p>La web app è fornita "così com'è", senza garanzie esplicite o implicite di disponibilità, affidabilità o sicurezza assoluta.</p>
          </section>
          
          <hr className="my-8 border-t border-border" />
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">9. CANCELLAZIONE DELL'ACCOUNT E CHIUSURA DEL SERVIZIO</h2>
            <ul className="list-none pl-6 mb-4 space-y-2">
              <li>📌 Gli utenti possono eliminare il proprio account in qualsiasi momento contattandoci a <strong>info@scenetrack.it</strong>.</li>
              <li>📌 Il Titolare può sospendere o chiudere il servizio per motivi tecnici o legali, informando gli utenti con ragionevole preavviso.</li>
            </ul>
            <p>In caso di chiusura del servizio, gli utenti potranno scaricare i propri contenuti prima della disattivazione.</p>
          </section>
          
          <hr className="my-8 border-t border-border" />
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">10. PRIVACY E PROTEZIONE DEI DATI</h2>
            <p className="mb-4">L'uso del servizio è regolato dalla nostra <strong>Privacy Policy</strong>, che descrive come trattiamo i tuoi dati personali in conformità al <strong>GDPR</strong> e alla normativa italiana sulla privacy.</p>
            <p>Puoi consultare la Privacy Policy completa <Link href="/privacy" className="text-primary hover:text-primary/90 transition-colors">qui</Link>.</p>
          </section>
          
          <hr className="my-8 border-t border-border" />
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">11. RISOLUZIONE DELLE CONTROVERSIE</h2>
            <p className="mb-4">In caso di controversie tra te e il Titolare:</p>
            <ul className="list-none pl-6 mb-4 space-y-2">
              <li>1️⃣ Ti invitiamo a contattarci per cercare una soluzione amichevole.</li>
              <li>2️⃣ Se non troviamo un accordo, la controversia sarà sottoposta alla giurisdizione italiana.</li>
              <li>3️⃣ Il foro competente è quello della città in cui ha sede il Titolare.</li>
            </ul>
          </section>
          
          <hr className="my-8 border-t border-border" />
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">12. MODIFICHE AI TERMINI DI SERVIZIO</h2>
            <p className="mb-4">Potremmo aggiornare questi Termini per adeguarli a nuove funzionalità o normative. In caso di modifiche sostanziali, ti informeremo via email o con una notifica nella web app.</p>
            <p>Se continui a usare il servizio dopo l'aggiornamento dei Termini, accetti automaticamente le nuove condizioni.</p>
          </section>
          
          <hr className="my-8 border-t border-border" />
          
          <section>
            <h2 className="text-2xl font-bold mb-4">13. CONTATTI</h2>
            <p className="mb-4">Se hai domande sui presenti Termini, puoi contattarci:</p>
            <ul className="list-none pl-6 mb-4 space-y-2">
              <li>📧 <strong>Email:</strong> info@scenetrack.it</li>
              <li>📍 <strong>Indirizzo:</strong> Via Roma 123, 00100 Roma, Italia</li>
              <li>🌍 <strong>Sito Web:</strong> www.scenetrack.it</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}