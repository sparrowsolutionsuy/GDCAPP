import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, Map as MapIcon, Truck, Users, Menu, X,
  Sparkles, Receipt, LogOut, Loader2
} from 'lucide-react';

// Tipos y Constantes
import { Client, Trip, AIInsight, TripStatus, User } from './types';
import { MOCK_CLIENTS, MOCK_TRIPS } from './constants';

// Componentes
import { Dashboard } from './components/Dashboard';
import { StrategicMap } from './components/StrategicMap';
import { TripManager } from './components/TripManager';
import { ClientForm } from './components/ClientForm';
import { ClientDirectory } from './components/ClientDirectory';
import { BillingView } from './components/BillingView';
import { Login } from './components/Login';

// Servicios
import { generateLogisticsInsights } from './services/geminiService';
import { fetchLogisticsData, saveTripToSheet, saveClientToSheet } from './services/api';

enum View {
  DASHBOARD = 'Dashboard',
  TRIPS = 'Gestión Viajes',
  DIRECTORY = 'Directorio Clientes',
  MAP = 'Mapa Estratégico',
  CLIENTS = 'Registro Clientes',
  BILLING = 'Facturación'
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>(View.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchLogisticsData();
      if (data) {
        setClients(data.clients);
        setTrips(data.trips);
      } else {
        setClients(MOCK_CLIENTS);
        setTrips(MOCK_TRIPS);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 transition-all duration-300 flex flex-col`}>
        <div className="p-6 flex items-center justify-between text-white">
          {isSidebarOpen && <span className="font-bold text-xl text-blue-400">GDC</span>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}><Menu size={20} /></button>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={view === View.DASHBOARD} onClick={() => setView(View.DASHBOARD)} collapsed={!isSidebarOpen} />
          <SidebarItem icon={<Truck size={20} />} label="Viajes" active={view === View.TRIPS} onClick={() => setView(View.TRIPS)} collapsed={!isSidebarOpen} />
          <SidebarItem icon={<MapIcon size={20} />} label="Mapa" active={view === View.MAP} onClick={() => setView(View.MAP)} collapsed={!isSidebarOpen} />
          {user.role === 'admin' && (
            <SidebarItem icon={<Receipt size={20} />} label="Facturación" active={view === View.BILLING} onClick={() => setView(View.BILLING)} collapsed={!isSidebarOpen} />
          )}
        </nav>
        <button onClick={() => setUser(null)} className="p-6 text-slate-400 hover:text-red-400 flex items-center">
          <LogOut size={20} />
          {isSidebarOpen && <span className="ml-3">Cerrar Sesión</span>}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b h-16 flex items-center px-8 justify-between">
          <h2 className="text-slate-800 font-semibold text-lg">{view}</h2>
          <div className="text-right">
            <p className="text-sm font-bold">{user.nombre}</p>
            <p className="text-xs text-slate-500 uppercase">{user.role}</p>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          {view === View.DASHBOARD && <Dashboard trips={trips} clients={clients} user={user} />}
          {view === View.TRIPS && <TripManager trips={trips} clients={clients} onAddTrip={() => {}} user={user} />}
          {view === View.MAP && <StrategicMap clients={clients} trips={trips} />}
          {view === View.BILLING && <BillingView trips={trips} clients={clients} onInvoiceUploaded={() => {}} />}
        </div>
      </main>
    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick, collapsed }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center w-full p-3 rounded-lg transition-all ${active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
  >
    {icon}
    {!collapsed && <span className="ml-3 font-medium">{label}</span>}
  </button>
);

export default App;
