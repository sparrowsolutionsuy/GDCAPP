import React, { useState, useEffect } from 'react';
import { Trip, TripStatus, Client, User } from '../src/types';
import { saveTripToSheet, updateTripInSheet, deleteTripInSheet } from '../services/api';
import { Plus, Calendar, Package, ArrowRight, DollarSign, Search, Filter, Sparkles, Pencil, Trash2, X, RefreshCw, Save } from 'lucide-react';

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

  // Form State con todos los campos originales
  const [newTrip, setNewTrip] = useState<Partial<Trip>>({
    estado: TripStatus.PROGRAMMED,
    fecha: new Date().toISOString().split('T')[0],
    origen: 'Montevideo',
    destino: '',
    contenido: '',
    pesoKg: 0,
    kmRecorridos: 0,
    tarifa: 0
  });

  // Lógica de distancia inteligente (de tu código original)
  useEffect(() => {
    if (!editingId && newTrip.origen && newTrip.destino && showForm) {
      const isMontevideo = newTrip.origen.toLowerCase().includes('montevideo');
      if (isMontevideo) {
        if (newTrip.destino.toLowerCase().includes('artigas')) setNewTrip(prev => ({ ...prev, kmRecorridos: 600 }));
        else if (newTrip.destino.toLowerCase().includes('rivera')) setNewTrip(prev => ({ ...prev, kmRecorridos: 500 }));
        else if (newTrip.destino.toLowerCase().includes('salto')) setNewTrip(prev => ({ ...prev, kmRecorridos: 490 }));
      }
    }
  }, [newTrip.destino, showForm]);

  const handleEdit = (trip: Trip) => {
    setNewTrip(trip);
    setEditingId(trip.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const tripData = {
      ...newTrip,
      id: editingId || `V${Date.now()}`,
      pesoKg: Number(newTrip.pesoKg),
      kmRecorridos: Number(newTrip.kmRecorridos),
      tarifa: Number(newTrip.tarifa)
    } as Trip;

    const success = editingId ? await updateTripInSheet(tripData) : await saveTripToSheet(tripData);
    
    if (success) {
      window.location.reload();
    } else {
      alert("Error al guardar en base de datos.");
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (trip: Trip) => {
    let nextStatus = trip.estado;
    if (trip.estado === TripStatus.PROGRAMMED) nextStatus = TripStatus.IN_PROGRESS;
    else if (trip.estado === TripStatus.IN_PROGRESS) nextStatus = TripStatus.COMPLETED;
    
    if (nextStatus !== trip.estado) {
      setLoading(true);
      await updateTripInSheet({ ...trip, estado: nextStatus });
      window.location.reload();
    }
  };

  const filteredTrips = trips.filter(t => {
    if (activeTab === 'current') return t.estado === TripStatus.IN_PROGRESS;
    if (activeTab === 'programmed') return t.estado === TripStatus.PROGRAMMED;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Operaciones de Flota</h2>
          <p className="text-slate-500 text-sm">Monitoreo de viajes activos y programados</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl border shadow-sm">
          <button onClick={() => setActiveTab('current')} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === 'current' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>En curso</button>
          <button onClick={() => setActiveTab('programmed')} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === 'programmed' ? 'bg-amber-500 text-white' : 'text-slate-500'}`}>Programados</button>
          <button onClick={() => setActiveTab('all')} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>Historial</button>
        </div>

        {isAdmin && (
          <button onClick={() => { setEditingId(null); setShowForm(true); }} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg flex items-center">
            <Plus className="mr-2" /> Registrar Viaje
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b text-xs text-slate-500 uppercase font-bold">
            <tr>
              <th className="p-4">Fecha</th>
              <th className="p-4">Cliente</th>
              <th className="p-4">Carga / Peso</th>
              <th className="p-4">Ruta / Km</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredTrips.map(trip => (
              <tr key={trip.id} className="hover:bg-slate-50/50">
                <td className="p-4 font-bold">{trip.fecha}</td>
                <td className="p-4">
                  <div className="font-semibold text-blue-900">{clients.find(c => c.id === trip.clientId)?.nombreComercial}</div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase">{trip.id}</div>
                </td>
                <td className="p-4">
                  <div className="font-medium text-slate-700">{trip.contenido}</div>
                  <div className="text-xs text-slate-500">{(trip.pesoKg/1000).toFixed(1)} Toneladas</div>
                </td>
                <td className="p-4">
                  <div className="flex items-center">{trip.origen} <ArrowRight className="w-3 h-3 mx-1 text-slate-400"/> {trip.destino}</div>
                  <div className="text-xs text-blue-600 font-bold">{trip.kmRecorridos} Km</div>
                </td>
                <td className="p-4">
                  <button onClick={() => handleStatusUpdate(trip)} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 ${trip.estado === TripStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' : trip.estado === TripStatus.PROGRAMMED ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                    <RefreshCw className="w-3 h-3" /> {trip.estado}
                  </button>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => handleEdit(trip)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-4 h-4"/></button>
                    <button onClick={async () => { if(confirm("¿Borrar viaje?")) { await deleteTripInSheet(trip.id); window.location.reload(); } }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="bg-slate-50 p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingId ? 'Editar Viaje' : 'Nuevo Registro de Carga'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Seleccionar Cliente</label>
                <select value={newTrip.clientId} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" required onChange={e => setNewTrip({...newTrip, clientId: e.target.value})}>
                  <option value="">Buscar cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.nombreComercial} ({c.rut})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Fecha</label>
                <input type="date" value={newTrip.fecha} className="w-full p-3 bg-slate-100 border rounded-xl" onChange={e => setNewTrip({...newTrip, fecha: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Producto</label>
                <input type="text" value={newTrip.contenido} placeholder="Ej: Arroz a granel" className="w-full p-3 bg-slate-100 border rounded-xl" onChange={e => setNewTrip({...newTrip, contenido: e.target.value})} />
              </div>
              <div className="col-span-1">
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Origen</label>
                <input type="text" value={newTrip.origen} className="w-full p-3 bg-slate-100 border rounded-xl" onChange={e => setNewTrip({...newTrip, origen: e.target.value})} />
              </div>
              <div className="col-span-1">
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Destino</label>
                <input type="text" value={newTrip.destino} className="w-full p-3 bg-slate-100 border rounded-xl" onChange={e => setNewTrip({...newTrip, destino: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Peso (Kg)</label>
                <input type="number" value={newTrip.pesoKg} className="w-full p-3 bg-slate-100 border rounded-xl font-bold" onChange={e => setNewTrip({...newTrip, pesoKg: Number(e.target.value)})} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Kilómetros</label>
                <input type="number" value={newTrip.kmRecorridos} className="w-full p-3 bg-slate-100 border rounded-xl font-bold text-blue-600" onChange={e => setNewTrip({...newTrip, kmRecorridos: Number(e.target.value)})} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Tarifa pactada (USD/Ton)</label>
                <input type="number" step="any" value={newTrip.tarifa} className="w-full p-4 bg-blue-50 border-2 border-blue-100 rounded-xl text-xl font-black text-blue-700" onChange={e => setNewTrip({...newTrip, tarifa: Number(e.target.value)})} />
              </div>
              
              <button disabled={loading} type="submit" className="col-span-2 bg-blue-600 text-white py-4 rounded-2xl font-bold flex justify-center items-center text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200">
                {loading ? <RefreshCw className="animate-spin mr-2"/> : <Save className="mr-2"/>} {editingId ? 'Guardar Cambios' : 'Confirmar Viaje'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
