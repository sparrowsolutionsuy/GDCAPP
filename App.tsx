import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Truck, 
  Users, 
  Menu, 
  X,
  Sparkles,
  ChevronRight,
  BookOpen,
  Maximize,
  Minimize,
  Receipt,
  LogOut
} from 'lucide-react';
import { Client, Trip, AIInsight, TripStatus, User } from './types';
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
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  
  // App State
  const [view, setView] = useState<View>(View.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Data State
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS); 
  const [trips, setTrips] = useState<Trip[]>(MOCK_TRIPS);
  const [loading, setLoading] = useState(false);
  
  // AI State
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);

  // Check LocalStorage on Mount
  useEffect(() => {
    const storedUser = localStorage.getItem('gdc_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Load Data from Google Sheets (Only if logged in)
  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
      setLoading(true);
      const data = await fetchLogisticsData();
      if (data) {
        setClients(data.clients);
        setTrips(data.trips);
      }
      setLoading(false);
    };
    loadData();
  }, [user]);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('gdc_user', JSON.stringify(loggedInUser));
    setView(View.DASHBOARD); // Reset view on login
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('gdc_user');
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleAddTrip = async (newTrip: Trip) => {
    setTrips(prev => [newTrip, ...prev]);
    await saveTripToSheet(newTrip);
  };

  const handleAddClient = async (newClient: Client) => {
    setClients(prev => [...prev, newClient]);
    await saveClientToSheet(newClient);
  };

  const handleInvoiceUploaded = (tripId: string, url: string) => {
    setTrips(prev => prev.map(t => 
      t.id === tripId ? { ...t, estado: TripStatus.CLOSED, facturaUrl: url } : t
    ));
  };

  const fetchInsights = async () => {
    setLoadingAI(true);
    const results = await generateLogisticsInsights(trips, clients);
    setInsights(results);
    setLoadingAI(false);
  };

  // If not logged in, show Login Screen
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // --- Main App Layout ---
  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-64'} lg:relative lg:translate-x-0 flex flex-col`}
      >
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">GDC Logistics</span>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden text-slate-400">
            <X />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* General Access Items */}
          <SidebarItem 
            icon={<LayoutDashboard />} 
            label="Dashboard" 
            active={view === View.DASHBOARD} 
            onClick={() => setView(View.DASHBOARD)} 
          />
          <SidebarItem 
            icon={<Truck />} 
            label="Gestión de Viajes" 
            active={view === View.TRIPS} 
            onClick={() => setView(View.TRIPS)} 
          />
          <SidebarItem 
            icon={<MapIcon />} 
            label="Mapa Estratégico" 
            active={view === View.MAP} 
            onClick={() => setView(View.MAP)} 
          />
          
          {/* Admin Only Items */}
          {user.role === 'admin' && (
            <>
              <div className="pt-4 pb-2">
                <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Administración</p>
              </div>
              <SidebarItem 
                icon={<Receipt />} 
                label="Facturación" 
                active={view === View.BILLING} 
                onClick={() => setView(View.BILLING)} 
              />
              <SidebarItem 
                icon={<BookOpen />} 
                label="Directorio Clientes" 
                active={view === View.DIRECTORY} 
                onClick={() => setView(View.DIRECTORY)} 
              />
              <SidebarItem 
                icon={<Users />} 
                label="Registro Clientes" 
                active={view === View.CLIENTS} 
                onClick={() => setView(View.CLIENTS)} 
              />
            </>
          )}
        </nav>

        {/* AI Insight Teaser */}
        <div className="p-4 bg-slate-800 m-4 rounded-xl border border-slate-700">
          <div className="flex items-center space-x-2 mb-2 text-blue-400">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">IA Logística</span>
          </div>
          <p className="text-xs text-slate-300 mb-3">
            Optimiza tus rutas y retornos con Gemini.
          </p>
          <button 
            onClick={fetchInsights}
            disabled={loadingAI}
            className="w-full bg-blue-600 hover:bg-blue-500 text-xs text-white py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loadingAI ? 'Analizando...' : 'Generar Reporte'}
          </button>
        </div>

        {/* User Profile / Logout */}
        <div className="p-4 border-t border-slate-700 bg-slate-900">
          <div className="flex items-center">
            <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
              {user.nombre.charAt(0)}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user.nombre}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="ml-auto p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-full flex flex-col relative">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 p-4 lg:p-6 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center">
            <button onClick={toggleSidebar} className="lg:hidden mr-4 text-slate-600">
              <Menu />
            </button>
            <h1 className="text-2xl font-bold text-slate-800">{view}</h1>
            {loading && <span className="ml-4 text-sm text-blue-600 animate-pulse">Sincronizando con Google Sheets...</span>}
          </div>
          <div className="flex items-center space-x-4">
             <button 
                onClick={toggleFullScreen} 
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors hidden md:block"
                title="Pantalla Completa"
             >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
             </button>
          </div>
        </header>

        {/* AI Insights Panel */}
        {insights.length > 0 && (
          <div className="bg-indigo-50 border-b border-indigo-100 p-4 animate-fade-in">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center mb-3">
                <Sparkles className="w-5 h-5 text-indigo-600 mr-2" />
                <h3 className="font-bold text-indigo-900">Sugerencias de Optimización (Gemini)</h3>
                <button onClick={() => setInsights([])} className="ml-auto text-indigo-400 hover:text-indigo-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {insights.map((insight, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg shadow-sm border border-indigo-100 text-sm">
                    <p className="font-bold text-slate-800 mb-1">{insight.title}</p>
                    <p className="text-slate-600">{insight.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* View Content */}
        <div className="p-4 lg:p-6 flex-1">
          <div className="w-full">
            {view === View.DASHBOARD && <Dashboard trips={trips} clients={clients} user={user} />}
            {view === View.TRIPS && <TripManager trips={trips} clients={clients} onAddTrip={handleAddTrip} user={user} />}
            {/* Security Check for Admin-Only Views */}
            {view === View.BILLING && user.role === 'admin' && <BillingView trips={trips} clients={clients} onInvoiceUploaded={handleInvoiceUploaded} />}
            {view === View.DIRECTORY && user.role === 'admin' && <ClientDirectory clients={clients} trips={trips} />}
            {view === View.MAP && <StrategicMap clients={clients} trips={trips} />}
            {view === View.CLIENTS && user.role === 'admin' && <ClientForm onAddClient={handleAddClient} />}
            
            {/* Fallback for unauthorized access via state manipulation */}
            {['Facturación', 'Directorio Clientes', 'Registro Clientes'].includes(view) && user.role !== 'admin' && (
              <div className="flex flex-col items-center justify-center h-96 text-slate-400">
                <p>No tiene permisos para ver esta sección.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex items-center w-full p-3 rounded-lg transition-all duration-200 group ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
  >
    <div className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-white'} mr-3`}>
      {icon}
    </div>
    <span className="font-medium text-sm">{label}</span>
    {active && <ChevronRight className="w-4 h-4 ml-auto" />}
  </button>
);

export default App;