import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { getStoredUsers } from '../services/storageService';
import { APP_VERSION } from '../constants';
import { 
  Network, 
  UserPlus, 
  Users, 
  Settings, 
  LogOut, 
  TreeDeciduous,
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';

interface SidebarProps {
  user: User;
  currentView: string;
  onChangeView: (view: string) => void;
  onLogout: () => void;
}

export const DashboardSidebar: React.FC<SidebarProps> = ({ user, currentView, onChangeView, onLogout }) => {
  const [pendingCount, setPendingCount] = useState(0);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (user.role !== 'admin') return;
    const checkPending = () => {
        const users = getStoredUsers();
        const pending = users.filter(u => !u.isApproved && u.role !== 'admin').length;
        setPendingCount(pending);
    };
    checkPending();
    const interval = setInterval(checkPending, 3000);
    return () => clearInterval(interval);
  }, [user.role]);

  const menuItems: { id: string; label: string; icon: any; badge?: number }[] = [
    { id: 'tree', label: 'Albero Genealogico', icon: Network },
  ];

  if (user.role === 'admin') {
    menuItems.push({ id: 'add_person', label: 'Nuova Persona', icon: UserPlus });
    menuItems.push({ 
        id: 'admin_users', 
        label: 'Gestione Utenti', 
        icon: Users,
        badge: pendingCount > 0 ? pendingCount : undefined
    });
    menuItems.push({ id: 'admin_settings', label: 'Impostazioni & Dati', icon: Settings });
  }

  const handleNavClick = (id: string) => {
      onChangeView(id);
      setIsMobileOpen(false);
  };

  return (
    <>
      {/* MOBILE TRIGGER */}
      <button 
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 right-4 z-40 p-2 bg-slate-900 text-white rounded-lg shadow-lg md:hidden"
      >
          <Menu size={24} />
      </button>

      {/* OVERLAY for Mobile */}
      {isMobileOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* SIDEBAR CONTAINER */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 shadow-2xl transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:w-64 md:shadow-xl
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Mobile Close Button */}
        <button 
            onClick={() => setIsMobileOpen(false)}
            className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white md:hidden"
        >
            <X size={24} />
        </button>

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
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentView === item.id 
                    ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-600/20' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
            >
                <div className="flex items-center gap-3">
                    <item.icon size={18} />
                    {item.label}
                </div>
                {item.badge && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                        {item.badge}
                    </span>
                )}
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
                v{APP_VERSION} &bull; Famiglia Resta
            </div>
        </div>
      </div>
    </>
  );
};