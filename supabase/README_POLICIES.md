# Istruzioni per Applicare le Policy RLS di Supabase

Questo documento contiene le istruzioni per applicare le policy di Row Level Security (RLS) necessarie per il corretto funzionamento dell'applicazione SceneTrack.

## Problema Risolto

È stato identificato un problema con la creazione di nuovi progetti che generava l'errore "Errore durante la creazione del progetto: Errore sconosciuto". Questo errore era causato dalla mancanza di policy RLS per le tabelle `projects` e `sequences`.

## Soluzione

1. È stato creato un nuovo file SQL (`project_sequence_policies.sql`) che contiene le policy RLS necessarie per le tabelle `projects` e `sequences`.
2. È stato modificato il componente `ProjectWizard` per includere esplicitamente l'ID utente quando si crea un nuovo progetto.
3. È stata migliorata la gestione degli errori per fornire informazioni più dettagliate in caso di problemi.

## Come Applicare le Policy RLS

Per applicare le policy RLS al tuo database Supabase, segui questi passaggi:

### Opzione 1: Utilizzando l'Interfaccia Web di Supabase

1. Accedi al [Dashboard di Supabase](https://app.supabase.io)
2. Seleziona il tuo progetto
3. Vai alla sezione "SQL Editor"
4. Crea una nuova query
5. Copia e incolla il contenuto del file `project_sequence_policies.sql`
6. Esegui la query

### Opzione 2: Utilizzando la CLI di Supabase

Se hai configurato la CLI di Supabase, puoi eseguire il seguente comando:

```bash
supabase db push --db-url=<URL_DEL_TUO_DATABASE>
```

## Verifica

Dopo aver applicato le policy, verifica che tutto funzioni correttamente:

1. Prova a creare un nuovo progetto vuoto
2. Prova a creare un progetto con scene predefinite
3. Prova a caricare una sceneggiatura PDF

Se tutto funziona correttamente, non dovresti più vedere l'errore "Errore durante la creazione del progetto: Errore sconosciuto".

## Risoluzione dei Problemi

Se continui a riscontrare problemi dopo aver applicato le policy RLS, controlla i seguenti punti:

1. Assicurati che le variabili d'ambiente `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` siano impostate correttamente
2. Verifica che l'utente sia autenticato prima di tentare di creare un progetto
3. Controlla la console del browser per eventuali errori dettagliati
4. Verifica che le policy RLS siano state applicate correttamente eseguendo la seguente query:

```sql
SELECT * FROM pg_policies WHERE tablename IN ('projects', 'sequences');
```

Questa query dovrebbe restituire le policy che hai appena creato.
