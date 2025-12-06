import React, { useState, useEffect } from 'react';
import { Person, Gender } from '../types';
import { X, Save, UserPlus, Trash2, User as UserIcon } from 'lucide-react';

interface PersonEditorProps {
  person: Person | null;
  allPeople: Person[];
  onSave: (p: Person) => void;
  onClose: () => void;
  onAddRelative: (relation: 'parent' | 'child' | 'spouse', sourcePersonId: string) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}

// Helper to split date string "DD MMM YYYY" or similar
const parseDateString = (dateStr?: string) => {
    if (!dateStr) return { day: '', month: '', year: '' };
    const parts = dateStr.trim().split(/[\s/-]+/);
    if (parts.length === 3) {
        return { day: parts[0], month: parts[1], year: parts[2] };
    }
    // Fallback: put everything in year if format is weird
    return { day: '', month: '', year: dateStr };
};

export const PersonEditor: React.FC<PersonEditorProps> = ({ person, allPeople, onSave, onClose, onAddRelative, onDelete, isAdmin }) => {
  const [formData, setFormData] = useState<Person | null>(null);
  const [birthDateParts, setBirthDateParts] = useState({ day: '', month: '', year: '' });
  const [deathDateParts, setDeathDateParts] = useState({ day: '', month: '', year: '' });

  useEffect(() => {
    if (person) {
        setFormData(person);
        setBirthDateParts(parseDateString(person.birthDate));
        setDeathDateParts(parseDateString(person.deathDate));
    }
  }, [person]);

  if (!person || !formData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? ({ ...prev, [name]: value }) : null);
  };

  const handleGenderChange = (g: Gender) => {
      setFormData(prev => prev ? ({ ...prev, gender: g }) : null);
  };

  const handleLivingChange = (isLiving: boolean) => {
      setFormData(prev => prev ? ({ ...prev, isLiving }) : null);
  };

  const handleSave = () => {
    if (formData) {
        // Reconstruct dates
        const bDate = [birthDateParts.day, birthDateParts.month, birthDateParts.year].filter(Boolean).join(' ');
        const dDate = [deathDateParts.day, deathDateParts.month, deathDateParts.year].filter(Boolean).join(' ');
        
        onSave({
            ...formData,
            birthDate: bDate,
            deathDate: dDate
        });
    }
  };

  // Determine header title based on context (Adding new relative vs Editing)
  let title = "Dettagli Persona";
  let subtitle = "";
  
  if (formData.firstName === 'Nuova') {
      // Try to infer relationship context
      if (formData.fatherId) {
          const f = allPeople.find(p => p.id === formData.fatherId);
          if (f) title = `Aggiungi figlio/a di ${f.firstName}`;
      } else if (formData.motherId) {
          const m = allPeople.find(p => p.id === formData.motherId);
          if (m) title = `Aggiungi figlio/a di ${m.firstName}`;
      } else if (formData.spouseIds.length > 0) {
          const s = allPeople.find(p => p.id === formData.spouseIds[0]);
          if (s) title = `Aggiungi coniuge di ${s.firstName}`;
      } else if (formData.childrenIds.length > 0) {
          const c = allPeople.find(p => p.id === formData.childrenIds[0]);
          if (c) title = `Aggiungi genitore di ${c.firstName}`;
      }
      subtitle = "Inserisci i dati della nuova persona";
  }

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white shadow-2xl transform transition-transform duration-300 overflow-y-auto z-50 border-l border-gray-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 border-b pb-4">
          <div>
              <h2 className="text-xl font-serif font-bold text-gray-800">{title}</h2>
              {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 bg-gray-100 p-2 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          
          {/* Gender Selection */}
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sesso</label>
              <div className="grid grid-cols-3 gap-2">
                  <button 
                    type="button"
                    onClick={() => handleGenderChange(Gender.Male)}
                    className={`flex flex-col items-center justify-center p-3 rounded border ${formData.gender === Gender.Male ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                      <UserIcon size={20} className="mb-1" />
                      <span className="text-xs font-medium">Maschio</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleGenderChange(Gender.Female)}
                    className={`flex flex-col items-center justify-center p-3 rounded border ${formData.gender === Gender.Female ? 'bg-pink-50 border-pink-500 text-pink-700' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                      <UserIcon size={20} className="mb-1" />
                      <span className="text-xs font-medium">Femmina</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleGenderChange(Gender.Unknown)}
                    className={`flex flex-col items-center justify-center p-3 rounded border ${formData.gender === Gender.Unknown ? 'bg-gray-100 border-gray-400 text-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                      <UserIcon size={20} className="mb-1" />
                      <span className="text-xs font-medium">Sconosciuto</span>
                  </button>
              </div>
          </div>

          {/* Names */}
          <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs uppercase text-gray-500 font-semibold mb-1">Nome (e secondi nomi)</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs uppercase text-gray-500 font-semibold mb-1">Cognome</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs uppercase text-gray-500 font-semibold mb-1">Prefisso</label>
                    <input
                        type="text"
                        name="prefix"
                        value={formData.prefix || ''}
                        onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                        placeholder="es. Dr."
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-gray-500 font-semibold mb-1">Suffisso</label>
                    <input
                        type="text"
                        name="suffix"
                        value={formData.suffix || ''}
                        onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                        placeholder="es. Jr."
                    />
                  </div>
              </div>
          </div>

          {/* Birth Data */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
             <h3 className="text-sm font-bold text-slate-700 mb-3">Nascita</h3>
             <div className="mb-3">
                <label className="block text-xs text-slate-500 mb-1">Data (Giorno - Mese - Anno)</label>
                <div className="grid grid-cols-3 gap-2">
                    <input
                        type="text"
                        placeholder="GG"
                        value={birthDateParts.day}
                        onChange={(e) => setBirthDateParts({...birthDateParts, day: e.target.value})}
                        className="border border-gray-300 rounded p-2 text-center text-sm"
                    />
                    <input
                        type="text"
                        placeholder="Mese"
                        value={birthDateParts.month}
                        onChange={(e) => setBirthDateParts({...birthDateParts, month: e.target.value})}
                        className="border border-gray-300 rounded p-2 text-center text-sm"
                    />
                    <input
                        type="text"
                        placeholder="AAAA"
                        value={birthDateParts.year}
                        onChange={(e) => setBirthDateParts({...birthDateParts, year: e.target.value})}
                        className="border border-gray-300 rounded p-2 text-center text-sm"
                    />
                </div>
             </div>
             <div>
                <label className="block text-xs text-slate-500 mb-1">Luogo di Nascita</label>
                <input
                    type="text"
                    name="birthPlace"
                    value={formData.birthPlace || ''}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded p-2 text-sm"
                />
             </div>
          </div>

          {/* Living Status & Death Data */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="isLiving" 
                        checked={formData.isLiving === true} 
                        onChange={() => handleLivingChange(true)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Vivente</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="isLiving" 
                        checked={formData.isLiving === false} 
                        onChange={() => handleLivingChange(false)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Deceduto</span>
                  </label>
              </div>

              {formData.isLiving === false && (
                <div className="pt-2 border-t border-slate-200 animate-fadeIn">
                    <div className="mb-3">
                        <label className="block text-xs text-slate-500 mb-1">Data Morte (Giorno - Mese - Anno)</label>
                        <div className="grid grid-cols-3 gap-2">
                            <input
                                type="text"
                                placeholder="GG"
                                value={deathDateParts.day}
                                onChange={(e) => setDeathDateParts({...deathDateParts, day: e.target.value})}
                                className="border border-gray-300 rounded p-2 text-center text-sm"
                            />
                            <input
                                type="text"
                                placeholder="Mese"
                                value={deathDateParts.month}
                                onChange={(e) => setDeathDateParts({...deathDateParts, month: e.target.value})}
                                className="border border-gray-300 rounded p-2 text-center text-sm"
                            />
                            <input
                                type="text"
                                placeholder="AAAA"
                                value={deathDateParts.year}
                                onChange={(e) => setDeathDateParts({...deathDateParts, year: e.target.value})}
                                className="border border-gray-300 rounded p-2 text-center text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Luogo di Morte</label>
                        <input
                            type="text"
                            name="deathPlace"
                            value={formData.deathPlace || ''}
                            onChange={handleChange}
                            className="block w-full border border-gray-300 rounded p-2 text-sm"
                        />
                    </div>
                </div>
              )}
          </div>

          {/* Contact & Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Indirizzo Email</label>
            <input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="nome@esempio.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Note</label>
            <textarea
              name="notes"
              rows={3}
              value={formData.notes || ''}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
            />
          </div>

          <div className="pt-4 flex gap-3 sticky bottom-0 bg-white pb-2 border-t">
             <button
                onClick={handleSave}
                className="flex-1 flex justify-center items-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg shadow hover:bg-blue-700 transition font-medium"
             >
                <Save size={18} /> Salva Dati
             </button>
             {isAdmin && (
                <button
                    onClick={() => {
                        if(confirm('Sei sicuro di voler eliminare questa persona e le sue relazioni?')) {
                            onDelete(formData.id);
                        }
                    }}
                    className="flex-shrink-0 flex justify-center items-center bg-red-100 text-red-600 p-3 rounded-lg hover:bg-red-200 transition"
                    title="Elimina persona"
                >
                    <Trash2 size={18} />
                </button>
             )}
          </div>
        </div>

        {/* Existing Relations Section - useful for navigation */}
        <div className="mt-8 border-t pt-6 bg-gray-50 -mx-6 px-6 pb-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Relazioni Rapide</h3>
          
          <div className="space-y-2">
             <button
                onClick={() => onAddRelative('parent', formData.id)}
                className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded hover:border-blue-300 transition text-left"
             >
                <span className="text-sm font-medium text-gray-700">Aggiungi Genitore</span>
                <UserPlus size={16} className="text-blue-500" />
             </button>
             <button
                onClick={() => onAddRelative('spouse', formData.id)}
                className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded hover:border-blue-300 transition text-left"
             >
                <span className="text-sm font-medium text-gray-700">Aggiungi Coniuge</span>
                <UserPlus size={16} className="text-blue-500" />
             </button>
             <button
                onClick={() => onAddRelative('child', formData.id)}
                className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded hover:border-blue-300 transition text-left"
             >
                <span className="text-sm font-medium text-gray-700">Aggiungi Figlio/a</span>
                <UserPlus size={16} className="text-blue-500" />
             </button>
          </div>
        </div>
        
        <div className="mt-4 text-xs text-gray-300 text-center">
            ID: {formData.id}
        </div>
      </div>
    </div>
  );
};