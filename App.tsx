import React, { useState, useEffect } from 'react';
import { Person, User, Gender } from './types';
import { parseGedcom } from './services/gedcomService';
import { getStoredPeople, savePeople, getSession, loginUser, registerUser, logout, hardReset } from './services/storageService';
import { FamilyTree } from './components/FamilyTree';
import { PersonEditor } from './components/PersonEditor';
import { AdminPanel } from './components/AdminPanel';
import { LogOut, Upload, Download, Plus, TreeDeciduous, Lock, Trash2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [view, setView] = useState<'tree' | 'admin'>('tree');

  // Auth States
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Init
  useEffect(() => {
    const session = getSession();
    if (session) setUser(session);
    
    const stored = getStoredPeople();
    setPeople(stored);
  }, []);

  // Save
  useEffect(() => {
    if (people.length > 0) savePeople(people);
  }, [people]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
          const content = evt.target?.result as string;
          if (content) {
              const parsed = parseGedcom(content);
              if (parsed.length > 0) {
                  if (confirm(`Trovate ${parsed.length} persone. Importare?`)) {
                      setPeople(parsed);
                      alert("Importazione completata.");
                  }
              } else {
                  alert("Nessuna persona trovata nel file GEDCOM.");
              }
          }
      };
      reader.readAsText(file);
      e.target.value = ''; // Reset
  };

  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      const res = loginUser(email, password);
      if (res.success && res.user) setUser(res.user);
      else alert(res.message);
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
      setPeople([...people, newP]);
      setSelectedPerson(newP);
  };

  const handleUpdate = (p: Person) => {
      setPeople(prev => prev.map(x => x.id === p.id ? p : x));
      setSelectedPerson(null);
  };

  const handleDelete = (id: string) => {
      setPeople(prev => prev.filter(x => x.id !== id));
      setSelectedPerson(null);
  };

  const handleAddRelative = (type: string, sourceId: string) => {
      alert("Funzione semplificata: usa 'Crea Manualmente' e collega manualmente per ora.");
  };

  if (!user) {
      return (
          <div className="flex flex-col items-center justify-center h-screen bg-slate-100 p-4">
              <div className="bg-white p-8 rounded shadow-md w-full max-w-sm">
                  <h1 className="text-2xl font-bold mb-4 text-center">Login Genealogia</h1>
                  <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="flex flex-col gap-3">
                      {authMode === 'register' && (
                          <input className="border p-2 rounded" placeholder="Nome Completo" value={fullName} onChange={e=>setFullName(e.target.value)} required />
                      )}
                      <input className="border p-2 rounded" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
                      <input className="border p-2 rounded" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
                      <button className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                          {authMode === 'login' ? 'Accedi' : 'Registrati'}
                      </button>
                  </form>
                  <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-sm text-blue-500 mt-4 underline w-full text-center">
                      {authMode === 'login' ? 'Crea un account' : 'Torna al login'}
                  </button>
                  
                  <button onClick={hardReset} className="mt-8 text-xs text-red-400 border border-red-200 p-1 rounded w-full">
                     Reset di Emergenza (Cancella Dati)
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-screen">
       <header className="h-14 border-b flex items-center justify-between px-4 bg-white shadow-sm shrink-0">
           <div className="font-serif font-bold text-lg flex items-center gap-2">
               <TreeDeciduous /> Famiglia Resta
           </div>
           <div className="flex items-center gap-4">
               {user.role === 'admin' && (
                   <button onClick={() => setView(view === 'tree' ? 'admin' : 'tree')} className="text-sm bg-slate-100 px-2 py-1 rounded">
                       {view === 'tree' ? 'Admin Panel' : 'Vedi Albero'}
                   </button>
               )}
               <button onClick={() => { logout(); setUser(null); }}><LogOut size={18} /></button>
           </div>
       </header>

       <main className="flex-1 overflow-hidden relative bg-slate-50">
           {view === 'admin' ? <AdminPanel /> : (
               <>
                   {people.length === 0 ? (
                       <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                           <p>Nessun dato.</p>
                           <label className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer">
                               Importa GEDCOM
                               <input type="file" onChange={handleFileUpload} className="hidden" />
                           </label>
                           <button onClick={handleCreateNew} className="text-blue-600 underline">Crea prima persona</button>
                       </div>
                   ) : (
                       <>
                           <div className="absolute top-2 right-2 z-10 flex gap-2">
                               <label className="bg-white p-2 rounded shadow cursor-pointer text-blue-600" title="Importa">
                                   <Upload size={20} />
                                   <input type="file" onChange={handleFileUpload} className="hidden" />
                               </label>
                               <button onClick={handleCreateNew} className="bg-white p-2 rounded shadow text-green-600"><Plus size={20}/></button>
                           </div>
                           <FamilyTree data={people} onSelectPerson={setSelectedPerson} selectedPersonId={selectedPerson?.id} />
                       </>
                   )}
               </>
           )}
       </main>

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