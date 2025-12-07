import React, { useState, useEffect } from 'react';
import { Person, User, Gender } from './types';
import { parseGedcom } from './services/gedcomService';
import { getStoredPeople, savePeople, getSession, loginUser, registerUser, logout, hardReset } from './services/storageService';
import { FamilyTree } from './components/FamilyTree';
import { PersonEditor } from './components/PersonEditor';
import { AdminPanel } from './components/AdminPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Upload, Plus, TreeDeciduous, Shield, LogOut, LayoutDashboard, User as UserIcon } from 'lucide-react';

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [view, setView] = useState<'tree' | 'admin'>('tree');

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
                    if (confirm(`Trovate ${parsed.length} persone nel file. Vuoi importarle sostituendo i dati attuali?`)) {
                        setPeople(parsed);
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
          firstName: 'Nuova',
          lastName: 'Persona',
          gender: Gender.Unknown,
          isLiving: true,
          spouseIds: [],
          childrenIds: []
      };
      setPeople(prev => [...prev, newP]);
      setSelectedPerson(newP);
  };

  const handleUpdate = (p: Person) => {
      setPeople(prev => prev.map(x => x.id === p.id ? p : x));
  };

  const handleDelete = (id: string) => {
      setPeople(prev => prev.filter(x => x.id !== id));
      setSelectedPerson(null);
  };

  const handleAddRelative = (type: string, sourceId: string) => {
      alert("Per aggiungere un parente: \n1. Crea una nuova persona con il tasto '+' in alto a destra.\n2. Apri la nuova persona e usa i campi 'Padre/Madre/Coniuge' per collegarla.");
  };

  // --- SCHERMATA DI LOGIN ---
  if (!user) {
      if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Caricamento...</div>;

      return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 to-emerald-50 p-4 font-sans">
              <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-sm border border-slate-200">
                  <div className="flex justify-center mb-6">
                      <div className="p-3 bg-emerald-100 rounded-full">
                        <TreeDeciduous size={40} className="text-emerald-700" />
                      </div>
                  </div>
                  <h1 className="text-2xl font-serif font-bold mb-2 text-center text-slate-800">
                      Genealogia Resta
                  </h1>
                  <p className="text-center text-slate-500 mb-8 text-sm">
                      Accesso riservato alla famiglia
                  </p>
                  
                  <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="flex flex-col gap-4">
                      {authMode === 'register' && (
                          <div className="relative">
                            <UserIcon className="absolute left-3 top-3.5 text-slate-400" size={18} />
                            <input 
                                className="border p-3 pl-10 rounded-lg bg-slate-50 w-full focus:ring-2 focus:ring-emerald-500 outline-none" 
                                placeholder="Nome e Cognome" 
                                value={fullName} 
                                onChange={e=>setFullName(e.target.value)} 
                                required 
                            />
                          </div>
                      )}
                      <input 
                        className="border p-3 rounded-lg bg-slate-50 focus:ring-2 focus:ring-emerald-500 outline-none" 
                        placeholder="Email" 
                        type="email" 
                        value={email} 
                        onChange={e=>setEmail(e.target.value)} 
                        required 
                      />
                      <input 
                        className="border p-3 rounded-lg bg-slate-50 focus:ring-2 focus:ring-emerald-500 outline-none" 
                        placeholder="Password" 
                        type="password" 
                        value={password} 
                        onChange={e=>setPassword(e.target.value)} 
                        required 
                      />
                      
                      <button className="bg-emerald-700 text-white p-3 rounded-lg font-semibold hover:bg-emerald-800 transition shadow-md mt-2">
                          {authMode === 'login' ? 'Accedi' : 'Registrati'}
                      </button>
                  </form>

                  <div className="mt-6 flex justify-center text-sm">
                      <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-emerald-700 hover:underline font-medium">
                          {authMode === 'login' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
                      </button>
                  </div>
              </div>
              <div className="mt-8 text-xs text-slate-400">
                  &copy; {new Date().getFullYear()} Famiglia Resta
              </div>
          </div>
      );
  }

  // --- APPLICAZIONE PRINCIPALE ---
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
       {/* HEADER */}
       <header className="h-16 border-b bg-white shadow-sm flex items-center justify-between px-4 md:px-6 shrink-0 z-20">
           <div className="flex items-center gap-2 text-emerald-800 cursor-pointer" onClick={() => setView('tree')}>
               <TreeDeciduous className="text-emerald-600" />
               <span className="font-serif font-bold text-lg md:text-xl tracking-tight hidden md:inline">Famiglia Resta</span>
           </div>
           
           <div className="flex items-center gap-2 md:gap-4">
               <div className="text-sm text-slate-600 hidden sm:flex flex-col items-end leading-tight">
                   <span className="font-semibold">{user.fullName}</span>
                   <span className="text-xs text-slate-400 capitalize">{user.role === 'admin' ? 'Amministratore' : 'Utente'}</span>
               </div>
               
               {user.role === 'admin' && (
                   <button 
                     onClick={() => setView(view === 'tree' ? 'admin' : 'tree')} 
                     className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${view === 'admin' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                     title={view === 'tree' ? "Vai alla Dashboard" : "Torna all'Albero"}
                   >
                       {view === 'tree' ? <><LayoutDashboard size={18} /><span className="hidden md:inline">Dashboard</span></> : <><TreeDeciduous size={18} /><span className="hidden md:inline">Albero</span></>}
                   </button>
               )}
               
               <div className="h-6 w-px bg-slate-200 mx-1"></div>

               <button 
                 onClick={() => { logout(); setUser(null); }} 
                 className="p-2 text-slate-400 hover:text-red-600 transition rounded-full hover:bg-red-50"
                 title="Esci"
               >
                   <LogOut size={20} />
               </button>
           </div>
       </header>

       {/* MAIN CONTENT */}
       <main className="flex-1 relative overflow-hidden bg-slate-100">
           {view === 'admin' ? (
               <div className="h-full overflow-auto p-4 md:p-8">
                   <AdminPanel />
                   
                   {/* Admin Utils aggiuntive */}
                   <div className="max-w-4xl mx-auto mt-8 bg-white p-6 rounded shadow border-t-4 border-red-200">
                        <h3 className="font-bold text-red-800 flex items-center gap-2 mb-4">
                            <Shield size={20}/> Zona Pericolo
                        </h3>
                        <p className="text-sm text-slate-600 mb-4">Queste azioni sono irreversibili. Procedere con cautela.</p>
                        <button 
                            onClick={() => { if(confirm("Sei ASSOLUTAMENTE sicuro? Questo cancellerà tutti gli utenti e tutti i dati dell'albero.")) hardReset(); }} 
                            className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded hover:bg-red-100 text-sm font-medium"
                        >
                            Reset Totale Applicazione
                        </button>
                   </div>
               </div>
           ) : (
               <>
                   {people.length === 0 ? (
                       <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-6 p-4">
                           <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md border border-slate-100">
                               <TreeDeciduous size={64} className="mx-auto text-emerald-200 mb-4" />
                               <h2 className="text-xl font-bold text-slate-800 mb-2">L'albero è vuoto</h2>
                               <p className="mb-6">
                                   {user.role === 'admin' 
                                     ? "Importa un file GEDCOM esistente oppure inizia a creare l'albero manualmente." 
                                     : "L'amministratore non ha ancora caricato i dati della famiglia."}
                               </p>
                               
                               {user.role === 'admin' && (
                                   <div className="flex flex-col gap-3">
                                       <label className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg cursor-pointer flex items-center justify-center gap-2 transition shadow">
                                           <Upload size={18} />
                                           Importa GEDCOM
                                           <input type="file" accept=".ged" onChange={handleFileUpload} className="hidden" />
                                       </label>
                                       <span className="text-xs text-slate-400">- oppure -</span>
                                       <button onClick={handleCreateNew} className="text-emerald-600 font-medium hover:underline">
                                           Crea prima persona manualmente
                                       </button>
                                   </div>
                               )}
                           </div>
                       </div>
                   ) : (
                       <>
                           {/* TOOLBAR ALBERO */}
                           <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                               {user.role === 'admin' && (
                                   <label className="bg-white p-3 rounded-full shadow-lg cursor-pointer text-slate-600 hover:text-emerald-600 transition hover:scale-105" title="Importa GEDCOM (Sovrascrive)">
                                       <Upload size={20} />
                                       <input type="file" accept=".ged" onChange={handleFileUpload} className="hidden" />
                                   </label>
                               )}
                               <button 
                                 onClick={handleCreateNew} 
                                 className="bg-emerald-600 p-3 rounded-full shadow-lg text-white hover:bg-emerald-700 transition hover:scale-105"
                                 title="Aggiungi Persona"
                               >
                                   <Plus size={20}/>
                               </button>
                           </div>

                           <FamilyTree 
                               data={people} 
                               onSelectPerson={setSelectedPerson} 
                               selectedPersonId={selectedPerson?.id} 
                           />
                       </>
                   )}
               </>
           )}
       </main>

       {/* SIDEBAR EDITOR */}
       {selectedPerson && (
           <PersonEditor 
               person={selectedPerson} 
               allPeople={people} 
               onSave={handleUpdate} 
               onClose={() => setSelectedPerson(null)}
               onAddRelative={handleAddRelative}
               onDelete={handleDelete}
               isAdmin={user.role === 'admin'}
           />
       )}
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