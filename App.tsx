import React, { useState, useEffect } from 'react';
import { Person, User, Gender } from './types';
import { parseGedcom, mergePeople } from './services/gedcomService';
import { getStoredPeople, savePeople, getSession, loginUser, registerUser, logout, hardReset } from './services/storageService';
import { FamilyTree } from './components/FamilyTree';
import { PersonEditor } from './components/PersonEditor';
import { AdminPanel } from './components/AdminPanel';
import { DashboardSidebar } from './components/DashboardSidebar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Upload, TreeDeciduous, Shield, User as UserIcon, FilePlus, RefreshCw, Download, Globe } from 'lucide-react';
import { APP_VERSION, APP_NAME } from './constants';

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [currentView, setCurrentView] = useState('tree');

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (session) setUser(session);
    setPeople(getStoredPeople());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && people.length > 0) savePeople(people);
  }, [people, loading]);

  const handleSavePerson = (p: Person) => {
      setPeople(prev => prev.map(x => x.id === p.id ? p : x));
      setEditingPerson(null);
  };

  if (!user) {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4 font-sans text-slate-100">
              <div className="bg-white text-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-sm">
                  <div className="flex justify-center mb-6">
                      <div className="p-4 bg-emerald-600 rounded-xl"><TreeDeciduous size={48} className="text-white" /></div>
                  </div>
                  <h1 className="text-2xl font-bold text-center mb-6">{APP_NAME}</h1>
                  <form onSubmit={authMode === 'login' ? (e)=>{e.preventDefault(); const r=loginUser(email, password); if(r.user) setUser(r.user); else alert(r.message)} : (e)=>{e.preventDefault(); alert(registerUser(email,password,fullName).message)}} className="flex flex-col gap-4">
                      {authMode === 'register' && <input className="border p-3 rounded-lg" placeholder="Nome" value={fullName} onChange={e=>setFullName(e.target.value)} required />}
                      <input className="border p-3 rounded-lg" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
                      <input className="border p-3 rounded-lg" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
                      <button className="bg-emerald-700 text-white p-3 rounded-lg font-bold">{authMode === 'login' ? 'Entra' : 'Registrati'}</button>
                  </form>
                  <button onClick={()=>setAuthMode(authMode==='login'?'register':'login')} className="w-full text-xs mt-4 text-emerald-700">Cambia modalità</button>
              </div>
              <p className="mt-4 text-[10px] text-slate-500">v{APP_VERSION}</p>
          </div>
      );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans">
       <DashboardSidebar user={user} currentView={currentView} onChangeView={setCurrentView} onLogout={logout} />
       <main className="flex-1 relative overflow-hidden">
           {currentView === 'tree' && (
               <FamilyTree 
                    data={people} 
                    onSelectPerson={setSelectedPerson} 
                    selectedPersonId={selectedPerson?.id} 
                    onOpenEditor={setEditingPerson}
               />
           )}
           {editingPerson && (
               <PersonEditor 
                   person={editingPerson} 
                   allPeople={people} 
                   onSave={handleSavePerson} 
                   onClose={() => setEditingPerson(null)} 
                   onAddRelative={()=>{}} 
                   onDelete={()=>{}} 
                   isAdmin={user.role === 'admin'} 
               />
           )}
       </main>
    </div>
  );
};

export default function App() { return <ErrorBoundary><AppContent /></ErrorBoundary>; }