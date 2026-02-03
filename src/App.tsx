import React, { useState, useEffect } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { 
  LayoutDashboard, Map as MapIcon, Truck, Users, Menu, X, 
  Plus, Receipt, LogOut, Loader2, UserPlus 
} from 'lucide-react';

import { Client, Trip, User, TripStatus } from './types';
import { Dashboard } from '../components/Dashboard';
import { StrategicMap } from '../components/StrategicMap';
import { TripManager } from '../components/TripManager';
import { ClientDirectory } from '../components/ClientDirectory';
import { ClientForm } from '../components/ClientForm';
import { BillingView } from '../components/BillingView';
import { Login } from '../components/Login';

import { fetchLogisticsData, saveClientToSheet, saveTripToSheet } from '../services/api';

// Definimos las vistas disponibles
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
  
  // Datos
  const [clients, setClients] = useState<Client[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 1. LÓGICA DE SESIÓN (SessionStorage + Expiración) ---
  useEffect(() => {
    const checkSession = () => {
      const sessionData = sessionStorage.getItem('gdc_session');
      if (sessionData) {
        const { user, timestamp } = JSON.parse(sessionData);
        const now = Date.now();
        const TWO_HOURS = 2 * 60 * 60 * 1000;

        // Si la sesión es válida (menos de 2 horas)
        if (now - timestamp < TWO_HOURS) {
          setUser(user);
        } else {
          // Sesión expirada
          sessionStorage.removeItem('gdc_session');
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
    }
    setLoading(false);
  };

  const handleLogin = (u: User) => {
    setUser(u);
    // Guardamos en sessionStorage (Se borra al cerrar pestaña, persiste al refresh)
    // Agregamos timestamp para expirar por inactividad si quisieras
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

  // --- FUNCIONES DE AGREGADO (Pasadas como props) ---
  const handleAddClient = async (client: Client) => {
    setLoading(true);
    const success = await saveClientToSheet(client);
    if (success) {
      alert("Cliente registrado correctamente");
      await loadData(); // Recargar datos
      setView(View.DIRECTORY); // Ir al directorio
    } else {
      alert("Error al guardar cliente");
    }
    setLoading(false);
  };

  const handleAddTrip = async (trip: Trip) => {
     // Esta lógica se maneja dentro de TripManager ahora, 
     // pero mantenemos la prop si se requiere refrescar globalmente
     await loadData();
  };


  if (!user) return <Login onLogin={handleLogin} />;
  
  if (loading && !clients.length) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white">
            <Loader2 className="animate-spin w-10 h-10 mb-4 text-blue-500" /> 
            <p>Conectando con GDC Cloud...</p>
        </div>
      );
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 transition-all duration-300 flex flex-col z-20 shadow-xl`}>
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <div className="flex items-center space-x-2 animate-fade-in">
                <Truck className="text-blue-500 w-8 h-8" />
                <span className="text-white font-black text-xl tracking-tighter">GDC <span className="text-blue-500">SAS</span></span>
            </div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-400 hover:text-white transition-colors">
            <Menu />
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SidebarItem icon={<LayoutDashboard />} label="Dashboard" active={view === View.DASHBOARD} onClick={() => setView(View.DASHBOARD)} collapsed={!isSidebarOpen} />
          <SidebarItem icon={<Truck />} label="Gestión Viajes" active={view === View.TRIPS} onClick={() => setView(View.TRIPS)} collapsed={!isSidebarOpen} />
          
          <div className="pt-4 pb-2">
            {isSidebarOpen && <p className="px-4 text-xs font-bold text-slate-500 uppercase">Clientes</p>}
          </div>
          <SidebarItem icon={<Users />} label="Directorio" active={view === View.DIRECTORY} onClick={() => setView(View.DIRECTORY)} collapsed={!isSidebarOpen} />
          {user.role === 'admin' && (
             <SidebarItem icon={<UserPlus />} label="Nuevo Cliente" active={view === View.REGISTER_CLIENT} onClick={() => setView(View.REGISTER_CLIENT)} collapsed={!isSidebarOpen} />
          )}

          <div className="pt-4 pb-2">
            {isSidebarOpen && <p className="px-4 text-xs font-bold text-slate-500 uppercase">Administración</p>}
          </div>
          <SidebarItem icon={<MapIcon />} label="Mapa Estratégico" active={view === View.MAP} onClick={() => setView(View.MAP)} collapsed={!isSidebarOpen} />
          <SidebarItem icon={<Receipt />} label="Facturación" active={view === View.BILLING} onClick={() => setView(View.BILLING)} collapsed={!isSidebarOpen} />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center w-full p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
            <LogOut className="w-5 h-5 mr-3" /> 
            {isSidebarOpen && <span className="font-bold">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <h1 className="text-xl font-bold text-slate-800 uppercase tracking-widest flex items-center">
            {view}
          </h1>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-slate-700">{user.nombre}</p>
              <p className="text-xs text-slate-500 capitalize">{user.role}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-200">
                {user.nombre[0]}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {view === View.DASHBOARD && <Dashboard trips={trips} clients={clients} user={user} />}
            {view === View.TRIPS && <TripManager trips={trips} clients={clients} user={user} onAddTrip={handleAddTrip} />}
            {view === View.DIRECTORY && <ClientDirectory clients={clients} trips={trips} />}
            {view === View.REGISTER_CLIENT && <ClientForm onAddClient={handleAddClient} />}
            {view === View.MAP && <StrategicMap clients={clients} trips={trips} />}
            {view === View.BILLING && <BillingView trips={trips} clients={clients} onInvoiceUploaded={() => {}} />}
          </div>
        </div>
      </main>
    </div>
  );
};

// Componente de Item de Menú
const SidebarItem = ({ icon, label, active, onClick, collapsed }: any) => (
  <button 
    onClick={onClick} 
    className={`
        flex items-center w-full p-3 rounded-xl transition-all duration-200 group
        ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
    `}
  >
    <div className={`w-6 h-6 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>{icon}</div>
    {!collapsed && <span className="ml-3 font-bold text-sm">{label}</span>}
  </button>
);

export default App;
