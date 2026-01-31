import React, { useState, useEffect } from 'react';
// 1. IMPORTANTE: Cambiamos BrowserRouter por HashRouter para GitHub Pages
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Truck, 
  Users, 
  Menu, 
  X,
  Sparkles,
  Receipt,
  LogOut,
  Loader2
} from 'lucide-react';

import { Client, Trip, AIInsight, TripStatus, User } from './types';
// Mantenemos los mocks solo como fallback de seguridad
import { MOCK_CLIENTS, MOCK_TRIPS } from './constants';

import { Dashboard } from './components/Dashboard';
import { StrategicMap } from './components/StrategicMap';
import { TripManager } from './components/TripManager';
import { ClientForm } from './components/ClientForm';
import { ClientDirectory } from './components/ClientDirectory';
import { BillingView } from './components/BillingView';
import { Login } from './components/Login';

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
  const [isAiLoading, setIsAiLoading] = useState(false);

  // 2. Lógica de carga de datos REALES desde Google Sheets
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const data = await fetchLogisticsData();
        if (data) {
          setClients(data.clients);
          setTrips(data.trips);
        } else {
          // Si no hay API configurada, cargamos mocks para que no se vea vacío en desarrollo
          console.warn("Usando datos de prueba (Mocks)");
          setClients(MOCK_CLIENTS);
          setTrips(MOCK_TRIPS);
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // 3. Generación de Insights con Gemini
  const refreshInsights = async () => {
    if (clients.length > 0 && trips.length > 0) {
      setIsAiLoading(true);
      const newInsights = await generateLogisticsInsights(trips, clients);
      setInsights(newInsights);
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      refreshInsights();
    }
  }, [loading, user]);

  // Handlers de datos
  const handleAddTrip = async (trip: Trip) => {
    const success = await saveTripToSheet(trip);
    if (success) {
      setTrips(prev => [trip, ...prev]);
      refreshInsights();
    }
  };

  const handleAddClient = async (client: Client) => {
    const success = await saveClientToSheet(client);
    if (success) {
      setClients(prev => [...prev, client]);
    }
  };

  const handleInvoiceUploaded = (tripId: string, url: string) => {
    setTrips(prev => prev.map(t => 
      t.id === tripId ? { ...t, facturaUrl: url, estado: TripStatus.CLOSED } : t
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-300 font-medium">Cargando sistema GDC...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex">
        {/* Sidebar */}
        <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 transition-all duration-300 flex flex-col z-20`}>
          <div className="p-6 flex items-center justify-between">
            {isSidebarOpen && <h1 className="text-white font-bold text-xl tracking-tight">GDC Logistics</h1>}
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-400 hover:text-white">
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={view === View.DASHBOARD} onClick={() => setView(View.DASHBOARD)} collapsed={!isSidebarOpen} />
            <SidebarItem icon={<Truck size={20} />} label="Gestión Viajes" active={view === View.TRIPS} onClick={() => setView(View.TRIPS)} collapsed={!isSidebarOpen} />
            <SidebarItem icon={<MapIcon size={20} />} label="Mapa Estratégico" active={view === View.MAP} onClick={() => setView(View.MAP)} collapsed={!isSidebarOpen} />
            
            {user.role === 'admin' && (
              <>
                <div className={`pt-4 pb-2 ${isSidebarOpen ? 'px-3' : 'text-center'}`}>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{isSidebarOpen ? 'Administración' : 'Adm'}</p>
                </div>
                <SidebarItem icon={<Receipt size={20} />} label="Facturación" active={view === View.BILLING} onClick={() => setView(View.BILLING)} collapsed={!isSidebarOpen} />
                <SidebarItem icon={<Users size={20} />} label="Clientes" active={view === View.DIRECTORY} onClick={() => setView(View.DIRECTORY)} collapsed={!isSidebarOpen} />
                <SidebarItem icon={<Users size={20} />} label="Nuevo Cliente" active={view === View.CLIENTS} onClick={() => setView(View.CLIENTS)} collapsed={!isSidebarOpen} />
              </>
            )}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <button onClick={() => setUser(null)} className="flex items-center w-full p-3 text-slate-400 hover:text-red-400 transition-colors">
              <LogOut size={20} />
              {isSidebarOpen && <span className="ml-3 font-medium">Cerrar Sesión</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8">
            <h2 className="text-slate-800 font-semibold text-lg">{view}</h2>
            <div className="flex items-center space-x-4">
              {isAiLoading && <div className="flex items-center text-xs text-blue-600 animate-pulse"><Sparkles className="w-3 h-3 mr-1" /> Analizando...</div>}
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">{user.nombre}</p>
                <p className="text-xs text-slate-500 capitalize">{user.role}</p>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-7xl mx-auto">
              {view === View.DASHBOARD && <Dashboard trips={trips} clients={clients} user={user} />}
              {view === View.TRIPS && <TripManager trips={trips} clients={clients} onAddTrip={handleAddTrip} user={user} />}
              {view === View.BILLING && user.role === 'admin' && <BillingView trips={trips} clients={clients} onInvoiceUploaded={handleInvoiceUploaded} />}
              {view === View.DIRECTORY && user.role === 'admin' && <ClientDirectory clients={clients} trips={trips} />}
              {view === View.MAP && <StrategicMap clients={clients} trips={trips} />}
              {view === View.CLIENTS && user.role === 'admin' && <ClientForm onAddClient={handleAddClient} />}
            </div>
          </div>
        </main>
      </div>
    </Router>
  );
};

// Componente auxiliar para los items del menú
const SidebarItem = ({ icon, label, active, onClick, collapsed }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center w-full p-3 rounded-lg transition-all ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
  >
    <div className="flex-shrink-0">{icon}</div>
    {!collapsed && <span className="ml-3 font-medium">{label}</span>}
  </button>
);

export default App;
