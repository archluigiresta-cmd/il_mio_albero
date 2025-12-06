import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { getStoredUsers, approveUser, deleteUser } from '../services/storageService';
import { Check, X, Shield } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  const refresh = () => {
    setUsers(getStoredUsers().filter(u => u.role !== 'admin'));
  };

  useEffect(() => {
    refresh();
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

  return (
    <div className="p-6 bg-white rounded shadow max-w-4xl mx-auto mt-10">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="text-blue-600" size={32} />
        <h2 className="text-2xl font-serif font-bold text-gray-800">Pannello Amministratore</h2>
      </div>
      
      <p className="mb-4 text-gray-600">Gestisci le richieste di accesso all'applicazione.</p>

      {users.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded text-gray-500">
            Nessun utente registrato in attesa.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Reg.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.email}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.registeredAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.fullName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.isApproved ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Attivo
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        In Attesa
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    {!user.isApproved && (
                        <button
                          onClick={() => handleApprove(user.email)}
                          className="text-green-600 hover:text-green-900 bg-green-50 p-1 rounded"
                          title="Approva"
                        >
                          <Check size={18} />
                        </button>
                    )}
                    <button
                      onClick={() => handleReject(user.email)}
                      className="text-red-600 hover:text-red-900 bg-red-50 p-1 rounded"
                      title="Elimina"
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
  );
};