import React, { useState } from 'react';
import { Trip, TripStatus, Client, User } from '../src/types';
import { saveTripToSheet, updateTripInSheet, deleteTripInSheet } from '../services/api';
import { Plus, Calendar, Package, ArrowRight, DollarSign, Search, Pencil, Trash2, X, Save } from 'lucide-react';

interface TripManagerProps {
  trips: Trip[];
  clients: Client[];
  onAddTrip: (trip: Trip) => void; // Mantener por compatibilidad con App.tsx
  user: User;
}

export const TripManager: React.FC<TripManagerProps> = ({ trips, clients, onAddTrip, user }) => {
  const isAdmin = user.role === 'admin';
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newTrip, setNewTrip] = useState<Partial<Trip>>({
    estado: TripStatus.PROGRAMMED,
    fecha: new Date().toISOString().split('T')[0],
    contenido: '',
    origen: 'Montevideo',
    pesoKg: 0,
    tarifa: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrip.clientId || !newTrip.destino) return alert("Complete los campos obligatorios");

    setLoading(true);
    const tripToSave: Trip = {
      ...newTrip,
      id: `V${Date.now()}`,
      pesoKg: Number(newTrip.pesoKg),
      kmRecorridos: Number(newTrip.kmRecorridos || 0),
      tarifa: Number(newTrip.tarifa),
    } as Trip;

    const success = await saveTripToSheet(tripToSave);
    
    if (success) {
      alert("¡Viaje guardado en Google Sheets!");
      setShowForm(false);
      window.location.reload(); // Recarga para ver el nuevo viaje
    } else {
      alert("Error al guardar. Revise la conexión.");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Eliminar este viaje permanentemente?")) {
      await deleteTripInSheet(id);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Gestión de Viajes</h2>
        {isAdmin && (
          <button 
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-lg transition-all"
          >
            <Plus className="w-5 h-5 mr-2" /> Nuevo Viaje
          </button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-50 p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Registrar Nuevo Viaje</h3>
              <button onClick={() => setShowForm(false)}><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cliente</label>
                <select 
                  className="w-full p-2.5 border rounded-lg bg-slate-50"
                  required
                  onChange={e => setNewTrip({...newTrip, clientId: e.target.value})}
                >
                  <option value="">Seleccione un cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.nombreComercial}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha</label>
                <input type="date" className="w-full p-2.5 border rounded-lg bg-slate-50" value={newTrip.fecha} onChange={e => setNewTrip({...newTrip, fecha: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Carga</label>
                <input type="text" placeholder="Ej: Arroz, Fertilizante" className="w-full p-2.5 border rounded-lg bg-slate-50" onChange={e => setNewTrip({...newTrip, contenido: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Destino</label>
                <input type="text" className="w-full p-2.5 border rounded-lg bg-slate-50" placeholder="Ciudad de destino" onChange={e => setNewTrip({...newTrip, destino: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tarifa (USD/ton)</label>
                <input type="number" className="w-full p-2.5 border rounded-lg bg-slate-50" onChange={e => setNewTrip({...newTrip, tarifa: Number(e.target.value)})} />
              </div>
              <div className="col-span-2 pt-4">
                <button 
                  disabled={loading}
                  type="submit" 
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors flex justify-center items-center"
                >
                  {loading ? "Guardando..." : <><Save className="w-5 h-5 mr-2"/> Confirmar y Guardar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla de Viajes */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
            <tr>
              <th className="p-4">Fecha</th>
              <th className="p-4">Cliente</th>
              <th className="p-4">Ruta</th>
              <th className="p-4">Carga</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {trips.map(trip => (
              <tr key={trip.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-medium">{trip.fecha}</td>
                <td className="p-4">{clients.find(c => c.id === trip.clientId)?.nombreComercial || 'Cargando...'}</td>
                <td className="p-4 flex items-center">
                  {trip.origen} <ArrowRight className="w-3 h-3 mx-2 text-slate-400" /> {trip.destino}
                </td>
                <td className="p-4">{trip.contenido}</td>
                <td className="p-4 text-right">
                  <button onClick={() => handleDelete(trip.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
