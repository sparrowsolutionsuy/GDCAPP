import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Map as MapIcon, Truck, Users, Menu, X,
  Plus, Receipt, LogOut, Loader2, Sparkles
} from 'lucide-react';

// Tipos
import { Client, Trip, User, AIInsight } from './types';

// Componentes
import { Dashboard } from '../components/Dashboard';
import { StrategicMap } from '../components/StrategicMap';
import { TripManager } from '../components/TripManager';
import { ClientDirectory } from '../components/ClientDirectory';
import { ClientForm } from '../components/ClientForm';
import { BillingView } from '../components/BillingView';
import { Login } from '../components/Login';

// Servicios
import { fetchLogisticsData, loginUser, saveClientToSheet } from '../services/api';
import { generateLogisticsInsights } from '../services/geminiService';

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
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);

  // Función para cargar/recargar datos
  const loadData = async () => {
    try {
      const data = await fetchLogisticsData();
      if (data) {
        setClients(data.clients);
        setTrips(data.trips);
        
        // Activar Gemini si hay datos y API KEY configurada
        if (data.trips.length > 0) {
          const aiSuggestions = await generateLogisticsInsights(data.trips, data.clients);
          setInsights(aiSuggestions);
        }
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    }
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      loadData().finally(() => setLoading(false));
    }
  }, [user]);

  // FUNCIÓN CRÍTICA: Aquí es donde realmente se guarda el cliente
  const handleRegisterClient = async (newClient: Client) => {
    setLoading(true);
    const success = await saveClientToSheet(newClient);
    
    if (success) {
      alert("✅ Cliente registrado exitosamente en Google Sheets");
      await loadData(); // Recarga la lista para que aparezca el nuevo
      setView(View.DIRECTORY); // Te lleva a ver la lista
    } else {
      alert("❌ Error al guardar: Revisa la conexión con el Sheets");
    }
    setLoading(false);
  };

  if (!user) return <Login onLogin={setUser} />;

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={48} />
          <p className="text-white">Procesando con GDC Logistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900">
      {/* SIDEBAR */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col z-20`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          {isSidebarOpen && <h1 className="font-bold text-xl text-blue-400">GDC GESTIÓN</h1>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-slate-800 rounded">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <SidebarItem icon={<LayoutDashboard size={20}/>} label="Dashboard" active={view === View.DASHBOARD} onClick={() => setView(View.DASHBOARD)} collapsed={!isSidebarOpen} />
          <SidebarItem icon={<Truck size={20}/>} label="Viajes" active={view === View.TRIPS} onClick={() => setView(View.TRIPS)} collapsed={!isSidebarOpen} />
          
          {user.role === 'admin' && (
            <>
              <div className="text-[10px] font-bold text-slate-500 uppercase mt-6 mb-2 ml-2">Admin</div>
              <SidebarItem icon={<Users size={20}/>} label="Directorio" active={view === View.DIRECTORY} onClick={() => setView(View.DIRECTORY)} collapsed={!isSidebarOpen} />
              <SidebarItem icon={<Plus size={20}/>} label="Nuevo Cliente" active={view === View.REGISTER_CLIENT} onClick={() => setView(View.REGISTER_CLIENT)} collapsed={!isSidebarOpen} />
              <SidebarItem icon={<Receipt size={20}/>} label="Facturación" active={view === View.BILLING} onClick={() => setView(View.BILLING)} collapsed={!isSidebarOpen} />
            </>
          )}
          
          <SidebarItem icon={<MapIcon size={20}/>} label="Mapa" active={view === View.MAP} onClick={() => setView(View.MAP)} collapsed={!isSidebarOpen} />
        </nav>

        <button onClick={() => { localStorage.clear(); setUser(null); }} className="p-6 text-slate-400 hover:text-red-400 flex items-center border-t border-slate-800">
          <LogOut size={20} /> {isSidebarOpen && <span className="ml-3 font-medium">Salir</span>}
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b h-16 flex items-center px-8 justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <h2 className="text-slate-800 font-bold text-lg">{view}</h2>
            {insights.length > 0 && <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">IA ACTIVA</span>}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-bold leading-none">{user.nombre}</p>
              <p className="text-blue-600 font-bold uppercase text-[10px] tracking-widest">{user.role}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold uppercase">
              {user.nombre.charAt(0)}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          {view === View.DASHBOARD && <Dashboard trips={trips} clients={clients} user={user} insights={insights} />}
          {view === View.TRIPS && <TripManager trips={trips} clients={clients} user={user} onAddTrip={() => {}} />}
          {view === View.DIRECTORY && <ClientDirectory clients={clients} />}
          
          {/* CORRECCIÓN AQUÍ: Usamos onAddClient (que es lo que pide el formulario) */}
          {view === View.REGISTER_CLIENT && (
            <div className="max-w-4xl mx-auto">
              <ClientForm onAddClient={handleRegisterClient} />
            </div>
          )}
          
          {view === View.MAP && <StrategicMap clients={clients} trips={trips} />}
          {view === View.BILLING && <BillingView trips={trips} clients={clients} onInvoiceUploaded={() => {}} />}
        </div>
      </main>
    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick, collapsed }: any) => (
  <button onClick={onClick} className={`flex items-center w-full p-3 rounded-xl transition-all ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
    {icon} {!collapsed && <span className="ml-3 font-medium text-sm">{label}</span>}
  </button>
);

export default App;
