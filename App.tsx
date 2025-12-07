import React, { useState, useEffect } from 'react';
import { Person, Gender } from './types';
import { parseGedcom } from './services/gedcomService';
import { getStoredPeople, savePeople, hardReset } from './services/storageService';
import { FamilyTree } from './components/FamilyTree';
import { PersonEditor } from './components/PersonEditor';
import { Upload, Plus, TreeDeciduous, RotateCcw } from 'lucide-react';

const App: React.FC = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  // Caricamento iniziale
  useEffect(() => {
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
                    if (confirm(`Trovate ${parsed.length} persone. Importare?`)) {
                        setPeople(parsed);
                    }
                } else {
                    alert("File non valido o vuoto.");
                }
              } catch (err) {
                  console.error(err);
                  alert("Errore lettura GEDCOM.");
              }
          }
      };
      reader.readAsText(file);
      e.target.value = '';
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
      alert("Funzione rapida: usa il tasto '+' per creare la persona, poi collegala manualmente nell'editor.");
  };

  // --- UI ---
  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
       {/* HEADER SEMPLIFICATO */}
       <header className="h-16 border-b bg-white shadow-sm flex items-center justify-between px-6 shrink-0 z-20">
           <div className="flex items-center gap-2 text-emerald-800">
               <TreeDeciduous className="text-emerald-600" />
               <span className="font-serif font-bold text-xl">Genealogia Resta</span>
           </div>
           
           <div className="flex gap-2">
               <button 
                 onClick={() => { if(confirm("Cancellare tutto e ripartire?")) hardReset(); }} 
                 className="p-2 text-slate-400 hover:text-red-500 transition rounded-full hover:bg-red-50"
                 title="Reset App"
               >
                   <RotateCcw size={18} />
               </button>
           </div>
       </header>

       {/* MAIN */}
       <main className="flex-1 relative overflow-hidden">
           {people.length === 0 ? (
               // SCHERMATA INIZIALE VUOTA
               <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-6 p-4">
                   <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md border border-slate-100">
                       <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <TreeDeciduous size={40} className="text-emerald-600" />
                       </div>
                       <h2 className="text-2xl font-serif font-bold text-slate-800 mb-2">Benvenuto</h2>
                       <p className="mb-8 text-slate-600">
                           L'archivio è vuoto. Importa il tuo file genealogico (.ged) o inizia un nuovo albero.
                       </p>
                       
                       <div className="flex flex-col gap-3">
                           <label className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-xl cursor-pointer flex items-center justify-center gap-3 transition shadow-lg hover:translate-y-[-2px]">
                               <Upload size={20} />
                               <span className="font-semibold">Importa file GEDCOM</span>
                               <input type="file" accept=".ged" onChange={handleFileUpload} className="hidden" />
                           </label>
                           
                           <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200"></span></div>
                                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">oppure</span></div>
                           </div>

                           <button onClick={handleCreateNew} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-3 rounded-xl transition flex items-center justify-center gap-2">
                               <Plus size={18} />
                               Crea manualmente
                           </button>
                       </div>
                   </div>
               </div>
           ) : (
               // ALBERO
               <>
                   <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                       <label className="bg-white p-3 rounded-full shadow-lg cursor-pointer text-slate-600 hover:text-emerald-600 transition hover:scale-110" title="Importa Altro">
                           <Upload size={20} />
                           <input type="file" accept=".ged" onChange={handleFileUpload} className="hidden" />
                       </label>
                       <button 
                         onClick={handleCreateNew} 
                         className="bg-emerald-600 p-3 rounded-full shadow-lg text-white hover:bg-emerald-700 transition hover:scale-110"
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
               isAdmin={true} 
           />
       )}
    </div>
  );
};

export default App;