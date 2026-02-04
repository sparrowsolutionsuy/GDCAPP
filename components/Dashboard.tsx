import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';
import { Trip, TripStatus, Client, User } from '../src/types';
import { DEPARTAMENTOS } from '../src/constants';
import { DollarSign, Truck, TrendingUp, Filter, Calendar, Map, Clock, Package, Lock } from 'lucide-react';

interface DashboardProps {
  trips: Trip[];
  clients: Client[];
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ trips, clients, user }) => {
  const isAdmin = user.role === 'admin';
  
  // -- Filters State --
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedDept, setSelectedDept] = useState('Todos');
  const [selectedProduct, setSelectedProduct] = useState('Todos');

  // -- Unique Products for Filter --
  const products = useMemo(() => Array.from(new Set(trips.map(t => t.contenido))), [trips]);

  // -- Filter Data --
  const filteredTrips = useMemo(() => {
    return trips.filter(t => {
      // Date Filter
      if (dateRange.start && t.fecha < dateRange.start) return false;
      if (dateRange.end && t.fecha > dateRange.end) return false;
      
      // Product Filter
      if (selectedProduct !== 'Todos' && t.contenido !== selectedProduct) return false;

      // Dept Filter (Origin)
      if (selectedDept !== 'Todos' && t.origen !== selectedDept && t.destino !== selectedDept) return false;

      return true;
    });
  }, [trips, dateRange, selectedDept, selectedProduct]);

  // -- KPIs --
  const kpis = useMemo(() => {
    const closedTrips = filteredTrips.filter(t => t.estado === TripStatus.CLOSED);
    const completedTrips = filteredTrips.filter(t => t.estado === TripStatus.COMPLETED);
    const inProgressTrips = filteredTrips.filter(t => t.estado === TripStatus.IN_PROGRESS);
    const finishedTrips = [...closedTrips, ...completedTrips];
    
    // Facturación USD
    const realizedRevenue = closedTrips.reduce((acc, curr) => acc + (curr.tarifa * (curr.pesoKg / 1000)), 0);
    const pendingRevenue = completedTrips.reduce((acc, curr) => acc + (curr.tarifa * (curr.pesoKg / 1000)), 0);
    
    // Facturación UYU Estimada (Nueva Lógica Multi-moneda)
    const totalUYU = finishedTrips.reduce((acc, curr) => {
        const tripUSD = curr.tarifa * (curr.pesoKg / 1000);
        const rate = curr.tipoCambio || 42; // Fallback si es dato antiguo
        return acc + (tripUSD * rate);
    }, 0);

    const totalTripsCount = finishedTrips.length;
    const activeTripsCount = inProgressTrips.length;
    const totalKm = finishedTrips.reduce((acc, curr) => acc + curr.kmRecorridos, 0);

    return {
      totalTrips: totalTripsCount,
      activeTrips: activeTripsCount,
      totalKm: totalKm.toLocaleString(),
      realizedRevenue: realizedRevenue,
      pendingRevenue: pendingRevenue,
      totalUYU: totalUYU
    };
  }, [filteredTrips]);

  // -- Chart 1: Monthly Revenue (Area Chart) --
  const monthlyRevenue = useMemo(() => {
    const data: Record<string, number> = {};
    
    filteredTrips.filter(t => t.estado === TripStatus.CLOSED).forEach(trip => {
      const monthKey = trip.fecha.substring(0, 7); 
      const revenue = trip.tarifa * (trip.pesoKg / 1000);
      data[monthKey] = (data[monthKey] || 0) + revenue;
    });

    return Object.entries(data)
      .map(([date, val]) => ({ date, value: val }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredTrips]);

  // -- Product Performance Stats --
  const productPerformance = useMemo(() => {
    const stats: Record<string, { revenue: number, count: number, revenueUYU: number }> = {};
    
    trips.filter(t => t.estado === TripStatus.COMPLETED || t.estado === TripStatus.CLOSED).forEach(t => {
        if (!stats[t.contenido]) stats[t.contenido] = { revenue: 0, count: 0, revenueUYU: 0 };
        
        const rev = t.tarifa * (t.pesoKg / 1000);
        const rate = t.tipoCambio || 42;
        
        stats[t.contenido].revenue += rev;
        stats[t.contenido].revenueUYU += (rev * rate);
        stats[t.contenido].count++;
    });

    return Object.entries(stats).map(([name, data]) => ({
        name,
        revenue: data.revenue,
        count: data.count,
        revenueUYU: data.revenueUYU
    })).sort((a, b) => b.revenue - a.revenue);
  }, [trips]);

  // Billing Progress
  const totalPotential = kpis.realizedRevenue + kpis.pendingRevenue;
  const progressPercent = totalPotential > 0 ? (kpis.realizedRevenue / totalPotential) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Global Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
        <div className="flex items-center text-slate-500 font-medium mr-2">
          <Filter className="w-5 h-5 mr-2" />
          Filtros
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-50 rounded-lg p-1 border border-slate-300">
          <Calendar className="w-4 h-4 text-slate-400 ml-2" />
          <input 
            type="date" 
            className="bg-transparent text-sm p-1 outline-none text-slate-700"
            value={dateRange.start}
            onChange={e => setDateRange({...dateRange, start: e.target.value})}
          />
          <span className="text-slate-400">-</span>
          <input 
            type="date" 
            className="bg-transparent text-sm p-1 outline-none text-slate-700"
            value={dateRange.end}
            onChange={e => setDateRange({...dateRange, end: e.target.value})}
          />
        </div>

        <select 
          className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg p-2 outline-none"
          value={selectedDept}
          onChange={e => setSelectedDept(e.target.value)}
        >
          <option value="Todos">Todos los Departamentos</option>
          {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        
        <div className="ml-auto text-xs text-slate-400">
          Mostrando {filteredTrips.length} viajes
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Visible to All */}
        <KpiCard title="Viajes Finalizados" value={`${kpis.totalTrips}`} icon={<Truck className="w-6 h-6 text-blue-100" />} bg="bg-slate-700" />
        
        {/* NUEVO KPI PESOS URUGUAYOS */}
        {isAdmin ? (
             <KpiCard title="Facturación Est. (UYU)" value={kpis.totalUYU.toLocaleString('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 })} icon={<TrendingUp className="w-6 h-6 text-emerald-100" />} bg="bg-emerald-700" />
        ) : (
            <KpiCard title="Total KM (Recorridos)" value={`${kpis.totalKm}`} icon={<Map className="w-6 h-6 text-slate-100" />} bg="bg-slate-600" />
        )}
        
        {/* Admin Only */}
        {isAdmin ? (
          <>
            <KpiCard title="Facturación Cerrada" value={kpis.realizedRevenue.toLocaleString('es-UY', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} icon={<DollarSign className="w-6 h-6 text-green-100" />} bg="bg-blue-900" />
            <KpiCard title="Pendiente Facturar" value={kpis.pendingRevenue.toLocaleString('es-UY', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} icon={<Clock className="w-6 h-6 text-yellow-100" />} bg="bg-orange-600" />
          </>
        ) : (
          <>
            <KpiCard title="Viajes en Curso" value={`${kpis.activeTrips}`} icon={<Truck className="w-6 h-6 text-yellow-100" />} bg="bg-slate-500" />
            <div className="bg-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400">
              <Lock className="w-6 h-6 mb-2" />
              <span className="text-xs">Información Financiera Restringida</span>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Chart - Admin Only */}
        {isAdmin ? (
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Evolución de Ingresos (USD)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenue}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{fontSize: 12}} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`USD ${value.toLocaleString()}`, 'Ingresos']}
                  />
                  <Area type="monotone" dataKey="value" stroke="#2563eb" fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
           <div className="lg:col-span-2 bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-slate-400">
              <Lock className="w-12 h-12 mb-4 opacity-50" />
              <p>Gráficos de facturación no disponibles para su rol.</p>
           </div>
        )}

        {/* Product Performance Analytics - Simplified for Operative */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-1 overflow-y-auto max-h-[400px]">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2 text-blue-600" />
              Rendimiento por Rubro
          </h3>
          <div className="space-y-4">
            {productPerformance.map((item, idx) => (
                <div key={item.name} className="border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-slate-700 text-sm">{item.name}</span>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{item.count} Viajes</span>
                    </div>
                    
                    {isAdmin && (
                      <div className="grid grid-cols-1 gap-2 mt-2">
                          <div className="flex justify-between">
                              <p className="text-[10px] text-slate-400 uppercase tracking-wide">USD</p>
                              <p className="text-sm font-medium text-slate-800">${item.revenue.toLocaleString()}</p>
                          </div>
                          <div className="flex justify-between">
                              <p className="text-[10px] text-slate-400 uppercase tracking-wide">UYU (Est)</p>
                              <p className="text-sm font-medium text-emerald-600">${item.revenueUYU.toLocaleString('es-UY', {maximumFractionDigits: 0})}</p>
                          </div>
                      </div>
                    )}
                </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard: React.FC<{ title: string; value: string; icon: React.ReactNode; bg: string }> = ({ title, value, icon, bg }) => (
  <div className={`${bg} rounded-xl p-6 text-white shadow-lg transition-transform hover:scale-[1.02]`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-blue-200 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold">{value}</h3>
      </div>
      <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
        {icon}
      </div>
    </div>
  </div>
);
