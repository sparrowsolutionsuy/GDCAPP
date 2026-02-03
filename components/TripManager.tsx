import React, { useState } from 'react';
import { Trip, TripStatus, Client, User } from '../src/types';
import { saveTripToSheet, updateTripInSheet, deleteTripInSheet } from '../services/api';
import { Plus, Calendar, Package, ArrowRight, RefreshCw, Trash2, X, Save, Search, DollarSign } from 'lucide-react';

export const TripManager: React.FC<{ trips: Trip[]; clients: Client[]; user: User; onAddTrip: any }> = ({ trips, clients, user }) => {
  const isAdmin = user.role === 'admin';
  const [activeTab, setActiveTab] = useState<'current' | 'programmed' | 'all'>('current');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newTrip, setNewTrip] = useState<Partial<Trip>>({ estado: TripStatus.PROGRAMMED, fecha: new Date().toISOString().split('T')[0], origen: 'Montevideo' });

  const calculateBenefit = (trip: Trip) => {
    const revenue = trip.tarifa * (trip.pesoKg / 1000);
    return revenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const tripToSave = { ...newTrip, id: `V${Date.now()}`, pesoKg: Number(newTrip.pesoKg), kmRecorridos: Number(newTrip.kmRecorridos), tarifa: Number(newTrip.tarifa) } as Trip;
    const ok = await saveTripToSheet(tripToSave);
    if (ok) { setShowForm(false); window.location.reload(); }
    else { alert("Error al conectar con Sheets"); setLoading(false); }
  };

  const filteredTrips = trips.filter(t => {
    if (activeTab === 'current') return t.estado === TripStatus.IN_PROGRESS;
    if (activeTab === 'programmed') return t.estado === TripStatus.PROGRAMMED;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Gestión de Viajes</h2>
        <div className="flex bg-white rounded-xl p-1 border shadow-sm">
            {['current', 'programmed', 'all'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-2 rounded-lg text-sm font-bold capitalize ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>
                {tab === 'current' ? 'En Curso' : tab === 'programmed' ? 'Programados' : 'Todos'}
              </button>
            ))}
        </div>
        {isAdmin && <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center font-bold shadow-lg shadow-blue-200 hover:bg-blue-700"><Plus className="mr-2"/> Nuevo Viaje</button>}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b">
            <tr>
              <th className="p-4">Fecha / ID</th>
              <th className="p-4">Cliente / RUT</th>
              <th className="p-4">Ruta y Carga</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-right">Beneficio</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredTrips.map(trip => (
              <tr key={trip.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-bold">{trip.fecha}<div className="text-[10px] font-mono text-slate-400">{trip.id}</div></td>
                <td className="p-4">
                  <div className="font-semibold text-blue-900">{clients.find(c => c.id === trip.clientId)?.nombreComercial}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{clients.find(c => c.id === trip.clientId)?.rut}</div>
                </td>
                <td className="p-4">
                  <div className="flex items-center font-medium">{trip.origen} <ArrowRight className="w-3 h-3 mx-2 text-slate-400"/> {trip.destino}</div>
                  <div className="text-xs text-slate-500">{trip.contenido} • {trip.pesoKg}kg</div>
                </td>
                <td className="p-4">
                  <button onClick={() => handleStatusUpdate(trip)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${trip.estado === TripStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' : trip.estado === TripStatus.PROGRAMMED ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> {trip.estado}
                  </button>
                </td>
                <td className="p-4 text-right font-bold text-green-600">{calculateBenefit(trip)}</td>
                <td className="p-4 text-center"><button onClick={async () => { if(confirm("¿Eliminar?")) { await deleteTripInSheet(trip.id); window.location.reload(); } }} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
             <div className="bg-slate-50 p-6 border-b flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">Registrar Operación</h3>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
             </div>
             <form onSubmit={handleSubmit} className="p-8 grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Cliente</label>
                  <select className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required onChange={e => setNewTrip({...newTrip, clientId: e.target.value})}>
                    <option value="">Buscar cliente por nombre o RUT...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.nombreComercial} ({c.rut})</option>)}
                  </select>
                </div>
                <div className="col-span-2 grid grid-cols-2 gap-4">
                  <input type="date" value={newTrip.fecha} className="p-3 bg-slate-50 border rounded-xl" onChange={e => setNewTrip({...newTrip, fecha: e.target.value})} />
                  <input type="text" placeholder="Producto (ej. Arroz)" className="p-3 bg-slate-50 border rounded-xl" onChange={e => setNewTrip({...newTrip, contenido: e.target.value})} />
                </div>
                <input type="text" placeholder="Origen" className="p-3 bg-slate-50 border rounded-xl" value={newTrip.origen} onChange={e => setNewTrip({...newTrip, origen: e.target.value})} />
                <input type="text" placeholder="Destino" className="p-3 bg-slate-50 border rounded-xl" onChange={e => setNewTrip({...newTrip, destino: e.target.value})} />
                <input type="number" placeholder="Peso (Kg)" className="p-3 bg-slate-50 border rounded-xl" onChange={e => setNewTrip({...newTrip, pesoKg: Number(e.target.value)})} />
                <input type="number" placeholder="Km Recorridos" className="p-3 bg-slate-50 border rounded-xl" onChange={e => setNewTrip({...newTrip, kmRecorridos: Number(e.target.value)})} />
                <input type="number" placeholder="Tarifa USD/ton" className="p-3 bg-slate-50 border rounded-xl col-span-2 font-bold text-blue-600" onChange={e => setNewTrip({...newTrip, tarifa: Number(e.target.value)})} />
                
                <button disabled={loading} type="submit" className="col-span-2 bg-blue-600 text-white py-4 rounded-2xl font-bold flex justify-center items-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                  {loading ? <RefreshCw className="animate-spin mr-2"/> : <Save className="mr-2"/>} Confirmar y Guardar en Base de Datos
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};
