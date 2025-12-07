import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { getStoredUsers, getStoredPeople, approveUser, deleteUser, updateUserPassword } from '../services/storageService';
import { Check, X, Shield, RefreshCw, Clock, KeyRound, Download, Globe } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  const refresh = () => {
    const allUsers = getStoredUsers();
    setUsers(allUsers.filter(u => u.role !== 'admin'));
  };

  useEffect(() => {
    refresh();
    const intervalId = setInterval(() => {
        refresh();
    }, 2000);
    return () => clearInterval(intervalId);
  }, []);

  const handleApprove = (email: string) => {
    approveUser(email);
    refresh(); 
  };

  const handleReject = (email: string) => {
    if(confirm(`Rifiutare ed eliminare l'utente ${email}?`)) {
        deleteUser(email);
        refresh();
    }
  };
  
  const handleResetPassword = (email: string) => {
      const newPass = prompt(`Inserisci nuova password per ${email}:`);
      if (newPass && newPass.trim().length > 0) {
          updateUserPassword(email, newPass);
          alert("Password aggiornata correttamente.");
          refresh();
      }
  };

  const handleExportForPublishing = () => {
      const people = getStoredPeople();
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

  return (
    <div className="space-y-6 animate-fadeIn">
      
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

      {/* SEZIONE UTENTI */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-slate-700">Richieste di Accesso</div>
                {users.some(u => !u.isApproved) && (
                    <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-amber-200">
                        {users.filter(u => !u.isApproved).length} in attesa
                    </span>
                )}
            </div>
            <button onClick={refresh} className="text-slate-400 hover:text-emerald-600 transition" title="Aggiorna lista">
                <RefreshCw size={16} />
            </button>
        </div>

        {users.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
                <Shield size={48} className="mx-auto mb-3 opacity-20" />
                <p>Nessun utente registrato (oltre all'admin).</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-white">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Info</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Stato</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Azioni</th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                {users.map((user) => (
                    <tr key={user.email} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-700">{user.fullName}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock size={10} /> {new Date(user.registeredAt).toLocaleDateString()}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                        {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        {user.isApproved ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Attivo
                        </span>
                        ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                            In Attesa
                        </span>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                        {!user.isApproved && (
                            <button
                            onClick={() => handleApprove(user.email)}
                            className="text-emerald-600 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 p-2 rounded-lg transition"
                            title="Approva Accesso"
                            >
                            <Check size={18} />
                            </button>
                        )}
                        <button
                        onClick={() => handleResetPassword(user.email)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition"
                        title="Reset Password"
                        >
                        <KeyRound size={18} />
                        </button>
                        <button
                        onClick={() => handleReject(user.email)}
                        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition"
                        title="Elimina Utente"
                        >
                        <X size={18} />
                        </button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        )}
      </div>
    </div>
  );
};