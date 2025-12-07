import React from 'react';
import { TreeDeciduous } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 font-sans p-6">
      <div className="max-w-2xl w-full text-center space-y-8">
        
        {/* Icona e Titolo */}
        <div className="flex flex-col items-center animate-bounce-slow">
          <div className="p-4 bg-emerald-100 rounded-full mb-4 shadow-sm">
            <TreeDeciduous size={64} className="text-emerald-700" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 tracking-tight">
            Genealogia Resta
          </h1>
          <p className="text-xl text-slate-500 mt-2 font-light">
            Mappatura storica e archivio famigliare
          </p>
        </div>

        {/* Card Informativa */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 mt-10">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Stato del Sistema</h2>
          <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 py-3 px-4 rounded-lg border border-emerald-100">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="font-medium">Applicazione Attiva</span>
          </div>
          
          <p className="text-slate-500 mt-6 leading-relaxed">
            Il sistema è stato resettato correttamente. 
            <br/>
            Questa è la schermata di base per confermare che il server Vercel risponda correttamente.
          </p>
        </div>

        <div className="text-xs text-slate-400">
          Versione v1.0.0 - Reset Iniziale
        </div>
      </div>
    </div>
  );
}