import React, { useState, useEffect } from 'react';
import { Person, User, Gender } from './types';
import { parseGedcom } from './services/gedcomService';
import { getStoredPeople, savePeople, getSession, loginUser, registerUser, logout, hardReset } from './services/storageService';
import { FamilyTree } from './components/FamilyTree';
import { PersonEditor } from './components/PersonEditor';
import { AdminPanel } from './components/AdminPanel';
import { LogOut, Upload, Plus, TreeDeciduous, Shield, User as UserIcon } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [view, setView] = useState<'tree' | 'admin'>('tree');

  // Stati per Auth
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Inizializzazione
  useEffect(() => {
    const session = getSession();
    if (session) setUser(session);
    
    const stored = getStoredPeople();
    setPeople(stored);
  }, []);

  // Salvataggio automatico
  useEffect(() => {
    if (people.length > 0) {
        savePeople(people);
    }
  }, [people]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      if (res.success) setAuthMode('login');
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
      // Non chiudiamo l'editor, aggiorniamo solo i dati
      // setSelectedPerson(null); 
  };

  const handleDelete = (id: string) => {
      setPeople(prev => prev.filter(x => x.id !== id));
      setSelectedPerson(null);
  };

  const handleAddRelative = (type: string, sourceId: string) => {
      // Per ora mostriamo un alert, in futuro implementeremo la creazione guidata delle relazioni
      alert("Funzione rapida in arrivo. Per ora crea una nuova persona dal pulsante '+' e usa l'editor per collegare i parenti manualmente.");
  };

  // --- SCHERMATA DI LOGIN ---
  if (!user) {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4 font-sans">
              <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm border border-slate-200">
                  <div className="flex justify-center mb-4 text-emerald-600">
                      <TreeDeciduous size={48} />
                  </div>
                  <h1 className="text-2xl font-serif font-bold mb-6 text-center text-slate-800">
                      Genealogia Resta
                  </h1>
                  
                  <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="flex flex-col gap-4">
                      {authMode === 'register' && (
                          <input 
                            className="border p-3 rounded bg-slate-50" 
                            placeholder="Nome e Cognome" 
                            value={fullName} 
                            onChange={e=>setFullName(e.target.value)} 
                            required 
                          />
                      )}
                      <input 
                        className="border p-3 rounded bg-slate-50" 
                        placeholder="Email" 
                        type="email" 
                        value={email} 
                        onChange={e=>setEmail(e.target.value)} 
                        required 
                      />
                      <input 
                        className="border p-3 rounded bg-slate-50" 
                        placeholder="Password" 
                        type="password" 
                        value={password} 
                        onChange={e=>setPassword(e.target.value)} 
                        required 
                      />
                      <button className="bg-emerald-600 text-white p-3 rounded font-semibold hover:bg-emerald-700 transition shadow-sm">
                          {authMode === 'login' ? 'Accedi' : 'Registrati'}
                      </button>
                  </form>

                  <div className="mt-6 flex justify-between items-center text-sm">
                      <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-emerald-600 underline">
                          {authMode === 'login' ? 'Crea un account' : 'Torna al login'}
                      </button>
                  </div>
                  
                  <div className="mt-8 pt-4 border-t border-slate-100">
                     <p className="text-xs text-slate-400 text-center mb-2">Problemi tecnici?</p>
                     <button onClick={hardReset} className="text-xs text-red-400 border border-red-100 p-2 rounded w-full hover:bg-red-50">
                        Reset Applicazione
                     </button>
                  </div>
              </div>
          </div>
      );
  }

  // --- APPLICAZIONE PRINCIPALE ---
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
       {/* HEADER */}
       <header className="h-16 border-b bg-white shadow-sm flex items-center justify-between px-6 shrink-0 z-20">
           <div className="flex items-center gap-2 text-emerald-800">
               <TreeDeciduous className="text-emerald-600" />
               <span className="font-serif font-bold text-xl tracking-tight">Famiglia Resta</span>
           </div>
           
           <div className="flex items-center gap-4">
               <div className="text-sm text-slate-500 hidden sm:block">
                   Ciao, <strong>{user.fullName}</strong>
               </div>
               
               {user.role === 'admin' && (
                   <button 
                     onClick={() => setView(view === 'tree' ? 'admin' : 'tree')} 
                     className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition ${view === 'admin' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                   >
                       {view === 'tree' ? <><Shield size={16}/> Pannello Admin</> : <><TreeDeciduous size={16}/> Vedi Albero</>}
                   </button>
               )}
               
               <button 
                 onClick={() => { logout(); setUser(null); }} 
                 className="p-2 text-slate-400 hover:text-red-500 transition rounded-full hover:bg-red-50"
                 title="Esci"
               >
                   <LogOut size={20} />
               </button>
           </div>
       </header>

       {/* MAIN CONTENT */}
       <main className="flex-1 relative overflow-hidden">
           {view === 'admin' ? (
               <div className="h-full overflow-auto bg-slate-50">
                   <AdminPanel />
               </div>
           ) : (
               <>
                   {people.length === 0 ? (
                       <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-6 p-4">
                           <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md border border-slate-100">
                               <TreeDeciduous size={64} className="mx-auto text-emerald-200 mb-4" />
                               <h2 className="text-xl font-bold text-slate-800 mb-2">L'albero è vuoto</h2>
                               <p className="mb-6">Importa un file GEDCOM esistente oppure inizia a creare l'albero manualmente.</p>
                               
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
                           </div>
                       </div>
                   ) : (
                       <>
                           {/* TOOLBAR ALBERO */}
                           <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                               <label className="bg-white p-3 rounded-full shadow-lg cursor-pointer text-slate-600 hover:text-emerald-600 transition hover:scale-105" title="Importa GEDCOM">
                                   <Upload size={20} />
                                   <input type="file" accept=".ged" onChange={handleFileUpload} className="hidden" />
                               </label>
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

export default App;