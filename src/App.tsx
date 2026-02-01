import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Map as MapIcon, Truck, Users, Menu, X,
  Receipt, LogOut, Loader2
} from 'lucide-react';

// Tipos y Datos Mock (de respaldo)
import { Client, Trip, User } from './types';
import { MOCK_CLIENTS, MOCK_TRIPS } from './constants';

// Componentes
import { Dashboard } from '../components/Dashboard';
import { StrategicMap } from '../components/StrategicMap';
import { TripManager } from '../components/TripManager';
import { ClientDirectory } from '../components/ClientDirectory';
import { BillingView } from '../components/BillingView';
import { Login } from '../components/Login';

// Servicios
import { fetchLogisticsData, loginUser } from '../services/api';

enum View {
  DASHBOARD = 'Dashboard',
  TRIPS = 'Gestión Viajes',
  DIRECTORY = 'Directorio Clientes',
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

  // Cargar datos al iniciar o al cambiar de vista
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchLogisticsData();
      if (data) {
        setClients(data.clients);
        setTrips(data.trips);
      } else {
        // Fallback a MOCKS si falla la API
        setClients(MOCK_CLIENTS);
        setTrips(MOCK_TRIPS);
      }
      setLoading(false);
    };

    if (user) loadData();
  }, [user]);

  // Pantalla de Login
  if (!user) {
    return <Login onLogin={async (u, p) => {
      const loggedUser = await loginUser(u, p);
      if (loggedUser) setUser(loggedUser);
      else alert("Credenciales incorrectas");
    }} />;
  }

  // Pantalla de Carga
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900">
      {/* SIDEBAR */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && <h1 className="font-bold text-xl tracking-tight">GDC Logistics</h1>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-slate-800 rounded">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <SidebarItem 
            icon={<LayoutDashboard size={20}/>} 
            label="Dashboard" 
            active={view === View.DASHBOARD} 
            onClick={() => setView(View.DASHBOARD)} 
            collapsed={!isSidebarOpen} 
          />
          <SidebarItem 
            icon={<Truck size={20}/>} 
            label="Viajes" 
            active={view === View.TRIPS} 
            onClick={() => setView(View.TRIPS)} 
            collapsed={!isSidebarOpen} 
          />
          
          {/* SECCIONES SOLO PARA ADMIN */}
          {user.role === 'admin' && (
            <>
              <SidebarItem 
                icon={<Users size={20}/>} 
                label="Clientes" 
                active={view === View.DIRECTORY} 
                onClick={() => setView(View.DIRECTORY)} 
                collapsed={!isSidebarOpen} 
              />
              <SidebarItem 
                icon={<Receipt size={20}/>} 
                label="Facturación" 
                active={view === View.BILLING} 
                onClick={() => setView(View.BILLING)} 
                collapsed={!isSidebarOpen} 
              />
            </>
          )}

          <SidebarItem 
            icon={<MapIcon size={20}/>} 
            label="Mapa" 
            active={view === View.MAP} 
            onClick={() => setView(View.MAP)} 
            collapsed={!isSidebarOpen} 
          />
        </nav>

        <button 
          onClick={() => {
            localStorage.clear();
            setUser(null);
          }} 
          className="p-6 text-slate-400 hover:text-red-400 flex items-center transition-colors border-t border-slate-800"
        >
          <LogOut size={20} /> 
          {isSidebarOpen && <span className="ml-3 font-medium">Cerrar Sesión</span>}
        </button>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b h-16 flex items-center px-8 justify-between shadow-sm">
          <h2 className="text-slate-800 font-semibold text-lg">{view}</h2>
          <div className="flex items-center gap-4 text-right">
            <div>
              <p className="font-bold text-slate-900 leading-none">{user.nombre}</p>
              <p className="text-blue-600 font-bold uppercase text-[10px] mt-1 tracking-widest">{user.role}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
              {user.nombre.charAt(0)}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          {view === View.DASHBOARD && <Dashboard trips={trips} clients={clients} user={user} />}
          {view === View.TRIPS && <TripManager trips={trips} clients={clients} onAddTrip={()=>{}} user={user} />}
          {view === View.DIRECTORY && <ClientDirectory clients={clients} />}
          {view === View.MAP && <StrategicMap clients={clients} trips={trips} />}
          {view === View.BILLING && <BillingView trips={trips} clients={clients} onInvoiceUploaded={()=>{}} />}
        </div>
      </main>
    </div>
  );
};

// Sub-componente para los ítems del menú
const SidebarItem = ({ icon, label, active, onClick, collapsed }: any) => (
  <button 
    onClick={onClick} 
    className={`flex items-center w-full p-3 rounded-lg transition-all ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <div className="flex items-center justify-center">
      {icon}
    </div>
    {!collapsed && <span className="ml-3 font-medium">{label}</span>}
  </button>
);

export default App;
