import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Map as MapIcon, Truck, Users, Menu, X, Plus, Receipt, LogOut, Loader2, Sparkles } from 'lucide-react';
import { Client, Trip, User, AIInsight } from './types';
import { Dashboard } from '../components/Dashboard';
import { StrategicMap } from '../components/StrategicMap';
import { TripManager } from '../components/TripManager';
import { ClientDirectory } from '../components/ClientDirectory';
import { ClientForm } from '../components/ClientForm';
import { BillingView } from '../components/BillingView';
import { Login } from '../components/Login';
import { fetchLogisticsData, loginUser, saveClientToSheet } from '../services/api';

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
  const [clients, setClients] = useState<Client[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Persistencia de sesión al cargar
  useEffect(() => {
    const savedUser = localStorage.getItem('gdc_user');
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
    localStorage.setItem('gdc_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('gdc_user');
  };

  if (!user) return <Login onLogin={handleLogin} />;
  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin mr-2" /> Sincronizando datos...</div>;

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* Sidebar y Header original aquí (omito por espacio pero mantén el tuyo) */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          {view === View.DASHBOARD && <Dashboard trips={trips} clients={clients} user={user} />}
          {view === View.TRIPS && <TripManager trips={trips} clients={clients} user={user} onAddTrip={() => {}} />}
          {view === View.DIRECTORY && <ClientDirectory clients={clients} trips={trips} />}
          {view === View.REGISTER_CLIENT && <div className="max-w-4xl mx-auto"><ClientForm onAddClient={async (c) => { await saveClientToSheet(c); window.location.reload(); }} /></div>}
          {view === View.MAP && <StrategicMap clients={clients} trips={trips} />}
          {view === View.BILLING && <BillingView trips={trips} clients={clients} onInvoiceUploaded={() => {}} />}
        </div>
      </main>
    </div>
  );
};

export default App;
