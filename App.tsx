import React, { useState, useEffect } from 'react';
import { Person, User, Gender } from './types';
import { parseGedcom } from './services/gedcomService';
import { getStoredPeople, savePeople, getSession, loginUser, registerUser, logout, clearData } from './services/storageService';
import { FamilyTree } from './components/FamilyTree';
import { PersonEditor } from './components/PersonEditor';
import { AdminPanel } from './components/AdminPanel';
import { LogOut, Upload, Download, Plus, TreeDeciduous, Lock, Menu } from 'lucide-react';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // App State
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [view, setView] = useState<'tree' | 'admin'>('tree');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Initial Load
  useEffect(() => {
    const session = getSession();
    if (session) {
      setUser(session);
    }
    const loadedPeople = getStoredPeople();
    setPeople(loadedPeople);
  }, []);

  // Save on change
  useEffect(() => {
    if (people.length > 0) {
        savePeople(people);
    }
  }, [people]);

  // Handlers - Auth
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const res = loginUser(email, password);
    if (res.success && res.user) {
      setUser(res.user);
    } else {
      setAuthError(res.message || 'Errore login');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    const res = registerUser(email, password, fullName);
    if (res.success) {
      setAuthSuccess(res.message);
      setAuthMode('login'); // Switch to login to see message
    } else {
      setAuthError(res.message);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  // Handlers - GEDCOM
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (text) {
            console.log("File letto, inizio parsing...");
            const parsed = parseGedcom(text);
            console.log("Persone trovate:", parsed.length);
            
            if (parsed.length === 0) {
                alert("Nessuna persona trovata nel file. Verifica che sia un file GEDCOM valido (.ged).");
                return;
            }

            if (confirm(`Trovate ${parsed.length} persone nel file. Vuoi sovrascrivere l'albero attuale?`)) {
                setPeople(parsed);
                savePeople(parsed);
                setSelectedPerson(null); // Deseleziona per evitare errori
                alert('Importazione completata con successo!');
            }
        }
      } catch (err) {
          console.error("Errore importazione:", err);
          alert("Si è verificato un errore durante la lettura del file.");
      }
    };
    
    reader.onerror = () => {
        alert("Errore nella lettura del file.");
    };

    reader.readAsText(file);
    
    // Reset del valore input per permettere di ricaricare lo stesso file se necessario
    event.target.value = '';
  };

  const handleExport = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(people));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "genealogia_backup.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  // Handlers - Person Management
  const handleUpdatePerson = (updated: Person) => {
    setPeople(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelectedPerson(null); // Close sidebar
  };

  const handleAddRelative = (type: 'parent' | 'child' | 'spouse', sourceId: string) => {
     // Create new ID
     const newId = `@I${Date.now()}@`; // Simple mock ID generator
     const sourcePerson = people.find(p => p.id === sourceId);
     if (!sourcePerson) return;

     const newPerson: Person = {
         id: newId,
         firstName: 'Nuova',
         lastName: sourcePerson.lastName, // default assumption
         gender: Gender.Unknown,
         isLiving: true,
         email: '',
         spouseIds: [],
         childrenIds: []
     };

     let updatedSource = { ...sourcePerson };
     const updates: Person[] = [newPerson];

     if (type === 'child') {
         newPerson.fatherId = sourcePerson.gender === Gender.Male ? sourceId : undefined;
         newPerson.motherId = sourcePerson.gender === Gender.Female ? sourceId : undefined;
         updatedSource.childrenIds = [...updatedSource.childrenIds, newId];
     } else if (type === 'parent') {
        if (!updatedSource.fatherId) updatedSource.fatherId = newId;
        else if (!updatedSource.motherId) updatedSource.motherId = newId;
        else {
            alert('Genitori già presenti.');
            return;
        }
        newPerson.childrenIds = [sourceId];
     } else if (type === 'spouse') {
         newPerson.spouseIds = [sourceId];
         updatedSource.spouseIds = [...updatedSource.spouseIds, newId];
         // Assume children might be shared? Not for now.
     }

     setPeople(prev => {
         const others = prev.filter(p => p.id !== sourceId);
         return [...others, updatedSource, ...updates];
     });
     
     // Select the new person to edit immediately
     setTimeout(() => setSelectedPerson(newPerson), 100);
  };

  const handleDeletePerson = (id: string) => {
      // Very basic delete: remove person, remove references in others
      const target = people.find(p => p.id === id);
      if(!target) return;

      setPeople(prev => prev.filter(p => p.id !== id).map(p => {
          return {
              ...p,
              spouseIds: p.spouseIds.filter(sid => sid !== id),
              childrenIds: p.childrenIds.filter(cid => cid !== id),
              fatherId: p.fatherId === id ? undefined : p.fatherId,
              motherId: p.motherId === id ? undefined : p.motherId
          }
      }));
      setSelectedPerson(null);
  };
  
  const handleCreateNewRoot = () => {
      const newId = `@I${Date.now()}@`;
      const newPerson: Person = {
         id: newId,
         firstName: 'Capostipite',
         lastName: 'Famiglia',
         gender: Gender.Male,
         isLiving: true,
         spouseIds: [],
         childrenIds: []
      };
      setPeople([...people, newPerson]);
      setSelectedPerson(newPerson);
  }

  // --- Render: Login Screen ---
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
          <div className="flex justify-center mb-4">
            <TreeDeciduous size={48} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-center text-slate-800 mb-2">Genealogia Resta</h1>
          <p className="text-center text-slate-500 mb-6 text-sm">Accesso riservato. Gestisci la tua storia familiare.</p>

          {authSuccess && (
            <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm">
              {authSuccess}
            </div>
          )}
          {authError && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
              {authError}
            </div>
          )}

          <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-slate-700">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="mt-1 block w-full border border-slate-300 rounded-md p-2"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mt-1 block w-full border border-slate-300 rounded-md p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="mt-1 block w-full border border-slate-300 rounded-md p-2"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition font-medium"
            >
              {authMode === 'login' ? 'Accedi' : 'Richiedi Registrazione'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm">
            {authMode === 'login' ? (
              <p>Non hai un account? <button onClick={() => setAuthMode('register')} className="text-blue-600 font-medium">Registrati</button></p>
            ) : (
              <p>Hai già un account? <button onClick={() => setAuthMode('login')} className="text-blue-600 font-medium">Accedi</button></p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Render: Main App ---
  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shadow-sm z-20">
        <div className="flex items-center gap-3">
            <TreeDeciduous className="text-blue-600" />
            <h1 className="text-xl font-serif font-bold text-slate-800 hidden sm:block">Genealogia Resta</h1>
        </div>

        <div className="flex items-center gap-4">
           {user.role === 'admin' && (
               <button 
                onClick={() => setView(view === 'admin' ? 'tree' : 'admin')}
                className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition ${view === 'admin' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
               >
                   <Lock size={16} />
                   Admin
               </button>
           )}
           <div className="h-6 w-px bg-slate-200 mx-1"></div>
           <span className="text-sm text-slate-500 hidden sm:block">{user.fullName}</span>
           <button onClick={handleLogout} className="text-slate-500 hover:text-red-600" title="Logout">
               <LogOut size={20} />
           </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        {view === 'admin' ? (
            <AdminPanel />
        ) : (
            <>
                {/* Toolbar */}
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                    <label className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow hover:bg-blue-50 cursor-pointer text-blue-600" title="Importa GEDCOM">
                        <Upload size={20} />
                        {/* Input file deve essere resettato dopo l'uso, gestito in handleFileUpload */}
                        <input type="file" accept=".ged" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <button onClick={handleExport} className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow hover:bg-blue-50 text-blue-600" title="Esporta Backup">
                        <Download size={20} />
                    </button>
                    <button onClick={handleCreateNewRoot} className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow hover:bg-blue-50 text-green-600" title="Nuova Persona">
                        <Plus size={20} />
                    </button>
                </div>

                {people.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400 flex-col gap-4">
                        <TreeDeciduous size={64} className="opacity-20" />
                        <p className="text-lg">L'albero è vuoto.</p>
                        <div className="flex gap-4">
                            <label className="px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700">
                                Importa GEDCOM
                                <input type="file" accept=".ged" onChange={handleFileUpload} className="hidden" />
                            </label>
                            <button onClick={handleCreateNewRoot} className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50">
                                Crea Manualmente
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Key force re-render when data length or root changes dramatically */
                    <FamilyTree 
                        key={people.length + '-' + (people[0]?.id || '0')}
                        data={people} 
                        onSelectPerson={setSelectedPerson} 
                        selectedPersonId={selectedPerson?.id}
                    />
                )}
            </>
        )}
      </div>

      {/* Slide-over Person Editor */}
      {selectedPerson && (
          <PersonEditor 
            person={selectedPerson} 
            allPeople={people}
            onSave={handleUpdatePerson}
            onClose={() => setSelectedPerson(null)}
            onAddRelative={handleAddRelative}
            onDelete={handleDeletePerson}
            isAdmin={user.role === 'admin'}
          />
      )}
    </div>
  );
};

export default App;