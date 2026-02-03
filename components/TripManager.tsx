import React, { useState, useEffect } from 'react';
import { Trip, TripStatus, Client, User } from '../src/types';
import { saveTripToSheet, updateTripInSheet, deleteTripInSheet } from '../services/api';
import { Plus, Calendar, Package, ArrowRight, DollarSign, Search, Filter, Sparkles, Pencil, Trash2, X, RefreshCw } from 'lucide-react';

interface TripManagerProps {
  trips: Trip[];
  clients: Client[];
  onAddTrip: (trip: Trip) => void;
  user: User;
}

export const TripManager: React.FC<TripManagerProps> = ({ trips, clients, user }) => {
  const isAdmin = user.role === 'admin';
  const [activeTab, setActiveTab] = useState<'current' | 'programmed' | 'all'>('current');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({ searchId: '', startDate: '', endDate: '', clientId: '', status: '' });
  const [newTrip, setNewTrip] = useState<Partial<Trip>>({
    estado: TripStatus.PROGRAMMED,
    fecha: new Date().toISOString().split('T')[0],
    origen: 'Montevideo'
  });

  // Lógica de cálculo de beneficio (original)
  const calculateBenefit = (trip: Trip) => {
    const revenue = (trip.tarifa * (trip.pesoKg / 1000));
    return revenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  const handleStatusChange = async (trip: Trip) => {
    let nextStatus = trip.estado;
    if (trip.estado === TripStatus.PROGRAMMED) nextStatus = TripStatus.IN_PROGRESS;
    else if (trip.estado === TripStatus.IN_PROGRESS) nextStatus = TripStatus.COMPLETED;
    
    if (nextStatus !== trip.estado) {
      setLoading(true);
      await updateTripInSheet({ ...trip, estado: nextStatus });
      window.location.reload(); 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const tripToSave: Trip = {
      ...newTrip,
      id: editingId || `V${Date.now()}`,
      pesoKg: Number(newTrip.pesoKg),
      kmRecorridos: Number(newTrip.kmRecorridos),
      tarifa: Number(newTrip.tarifa),
    } as Trip;

    const success = editingId ? await updateTripInSheet(tripToSave) : await saveTripToSheet(tripToSave);
    if (success) {
      setShowForm(false);
      window.location.reload();
    } else {
      alert("Error al guardar");
    }
    setLoading(false);
  };

  const filteredTrips = trips.filter(t => {
    if (activeTab === 'current' && t.estado !== TripStatus.IN_PROGRESS) return false;
    if (activeTab === 'programmed' && t.estado !== TripStatus.PROGRAMMED) return false;
    const client = clients.find(c => c.id === t.clientId);
    if (filters.searchId && !client?.rut.includes(filters.searchId)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Gestión de Viajes</h2>
          <p className="text-slate-500 text-sm">Control operativo y seguimiento de flota</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button onClick={() => setActiveTab('current')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'current' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>En curso</button>
          <button onClick={() => setActiveTab('programmed')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'programmed' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Programados</button>
          <button onClick={() => setActiveTab('all')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'all' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Todos</button>
        </div>

        {isAdmin && (
          <button onClick={() => { setEditingId(null); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center shadow-lg font-bold transition-all">
            <Plus className="w-5 h-5 mr-2" /> Nuevo Viaje
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b">
              <tr>
                <th className="p-4">Fecha / ID</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Ruta y Carga</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Beneficio Est.</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTrips.map(trip => (
                <tr key={trip.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{trip.fecha}</div>
                    <div className="text-[10px] text-slate-400 font-mono uppercase">{trip.id}</div>
                  </td>
                  <td className="p-4 font-semibold text-blue-900">
                    {clients.find(c => c.id === trip.clientId)?.nombreComercial}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center text-sm font-medium">
                      {trip.origen} <ArrowRight className="w-3 h-3 mx-2 text-slate-400" /> {trip.destino}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 italic">{trip.contenido} • {trip.pesoKg}kg</div>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => handleStatusChange(trip)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 ${
                        trip.estado === TripStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' :
                        trip.estado === TripStatus.PROGRAMMED ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                      }`}
                    >
                      <RefreshCw className="w-3 h-3" /> {trip.estado}
                    </button>
                  </td>
                  <td className="p-4 text-right font-bold text-green-600">
                    {calculateBenefit(trip)}
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleDelete(trip.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="bg-slate-50 p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Registrar Nuevo Viaje</h3>
              <button onClick={() => setShowForm(false)}><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Seleccionar Cliente</label>
                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required onChange={e => setNewTrip({...newTrip, clientId: e.target.value})}>
                  <option value="">Buscar cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.nombreComercial} ({c.rut})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Fecha</label>
                <input type="date" value={newTrip.fecha} className="w-full p-3 bg-slate-50 border rounded-xl" onChange={e => setNewTrip({...newTrip, fecha: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Producto</label>
                <input type="text" placeholder="Ej: Fertilizante" className="w-full p-3 bg-slate-50 border rounded-xl" onChange={e => setNewTrip({...newTrip, contenido: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4 col-span-2">
                <input type="text" placeholder="Origen" className="p-3 bg-slate-50 border rounded-xl" value={newTrip.origen} onChange={e => setNewTrip({...newTrip, origen: e.target.value})} />
                <input type="text" placeholder="Destino" className="p-3 bg-slate-50 border rounded-xl" onChange={e => setNewTrip({...newTrip, destino: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4 col-span-2">
                <input type="number" placeholder="Peso (Kg)" className="p-3 bg-slate-50 border rounded-xl" onChange={e => setNewTrip({...newTrip, pesoKg: Number(e.target.value)})} />
                <input type="number" placeholder="Tarifa USD/Ton" className="p-3 bg-slate-50 border rounded-xl" onChange={e => setNewTrip({...newTrip, tarifa: Number(e.target.value)})} />
              </div>
              <button disabled={loading} type="submit" className="col-span-2 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                {loading ? "Sincronizando con Google..." : "Confirmar y Guardar Operación"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
