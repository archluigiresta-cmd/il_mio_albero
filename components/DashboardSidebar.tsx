import React from 'react';
import { User } from '../types';
import { 
  LayoutDashboard, 
  Network, 
  UserPlus, 
  Users, 
  Settings, 
  LogOut, 
  TreeDeciduous,
  ShieldCheck,
  FileText
} from 'lucide-react';

interface SidebarProps {
  user: User;
  currentView: string;
  onChangeView: (view: string) => void;
  onLogout: () => void;
}

export const DashboardSidebar: React.FC<SidebarProps> = ({ user, currentView, onChangeView, onLogout }) => {
  
  const menuItems = [
    { id: 'tree', label: 'Albero Genealogico', icon: Network },
    // { id: 'list', label: 'Elenco Persone', icon: FileText }, // Placeholder per implementazioni future
  ];

  if (user.role === 'admin') {
    menuItems.push({ id: 'add_person', label: 'Nuova Persona', icon: UserPlus });
    menuItems.push({ id: 'admin_users', label: 'Gestione Utenti', icon: Users });
    menuItems.push({ id: 'admin_settings', label: 'Impostazioni & Dati', icon: Settings });
  }

  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 shadow-xl shrink-0">
      {/* Logo Area */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-800 text-white">
        <div className="bg-emerald-600 p-2 rounded-lg">
          <TreeDeciduous size={24} className="text-white" />
        </div>
        <div>
          <h1 className="font-serif font-bold text-lg tracking-wide">Casa Resta</h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Genealogia</p>
        </div>
      </div>

      {/* User Info */}
      <div className="p-6 bg-slate-800/50 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 font-bold border border-slate-600">
             {user.fullName.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user.fullName}</p>
            <div className="flex items-center gap-1 text-xs text-emerald-500">
               <ShieldCheck size={10} />
               <span className="capitalize">{user.role === 'admin' ? 'Amministratore' : 'Ospite'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Navigazione</p>
        
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              currentView === item.id 
                ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-600/20' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
        >
          <LogOut size={16} />
          Disconnetti
        </button>
        <div className="mt-4 text-center text-[10px] text-slate-600">
            v1.2.0 &bull; Famiglia Resta
        </div>
      </div>
    </div>
  );
};