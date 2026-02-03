import React, { useState, useEffect } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { 
  LayoutDashboard, Map as MapIcon, Truck, Users, Menu, X, 
  Plus, Receipt, LogOut, Loader2, Sparkles 
} from 'lucide-react';

import { Client, Trip, User, TripStatus } from './types';
import { Dashboard } from '../components/Dashboard';
import { StrategicMap } from '../components/StrategicMap';
import { TripManager } from '../components/TripManager';
import { ClientDirectory } from '../components/ClientDirectory';
import { ClientForm } from '../components/ClientForm';
import { BillingView } from '../components/BillingView';
import { Login } from '../components/Login';

import { fetchLogisticsData, saveTripToSheet, saveClientToSheet } from '../services/api';

enum View {
  DASHBOARD = 'Dashboard',
  TRIPS = 'Gestión Viajes',
  DIRECTORY = 'Directorio Clientes',
  REGISTER_CLIENT = 'Nuevo Cliente',
  MAP = 'Mapa Estratégico',
  BILLING = 'Facturación'
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>(View.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Recuperar sesión al cargar
    const savedUser = localStorage.getItem('gdc_user_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchLogisticsData();
    if (data) {
      setClients(data.clients);
      setTrips(data.trips);
    }
    setLoading(false);
  };

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('gdc_user_session', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('gdc_user_session');
  };

  if (!user) return <Login onLogin={handleLogin} />;
  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin mr-2" /> Sincronizando con GDC Cloud...</div>;

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 transition-all duration-300 flex flex-col z-20`}>
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && <div className="flex items-center space-x-2"><Truck className="text-blue-500 w-8 h-8" /><span className="text-white font-black text-xl tracking-tighter">GDC <span className="text-blue-500">SAS</span></span></div>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-400 hover:text-white"><Menu /></button>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SidebarItem icon={<LayoutDashboard />} label="Dashboard" active={view === View.DASHBOARD} onClick={() => setView(View.DASHBOARD)} collapsed={!isSidebarOpen} />
          <SidebarItem icon={<Truck />} label="Gestión Viajes" active={view === View.TRIPS} onClick={() => setView(View.TRIPS)} collapsed={!isSidebarOpen} />
          <SidebarItem icon={<Users />} label="Directorio" active={view === View.DIRECTORY} onClick={() => setView(View.DIRECTORY)} collapsed={!isSidebarOpen} />
          <SidebarItem icon={<MapIcon />} label="Mapa" active={view === View.MAP} onClick={() => setView(View.MAP)} collapsed={!isSidebarOpen} />
          <SidebarItem icon={<Receipt />} label="Facturación" active={view === View.BILLING} onClick={() => setView(View.BILLING)} collapsed={!isSidebarOpen} />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center w-full p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
            <LogOut className="w-5 h-5 mr-3" /> {isSidebarOpen && <span className="font-bold">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
          <h1 className="text-xl font-bold text-slate-800 uppercase tracking-widest">{view}</h1>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-700">{user.nombre}</p>
              <p className="text-xs text-slate-500 capitalize">{user.role}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">{user.nombre[0]}</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {view === View.DASHBOARD && <Dashboard trips={trips} clients={clients} user={user} />}
          {view === View.TRIPS && <TripManager trips={trips} clients={clients} user={user} onAddTrip={() => {}} />}
          {view === View.DIRECTORY && <ClientDirectory clients={clients} trips={trips} />}
          {view === View.MAP && <StrategicMap clients={clients} trips={trips} />}
          {view === View.BILLING && <BillingView trips={trips} clients={clients} onInvoiceUploaded={() => {}} />}
        </div>
      </main>
    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick, collapsed }: any) => (
  <button onClick={onClick} className={`flex items-center w-full p-3 rounded-xl transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800'}`}>
    <div className="w-6 h-6">{icon}</div>
    {!collapsed && <span className="ml-3 font-bold text-sm">{label}</span>}
  </button>
);

export default App;
