import React, { useState, useEffect } from 'react';
import { Trip, TripStatus, Client, User } from '../src/types';
import { saveTripToSheet, updateTripInSheet, deleteTripInSheet } from '../services/api';
import { 
  Plus, Calendar, Package, ArrowRight, DollarSign, Search, 
  Pencil, Trash2, X, RefreshCw, Save, Truck, MapPin 
} from 'lucide-react';

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
  const [localTrips, setLocalTrips] = useState<Trip[]>(trips);

  // Sincronizar estado local con props si cambian
  useEffect(() => {
    setLocalTrips(trips);
  }, [trips]);

  // Filtros
  const [filters, setFilters] = useState({
    searchId: '',
    startDate: '',
    endDate: '',
    clientId: '',
    status: ''
  });

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

  // Lógica de sugerencia de Km (Distancia inteligente)
  useEffect(() => {
    if (!editingId && newTrip.origen && newTrip.destino && showForm) {
      const isMontevideo = newTrip.origen.toLowerCase().includes('montevideo');
      const dest = newTrip.destino.toLowerCase();
      
      if (isMontevideo) {
        if (dest.includes('artigas')) setNewTrip(prev => ({ ...prev, kmRecorridos: 600 }));
        else if (dest.includes('rivera')) setNewTrip(prev => ({ ...prev, kmRecorridos: 500 }));
        else if (dest.includes('salto')) setNewTrip(prev => ({ ...prev, kmRecorridos: 490 }));
        else if (dest.includes('paysandu') || dest.includes('paysandú')) setNewTrip(prev => ({ ...prev, kmRecorridos: 380 }));
        else if (dest.includes('tacuarembo') || dest.includes('tacuarembó')) setNewTrip(prev => ({ ...prev, kmRecorridos: 390 }));
      }
    }
  }, [newTrip.destino, newTrip.origen, showForm, editingId]);

  // CÁLCULO DE BENEFICIO (Fixed)
  const calculateBenefit = (trip: Trip) => {
    // Aseguramos que sean números
    const peso = Number(trip.pesoKg) || 0;
    const tarifa = Number(trip.tarifa) || 0;
    
    // Toneladas = kg / 1000
    const toneladas = peso / 1000;
    const total = toneladas * tarifa;

    return total.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  const handleEdit = (trip: Trip) => {
    setNewTrip({
        ...trip,
        // Forzamos conversión para que los inputs tipo 'number' funcionen bien
        pesoKg: Number(trip.pesoKg),
        kmRecorridos: Number(trip.kmRecorridos),
        tarifa: Number(trip.tarifa)
    });
    setEditingId(trip.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este viaje permanentemente?')) {
      setLoading(true);
      const success = await deleteTripInSheet(id);
      if (success) {
         // Eliminación optimista local
         setLocalTrips(prev => prev.filter(t => t.id !== id));
         alert("Viaje eliminado correctamente.");
      } else { 
         alert("Error al eliminar. Verifique conexión."); 
      }
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (trip: Trip) => {
    if (!isAdmin) return;
    
    let nextStatus = trip.estado;
    if (trip.estado === TripStatus.PROGRAMMED) nextStatus = TripStatus.IN_PROGRESS;
    else if (trip.estado === TripStatus.IN_PROGRESS) nextStatus = TripStatus.COMPLETED;
    else if (trip.estado === TripStatus.COMPLETED) nextStatus = TripStatus.CLOSED;
    
    if (nextStatus !== trip.estado) {
      setLoading(true);
      const updatedTrip = { ...trip, estado: nextStatus };
      const success = await updateTripInSheet(updatedTrip);
      
      if (success) {
         // Actualización optimista
         setLocalTrips(prev => prev.map(t => t.id === trip.id ? updatedTrip : t));
      } else {
        alert("Error al actualizar estado.");
      }
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const tripData = {
      ...newTrip,
      id: editingId || `V${Date.now()}`,
      pesoKg: Number(newTrip.pesoKg),
      kmRecorridos: Number(newTrip.kmRecorridos),
      tarifa: Number(newTrip.tarifa),
      clientId: newTrip.clientId // Aseguramos que viaja el ID del cliente
    } as Trip;

    let success;
    if (editingId) {
      success = await updateTripInSheet(tripData);
    } else {
      success = await saveTripToSheet(tripData);
    }

    if (success) {
      // Actualización Local Optimista
      if (editingId) {
        setLocalTrips(prev => prev.map(t => t.id === tripData.id ? tripData : t));
      } else {
        setLocalTrips(prev => [tripData, ...prev]);
      }
      setShowForm(false);
      setEditingId(null);
    } else {
      alert("Error al guardar en Google Sheets. Intente nuevamente.");
    }
    setLoading(false);
  };

  // Filtrado de datos
  const filteredTrips = localTrips.filter(t => {
    if (activeTab === 'current' && t.estado !== TripStatus.IN_PROGRESS) return false;
    if (activeTab === 'programmed' && t.estado !== TripStatus.PROGRAMMED) return false;
    
    // Filtros inputs
    if (filters.searchId && !t.id.toLowerCase().includes(filters.searchId.toLowerCase())) return false;
    if (filters.clientId && t.clientId !== filters.clientId) return false;
    if (filters.status && t.estado !== filters.status) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center">
            <Truck className="mr-2 text-blue-600" /> Operaciones de Flota
          </h2>
          <p className="text-slate-500 text-sm mt-1">Gestión y monitoreo de cargas activas</p>
        </div>
        
        <div className="flex items-center space-x-3 bg-white p-1.5 rounded-xl border shadow-sm">
          <button onClick={() => setActiveTab('current')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'current' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>En Curso</button>
          <button onClick={() => setActiveTab('programmed')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'programmed' ? 'bg-amber-500 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>Programados</button>
          <button onClick={() => setActiveTab('all')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'all' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>Historial</button>
        </div>

        {isAdmin && (
          <button 
            onClick={() => { 
                setEditingId(null); 
                setNewTrip({ estado: TripStatus.PROGRAMMED, fecha: new Date().toISOString().split('T')[0], origen: 'Montevideo', pesoKg:0, kmRecorridos:0, tarifa:0 }); 
                setShowForm(true); 
            }} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 flex items-center transition-all"
          >
            <Plus className="mr-2 w-5 h-5" /> Nuevo Viaje
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative col-span-1 md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
                type="text" 
                placeholder="Buscar por ID..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.searchId}
                onChange={e => setFilters({...filters, searchId: e.target.value})}
            />
        </div>
        <select 
            className="p-2 bg-slate-50 border rounded-lg text-sm outline-none"
            value={filters.clientId}
            onChange={e => setFilters({...filters, clientId: e.target.value})}
        >
            <option value="">Todos los Clientes</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.nombreComercial}</option>)}
        </select>
        <select 
            className="p-2 bg-slate-50 border rounded-lg text-sm outline-none"
            value={filters.status}
            onChange={e => setFilters({...filters, status: e.target.value})}
        >
            <option value="">Estado: Todos</option>
            <option value={TripStatus.PROGRAMMED}>Programado</option>
            <option value={TripStatus.IN_PROGRESS}>En Curso</option>
            <option value={TripStatus.COMPLETED}>Completado</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Fecha / ID</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Cliente</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Ruta / Carga</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Logística</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Estado</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Beneficio</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredTrips.map(trip => {
              const client = clients.find(c => c.id === trip.clientId) || { nombreComercial: 'Cliente Desconocido', rut: '---' };
              return (
                <tr key={trip.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-4">
                    <div className="font-bold text-slate-800 flex items-center"><Calendar className="w-3 h-3 mr-1 text-slate-400"/> {trip.fecha}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">{trip.id}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-blue-900">{client.nombreComercial}</div>
                    <div className="text-xs text-slate-400">{client.rut}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center font-medium text-slate-700">
                       {trip.origen} <ArrowRight className="w-3 h-3 mx-2 text-slate-300"/> {trip.destino}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center">
                       <Package className="w-3 h-3 mr-1"/> {trip.contenido} • <span className="font-bold ml-1">{(Number(trip.pesoKg)/1000).toFixed(1)}t</span>
                    </div>
                  </td>
                  <td className="p-4">
                      <div className="space-y-1">
                          <div className="text-xs flex items-center text-slate-600">
                              <MapPin className="w-3 h-3 mr-1 text-blue-500"/> {trip.kmRecorridos} km
                          </div>
                          <div className="text-xs flex items-center text-slate-600">
                              <DollarSign className="w-3 h-3 mr-1 text-green-500"/> {trip.tarifa} USD/t
                          </div>
                      </div>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => handleStatusUpdate(trip)}
                      disabled={loading || !isAdmin}
                      className={`
                        px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 transition-all cursor-pointer hover:shadow-sm
                        ${trip.estado === TripStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' : ''}
                        ${trip.estado === TripStatus.PROGRAMMED ? 'bg-amber-100 text-amber-700' : ''}
                        ${trip.estado === TripStatus.COMPLETED ? 'bg-green-100 text-green-700' : ''}
                        ${trip.estado === TripStatus.CLOSED ? 'bg-slate-100 text-slate-600' : ''}
                      `}
                    >
                      <RefreshCw className="w-3 h-3" />
                      {trip.estado}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="font-bold text-slate-700">{calculateBenefit(trip)}</div>
                  </td>
                  <td className="p-4 text-center">
                    {isAdmin && (
                      <div className="flex justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(trip)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(trip.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{editingId ? 'Editar Operación' : 'Registrar Nuevo Viaje'}</h3>
                <p className="text-xs text-slate-500 mt-1">Complete todos los campos obligatorios</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Cliente Asociado</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  required 
                  value={newTrip.clientId || ''}
                  onChange={e => setNewTrip({...newTrip, clientId: e.target.value})}
                >
                  <option value="">Seleccione un cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.nombreComercial} ({c.rut})</option>)}
                </select>
              </div>

              {/* Campos Fecha y Producto */}
              <div className="col-span-1">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Fecha de Carga</label>
                 <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                    <input type="date" required value={newTrip.fecha} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" onChange={e => setNewTrip({...newTrip, fecha: e.target.value})} />
                 </div>
              </div>

              <div className="col-span-1">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Producto</label>
                 <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                    <input type="text" required placeholder="Ej. Soja" value={newTrip.contenido || ''} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" onChange={e => setNewTrip({...newTrip, contenido: e.target.value})} />
                 </div>
              </div>

              {/* Origen y Destino */}
              <div className="col-span-1">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Origen</label>
                 <input type="text" required value={newTrip.origen || ''} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" onChange={e => setNewTrip({...newTrip, origen: e.target.value})} />
              </div>

              <div className="col-span-1">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Destino</label>
                 <input type="text" required value={newTrip.destino || ''} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" onChange={e => setNewTrip({...newTrip, destino: e.target.value})} />
              </div>

              {/* Peso y Km */}
              <div className="col-span-1">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Peso (Kg)</label>
                 <input type="number" required min="0" value={newTrip.pesoKg || ''} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" onChange={e => setNewTrip({...newTrip, pesoKg: Number(e.target.value)})} />
              </div>

              <div className="col-span-1">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Distancia (Km)</label>
                 <input type="number" required min="0" value={newTrip.kmRecorridos || ''} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-blue-600 font-bold" onChange={e => setNewTrip({...newTrip, kmRecorridos: Number(e.target.value)})} />
              </div>

              {/* Tarifa */}
              <div className="col-span-2">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Tarifa (USD / Tonelada)</label>
                 <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600"/>
                    <input type="number" required step="0.01" min="0" value={newTrip.tarifa || ''} className="w-full pl-12 pr-4 py-4 bg-green-50 border border-green-200 rounded-xl text-xl font-bold text-green-800" onChange={e => setNewTrip({...newTrip, tarifa: Number(e.target.value)})} />
                 </div>
              </div>

              <div className="col-span-2 pt-4">
                 <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold shadow-lg flex justify-center items-center transition-all disabled:opacity-70">
                    {loading ? <RefreshCw className="animate-spin mr-2" /> : <Save className="mr-2" />}
                    {loading ? 'Guardando...' : (editingId ? 'Guardar Cambios' : 'Confirmar Operación')}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
