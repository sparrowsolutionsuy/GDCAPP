import React, { useState, useEffect } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { 
  LayoutDashboard, Map as MapIcon, Truck, Users, Menu, X, 
  Plus, Receipt, LogOut, Loader2, UserPlus 
} from 'lucide-react';

import { Client, Trip, User, TripStatus, AIInsight } from './types';
import { Dashboard } from '../components/Dashboard';
import { StrategicMap } from '../components/StrategicMap';
import { TripManager } from '../components/TripManager';
import { ClientDirectory } from '../components/ClientDirectory';
import { ClientForm } from '../components/ClientForm';
import { BillingView } from '../components/BillingView';
import { Login } from '../components/Login';

import { fetchLogisticsData, saveClientToSheet, saveTripToSheet } from '../services/api';
import { generateLogisticsInsights } from '../services/geminiService';

enum View {
  DASHBOARD = 'Dashboard',
  TRIPS = 'Gestión Viajes',
  DIRECTORY = 'Directorio Clientes',
  REGISTER_CLIENT = 'Registro Clientes', // Restaurado nombre original
  MAP = 'Mapa Estratégico',
  BILLING = 'Facturación'
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>(View.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Datos
  const [clients, setClients] = useState<Client[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 1. LÓGICA DE SESIÓN (SessionStorage + Expiración) ---
  useEffect(() => {
    const checkSession = () => {
      const sessionData = sessionStorage.getItem('gdc_session');
      if (sessionData) {
        const { user, timestamp } = JSON.parse(sessionData);
        const now = Date.now();
        const TWO_HOURS = 2 * 60 * 60 * 1000;

        if (now - timestamp < TWO_HOURS) {
          setUser(user);
        } else {
          sessionStorage.removeItem('gdc_session'); // Expiró
        }
      }
      loadData();
    };
    checkSession();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchLogisticsData();
    if (data) {
      setClients(data.clients || []);
      setTrips(data.trips || []);
      
      // Cargar IA solo si hay datos
      if (data.trips.length > 0) {
        generateLogisticsInsights(data.trips, data.clients).then(setInsights);
      }
    }
    setLoading(false);
  };

  const handleLogin = (u: User) => {
    setUser(u);
    sessionStorage.setItem('gdc_session', JSON.stringify({ 
      user: u, 
      timestamp: Date.now() 
    }));
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('gdc_session');
    setView(View.DASHBOARD);
  };

  // --- HANDLERS ---
  const handleAddClient = async (client: Client) => {
    setLoading(true);
    const success = await saveClientToSheet(client);
    if (success) {
      alert("✅ Cliente registrado exitosamente");
      await loadData(); 
      setView(View.DIRECTORY); 
    } else {
      alert("❌ Error al guardar cliente");
    }
    setLoading(false);
  };

  const handleAddTrip = async (trip: Trip) => {
     // La lógica de guardado está dentro de TripManager, 
     // pero aquí actualizamos el estado global si es necesario
     await loadData(); 
  };

  // Manejador para cuando se sube una factura en BillingView
  const handleInvoiceUploaded = (tripId: string, url: string) => {
     setTrips(prev => prev.map(t => t.id === tripId ? { ...t, facturaUrl: url, estado: TripStatus.CLOSED } : t));
  };

  if (!user) return <Login onLogin={handleLogin} />;
  
  if (loading && !clients.length) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white">
            <Loader2 className="animate-spin w-10 h-10 mb-4 text-blue-500" /> 
            <p>Sincronizando con GDC Cloud...</p>
        </div>
      );
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 transition-all duration-300 flex flex-col z-20 shadow-xl`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          {isSidebarOpen && (
            <div className="flex items-center space-x-2 animate-fade-in">
                <Truck className="text-blue-500 w-8 h-8" />
                <span className="text-white font-black text-xl tracking-tighter">GDC <span className="text-blue-500">Logistics</span></span>
            </div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-400 hover:text-white transition-colors">
            <Menu size={20} />
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-6 overflow-y-auto">
          <SidebarItem icon={<LayoutDashboard size={20}/>} label="Dashboard" active={view === View.DASHBOARD} onClick={() => setView(View.DASHBOARD)} collapsed={!isSidebarOpen} />
          <SidebarItem icon={<Truck size={20}/>} label="Gestión de Viajes" active={view === View.TRIPS} onClick={() => setView(View.TRIPS)} collapsed={!isSidebarOpen} />
          <SidebarItem icon={<MapIcon size={20}/>} label="Mapa Estratégico" active={view === View.MAP} onClick={() => setView(View.MAP)} collapsed={!isSidebarOpen} />
          
          <div className="pt-6 pb-2">
            {isSidebarOpen && <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Administración</p>}
          </div>
          
          <SidebarItem icon={<Receipt size={20}/>} label="Facturación" active={view === View.BILLING} onClick={() => setView(View.BILLING)} collapsed={!isSidebarOpen} />
          <SidebarItem icon={<Users size={20}/>} label="Directorio Clientes" active={view === View.DIRECTORY} onClick={() => setView(View.DIRECTORY)} collapsed={!isSidebarOpen} />
          
          {user.role === 'admin' && (
             <SidebarItem 
                icon={<UserPlus size={20}/>} 
                label="Registro Clientes" 
                active={view === View.REGISTER_CLIENT} 
                onClick={() => setView(View.REGISTER_CLIENT)} 
                collapsed={!isSidebarOpen} 
                highlight={true}
             />
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center w-full p-3 text-red-400 hover:bg-slate-800/50 rounded-xl transition-all group">
            <LogOut className="w-5 h-5 mr-3 group-hover:text-red-300" /> 
            {isSidebarOpen && <span className="font-bold">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <h1 className="text-lg font-bold text-slate-800">{view}</h1>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-slate-700">{user.nombre}</p>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">{user.role}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold shadow-md">
                {user.nombre[0]}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
            {view === View.DASHBOARD && <Dashboard trips={trips} clients={clients} user={user} />}
            {view === View.TRIPS && <TripManager trips={trips} clients={clients} user={user} onAddTrip={handleAddTrip} />}
            {view === View.DIRECTORY && <ClientDirectory clients={clients} trips={trips} />}
            {view === View.REGISTER_CLIENT && <ClientForm onAddClient={handleAddClient} />}
            {view === View.MAP && <StrategicMap clients={clients} trips={trips} />}
            {view === View.BILLING && <BillingView trips={trips} clients={clients} onInvoiceUploaded={handleInvoiceUploaded} />}
        </div>
      </main>
    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick, collapsed, highlight }: any) => (
  <button 
    onClick={onClick} 
    className={`
        flex items-center w-full p-3 rounded-xl transition-all duration-200 mb-1
        ${active 
            ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
            : highlight 
                ? 'text-blue-400 hover:bg-blue-900/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }
    `}
  >
    <div className="flex-shrink-0">{icon}</div>
    {!collapsed && <span className="ml-3 font-medium text-sm truncate">{label}</span>}
  </button>
);

export default App;
