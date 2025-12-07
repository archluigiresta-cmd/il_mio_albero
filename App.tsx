import React, { useState, useEffect } from 'react';
import { Person, User, Gender } from './types';
import { parseGedcom, mergePeople } from './services/gedcomService';
import { getStoredPeople, savePeople, getSession, loginUser, registerUser, logout, hardReset } from './services/storageService';
import { FamilyTree } from './components/FamilyTree';
import { PersonEditor } from './components/PersonEditor';
import { AdminPanel } from './components/AdminPanel';
import { DashboardSidebar } from './components/DashboardSidebar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Upload, TreeDeciduous, Shield, User as UserIcon, FilePlus, Save, RefreshCw, Download, Globe } from 'lucide-react';
import { APP_VERSION, APP_NAME } from './constants';

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [currentView, setCurrentView] = useState('tree'); // 'tree', 'admin_users', 'admin_settings', 'add_person'

  // Stati per Auth
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);

  // Inizializzazione
  useEffect(() => {
    const session = getSession();
    if (session) setUser(session);
    
    const stored = getStoredPeople();
    setPeople(stored);
    setLoading(false);
  }, []);

  // Salvataggio automatico
  useEffect(() => {
    if (!loading && people.length > 0) {
        savePeople(people);
    }
  }, [people, loading]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (user?.role !== 'admin') {
          alert("Solo l'amministratore può importare file GEDCOM massivi.");
          return;
      }

      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
          const content = evt.target?.result as string;
          if (content) {
              try {
                const parsed = parseGedcom(content);
                if (parsed.length > 0) {
                    
                    if (people.length === 0) {
                        // Se l'albero è vuoto, importa direttamente
                        setPeople(parsed);
                        alert(`Importate ${parsed.length} persone.`);
                    } else {
                        // Se ci sono già dati, chiedi cosa fare
                        if (confirm(`Il file contiene ${parsed.length} persone.\n\nVuoi SOVRASCRIVERE l'albero esistente (OK) o UNIRE i dati (Annulla)?\n\nOK = Cancella tutto e sostituisci\nAnnulla = Cerca di unire i dati nuovi a quelli vecchi`)) {
                            // Sovrascrivi
                            setPeople(parsed);
                        } else {
                            // Unisci (Merge)
                            if (confirm("Procedo con l'unione intelligente? I record con lo stesso nome e data di nascita verranno aggiornati, gli altri aggiunti.")) {
                                const { merged, stats } = mergePeople(people, parsed);
                                setPeople(merged);
                                alert(`Unione completata!\nNuove persone aggiunte: ${stats.added}\nPersone aggiornate: ${stats.updated}`);
                            }
                        }
                    }

                } else {
                    alert("Il file sembra vuoto o non valido.");
                }
              } catch (err) {
                  console.error(err);
                  alert("Errore durante la lettura del file GEDCOM.");
              }
          }
      };
      reader.readAsText(file);
      e.target.value = ''; // Reset input
  };

  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      const res = loginUser(email, password);
      if (res.success && res.user) {
          setUser(res.user);
      } else {
          alert(res.message);
      }
  };

  const handleRegister = (e: React.FormEvent) => {
      e.preventDefault();
      const res = registerUser(email, password, fullName);
      alert(res.message);
      if (res.success) {
          setAuthMode('login');
          setPassword('');
      }
  };

  const handleCreateNew = () => {
      const newP: Person = {
          id: `@I${Date.now()}@`,
          firstName: '',
          lastName: '',
          gender: Gender.Unknown,
          isLiving: true,
          spouseIds: [],
          childrenIds: []
      };
      // Apriamo direttamente l'editor in modalità "nuovo"
      // Non lo aggiungiamo all'array people finché non viene salvato
      setSelectedPerson(newP);
  };

  const handleSavePerson = (p: Person) => {
      // Verifica se esiste
      const exists = people.find(x => x.id === p.id);
      if (exists) {
          setPeople(prev => prev.map(x => x.id === p.id ? p : x));
      } else {
          // Nuova persona
          // Rinomina "Nuova Persona" se l'utente non l'ha fatto
          const finalP = {
               ...p,
               firstName: p.firstName || 'Sconosciuto',
               lastName: p.lastName || ''
          };
          setPeople(prev => [...prev, finalP]);
      }
      setSelectedPerson(null);
      setCurrentView('tree'); // Torna all'albero dopo il salvataggio
  };

  const handleDelete = (id: string) => {
      setPeople(prev => prev.filter(x => x.id !== id));
      setSelectedPerson(null);
  };

  const handleAddRelative = (type: string, sourceId: string) => {
      alert("Per aggiungere un parente: \n1. Usa il menù 'Nuova Persona' per creare il parente.\n2. Poi collega i due usando i campi Relazione nella scheda.");
  };

  // Funzione per scaricare il JSON
  const handleExportForPublishing = () => {
      const jsonString = JSON.stringify(people, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_albero_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert("File scaricato!\n\nPer rendere queste modifiche visibili a tutti:\n1. Copia il contenuto del file scaricato.\n2. Invialo allo sviluppatore (o incollalo nella chat) chiedendo di aggiornare i 'Dati Iniziali'.");
  };

  // --- SCHERMATA DI LOGIN ---
  if (!user) {
      if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Inizializzazione sistema...</div>;

      return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 p-4 font-sans text-slate-100">
              <div className="bg-white text-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-sm border border-slate-700 relative overflow-hidden">
                  
                  {/* Badge Versione */}
                  <div className="absolute top-2 right-2 text-[10px] text-slate-400 font-mono">
                      v{APP_VERSION}
                  </div>

                  <div className="flex justify-center mb-6">
                      <div className="p-4 bg-emerald-600 rounded-xl shadow-lg transform -translate-y-12">
                        <TreeDeciduous size={48} className="text-white" />
                      </div>
                  </div>
                  <div className="-mt-8 text-center mb-8">
                      <h1 className="text-2xl font-serif font-bold text-slate-900">
                          {APP_NAME}
                      </h1>
                      <p className="text-slate-500 text-sm mt-1">
                          Accesso Riservato
                      </p>
                  </div>
                  
                  <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="flex flex-col gap-4">
                      {authMode === 'register' && (
                          <div className="relative">
                            <UserIcon className="absolute left-3 top-3.5 text-slate-400" size={18} />
                            <input 
                                className="border border-slate-300 p-3 pl-10 rounded-lg bg-slate-50 w-full focus:ring-2 focus:ring-emerald-500 outline-none transition" 
                                placeholder="Nome e Cognome" 
                                value={fullName} 
                                onChange={e=>setFullName(e.target.value)} 
                                required 
                            />
                          </div>
                      )}
                      <input 
                        className="border border-slate-300 p-3 rounded-lg bg-slate-50 focus:ring-2 focus:ring-emerald-500 outline-none transition" 
                        placeholder="Email" 
                        type="email" 
                        value={email} 
                        onChange={e=>setEmail(e.target.value)} 
                        required 
                      />
                      <input 
                        className="border border-slate-300 p-3 rounded-lg bg-slate-50 focus:ring-2 focus:ring-emerald-500 outline-none transition" 
                        placeholder="Password" 
                        type="password" 
                        value={password} 
                        onChange={e=>setPassword(e.target.value)} 
                        required 
                      />
                      
                      <button className="bg-emerald-700 hover:bg-emerald-800 text-white p-3 rounded-lg font-semibold transition shadow-md mt-2 flex justify-center items-center gap-2">
                          {authMode === 'login' ? 'Entra nel Portale' : 'Invia Registrazione'}
                      </button>
                  </form>

                  <div className="mt-6 flex justify-center text-sm border-t pt-4 border-slate-100">
                      <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-emerald-700 hover:text-emerald-900 font-medium">
                          {authMode === 'login' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
                      </button>
                  </div>
              </div>
              
              {/* Footer e Reset */}
              <div className="mt-8 flex flex-col items-center gap-2">
                  <div className="text-xs text-slate-500 opacity-60">
                      Sistema di archiviazione genealogica privata
                  </div>
                  <button 
                    onClick={() => { if(confirm("Questo cancellerà tutti i dati locali per risolvere problemi di accesso. Continuare?")) hardReset(); }} 
                    className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 opacity-50 hover:opacity-100 transition"
                  >
                      <RefreshCw size={10} />
                      Problemi di accesso? Resetta dati locali
                  </button>
              </div>
          </div>
      );
  }

  // --- LAYOUT DASHBOARD ---
  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-900 font-sans">
       
       {/* SIDEBAR SINISTRA */}
       <DashboardSidebar 
            user={user} 
            currentView={currentView} 
            onChangeView={(v) => {
                if (v === 'add_person') {
                    handleCreateNew(); // Apre editor nuova persona
                } else {
                    setCurrentView(v);
                    setSelectedPerson(null);
                }
            }}
            onLogout={() => { logout(); setUser(null); }}
       />

       {/* CONTENUTO PRINCIPALE */}
       <main className="flex-1 relative flex flex-col h-full overflow-hidden">
           
           {/* Vista: Albero Genealogico */}
           {currentView === 'tree' && (
               <>
                  {people.length === 0 ? (
                       <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-6 p-4">
                           <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md border border-slate-200">
                               <TreeDeciduous size={64} className="mx-auto text-emerald-200 mb-4" />
                               <h2 className="text-xl font-bold text-slate-800 mb-2">L'albero è vuoto</h2>
                               <p className="mb-6 text-sm">
                                   Non ci sono ancora dati caricati.
                               </p>
                               {user.role === 'admin' && (
                                   <button 
                                      onClick={handleCreateNew} 
                                      className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition w-full"
                                   >
                                      Inserisci prima persona
                                   </button>
                               )}
                           </div>
                       </div>
                   ) : (
                       <div className="h-full w-full relative">
                           <FamilyTree 
                               data={people} 
                               onSelectPerson={setSelectedPerson} 
                               selectedPersonId={selectedPerson?.id} 
                           />
                       </div>
                   )}
               </>
           )}

           {/* Vista: Gestione Utenti (Admin) */}
           {currentView === 'admin_users' && (
               <div className="h-full overflow-auto p-8 bg-slate-100">
                   <div className="max-w-5xl mx-auto">
                       <h2 className="text-2xl font-serif font-bold text-slate-800 mb-6">Gestione Utenti</h2>
                       <AdminPanel key={Date.now()} /> 
                       {/* key=Date.now() forza il refresh del componente quando si entra nella vista */}
                   </div>
               </div>
           )}

            {/* Vista: Impostazioni (Admin) */}
            {currentView === 'admin_settings' && (
               <div className="h-full overflow-auto p-8 bg-slate-100">
                   <div className="max-w-4xl mx-auto space-y-8">
                       <h2 className="text-2xl font-serif font-bold text-slate-800 mb-4">Impostazioni & Dati</h2>
                       
                       {/* SEZIONE PUBBLICAZIONE */}
                       <div className="bg-white rounded-lg shadow-sm border border-emerald-200 overflow-hidden">
                          <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex justify-between items-center">
                              <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                                  <Globe size={18} /> Pubblicazione Dati
                              </h3>
                          </div>
                          <div className="p-6">
                              <p className="text-sm text-slate-600 mb-4">
                                  Poiché l'app non ha un database in cloud, le modifiche che fai restano sul tuo dispositivo.
                                  Per aggiornare ciò che vedono gli altri utenti quando si collegano, devi scaricare i dati attuali e chiedere di aggiornare il codice sorgente.
                              </p>
                              <button 
                                  onClick={handleExportForPublishing}
                                  className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 transition shadow-sm font-medium"
                              >
                                  <Download size={18} />
                                  Scarica Dati per Pubblicazione
                              </button>
                          </div>
                      </div>

                       <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                           <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                               <Upload size={20}/> Importazione Dati
                           </h3>
                           <p className="text-sm text-slate-500 mb-4">
                               Carica un file GEDCOM standard per popolare o aggiornare l'albero. 
                               Se l'albero contiene già dati, ti verrà chiesto se unire o sostituire.
                           </p>
                           <label className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded border border-slate-300 cursor-pointer transition">
                               <FilePlus size={18} />
                               Seleziona File .ged
                               <input type="file" accept=".ged" onChange={handleFileUpload} className="hidden" />
                           </label>
                       </div>

                       <div className="bg-white p-6 rounded-lg shadow-sm border border-red-100">
                            <h3 className="font-bold text-red-800 flex items-center gap-2 mb-4">
                                <Shield size={20}/> Zona Pericolo
                            </h3>
                            <p className="text-sm text-slate-600 mb-4">
                                Azioni distruttive e irreversibili.
                            </p>
                            <button 
                                onClick={() => { if(confirm("Sei ASSOLUTAMENTE sicuro? Questo cancellerà tutti gli utenti e tutti i dati dell'albero.")) hardReset(); }} 
                                className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded hover:bg-red-100 text-sm font-medium"
                            >
                                Reset Totale Applicazione
                            </button>
                       </div>
                   </div>
               </div>
           )}

           {/* Editor / Sidebar a comparsa per Dettagli o Nuova Persona */}
           {(selectedPerson || currentView === 'add_person') && (
               <PersonEditor 
                   person={selectedPerson || {
                        id: `@I${Date.now()}@`,
                        firstName: '',
                        lastName: '',
                        gender: Gender.Unknown,
                        isLiving: true,
                        spouseIds: [],
                        childrenIds: []
                   }} 
                   allPeople={people} 
                   onSave={handleSavePerson} 
                   onClose={() => {
                       setSelectedPerson(null);
                       if(currentView === 'add_person') setCurrentView('tree');
                   }}
                   onAddRelative={handleAddRelative}
                   onDelete={handleDelete}
                   isAdmin={user.role === 'admin'}
               />
           )}

       </main>
    </div>
  );
};

export default function App() {
    return (
        <ErrorBoundary>
            <AppContent />
        </ErrorBoundary>
    );
}