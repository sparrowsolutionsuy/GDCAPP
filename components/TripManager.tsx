import React, { useState, useEffect } from 'react';
import { Trip, TripStatus, Client, User } from '../types';
import { saveTripToSheet, updateTripInSheet, deleteTripInSheet } from '../services/api';
import { 
  Plus, Calendar, Package, ArrowRight, Search, Filter, Sparkles, 
  Pencil, Trash2, X, RefreshCw, AlertCircle, FileText 
} from 'lucide-react';

interface TripManagerProps {
  trips: Trip[];
  clients: Client[];
  onAddTrip: (trip: Trip) => void;
  user: User;
}

export const TripManager: React.FC<TripManagerProps> = ({ trips, clients, onAddTrip, user }) => {
  const isAdmin = user.role === 'admin';
  const [activeTab, setActiveTab] = useState<'current' | 'programmed' | 'all'>('current');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [suggestedKm, setSuggestedKm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estado Local para UI optimista
  const [localTrips, setLocalTrips] = useState<Trip[]>(trips);
  
  useEffect(() => { setLocalTrips(trips); }, [trips]);

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
    origen: '',
    destino: '',
    pesoKg: 0,
    tarifa: 0,
    kmRecorridos: 0,
    facturaUrl: '' // Importante para la validación
  });

  // --- LÓGICA DE DISTANCIA INTELIGENTE ---
  useEffect(() => {
    if (!editingId && newTrip.origen && newTrip.destino && showForm) {
      const origin = newTrip.origen.trim().toLowerCase();
      const dest = newTrip.destino.trim().toLowerCase();
      
      const match = trips.find(t => 
        t.origen.toLowerCase() === origin && 
        t.destino.toLowerCase() === dest && 
        t.kmRecorridos > 0
      );

      if (match) {
        setNewTrip(prev => ({ ...prev, kmRecorridos: match.kmRecorridos }));
        setSuggestedKm(true);
      }
    }
  }, [newTrip.origen, newTrip.destino, showForm]);

  // --- CRUD HANDLERS ---

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validación de seguridad final para estado Cerrado
    if (newTrip.estado === TripStatus.CLOSED && !newTrip.facturaUrl) {
        alert("No se puede cerrar el viaje sin una factura cargada.");
        setLoading(false);
        return;
    }

    const tripData = {
      ...newTrip,
      id: editingId || `V${Date.now()}`,
      pesoKg: Number(newTrip.pesoKg),
      kmRecorridos: Number(newTrip.kmRecorridos),
      tarifa: Number(newTrip.tarifa),
      clientId: newTrip.clientId 
    } as Trip;

    let success;
    if (editingId) {
      success = await updateTripInSheet(tripData);
    } else {
      success = await saveTripToSheet(tripData);
    }

    if (success) {
      if (editingId) {
        setLocalTrips(prev => prev.map(t => t.id === tripData.id ? tripData : t));
      } else {
        setLocalTrips(prev => [tripData, ...prev]);
        onAddTrip(tripData);
      }
      closeForm();
    } else {
      alert("Error de conexión al guardar.");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar viaje permanentemente?")) return;
    setLoading(true);
    const success = await deleteTripInSheet(id);
    if (success) setLocalTrips(prev => prev.filter(t => t.id !== id));
    setLoading(false);
  };

  const handleEdit = (trip: Trip) => {
    setNewTrip({ ...trip }); // Copia completa incluyendo facturaUrl
    setEditingId(trip.id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setNewTrip({ estado: TripStatus.PROGRAMMED, fecha: new Date().toISOString().split('T')[0] });
    setSuggestedKm(false);
  };

  // --- HELPERS VISUALES ---
  
  const calculateBenefitKm = (trip: Trip) => {
    if (!trip.kmRecorridos || trip.kmRecorridos === 0) return "0.00";
    const totalRevenue = trip.tarifa * (trip.pesoKg / 1000);
    return (totalRevenue / trip.kmRecorridos).toFixed(2);
  };

  const getClientName = (id: string) => clients.find(c => c.id === id)?.nombreComercial || 'Cliente Desconocido';

  const filteredTrips = localTrips.filter(t => {
    if (activeTab === 'current' && t.estado !== TripStatus.IN_PROGRESS) return false;
    if (activeTab === 'programmed' && t.estado !== TripStatus.PROGRAMMED) return false;
    
    if (filters.searchId && !t.id.toLowerCase().includes(filters.searchId.toLowerCase())) return false;
    if (filters.clientId && t.clientId !== filters.clientId) return false;
    if (filters.status && t.estado !== filters.status) return false;
    if (filters.startDate && t.fecha < filters.startDate) return false;
    if (filters.endDate && t.fecha > filters.endDate) return false;

    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in font-sans text-slate-600">
      
      {/* 1. HEADER & TABS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 inline-flex">
          {[
            { id: 'current', label: 'En Curso' },
            { id: 'programmed', label: 'Programados' },
            { id: 'all', label: 'Historial Completo' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-blue-900 shadow-sm border border-slate-100' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {isAdmin && (
            <button onClick={() => setShowForm(true)} className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center shadow-md transition-all text-sm font-semibold">
               <Plus className="w-4 h-4 mr-2" /> Nuevo Viaje
            </button>
        )}
      </div>

      {/* 2. FILTERS BAR (Visualmente limpia como la original) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          <Filter className="w-3 h-3 mr-1.5" /> Filtros Activos
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-3 relative">
             <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="Buscar por ID..." 
               className="w-full pl-9 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none transition-colors"
               value={filters.searchId}
               onChange={e => setFilters({...filters, searchId: e.target.value})}
             />
          </div>
          <div className="md:col-span-3">
            <select 
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                value={filters.clientId}
                onChange={e => setFilters({...filters, clientId: e.target.value})}
            >
                <option value="">Todos los Clientes</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nombreComercial}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <select 
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                value={filters.status}
                onChange={e => setFilters({...filters, status: e.target.value})}
            >
                <option value="">Estado...</option>
                <option value={TripStatus.PROGRAMMED}>Programado</option>
                <option value={TripStatus.IN_PROGRESS}>En Curso</option>
                <option value={TripStatus.COMPLETED}>Finalizado</option>
                <option value={TripStatus.CLOSED}>Cerrado</option>
            </select>
          </div>
          <div className="md:col-span-4 flex gap-2">
            <input type="date" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500" onChange={e => setFilters({...filters, startDate: e.target.value})} />
            <input type="date" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500" onChange={e => setFilters({...filters, endDate: e.target.value})} />
          </div>
        </div>
      </div>

      {/* 3. TABLE (Restauración visual exacta) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-600 font-bold text-xs uppercase border-b border-slate-200 tracking-wide">
              <tr>
                <th className="p-4 w-32">ID / Fecha</th>
                <th className="p-4 w-32">Estado</th>
                <th className="p-4">Cliente / Carga</th>
                <th className="p-4">Ruta</th>
                <th className="p-4 text-right">Métricas</th>
                <th className="p-4 text-right text-green-700">Beneficio/KM</th>
                <th className="p-4 text-center w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTrips.map(trip => (
                <tr key={trip.id} className="hover:bg-slate-50/80 transition-colors group">
                  {/* ID & Fecha */}
                  <td className="p-4 align-top">
                    <div className="font-mono text-xs text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded w-fit mb-1">{trip.id}</div>
                    <div className="flex items-center text-xs text-slate-500">
                        <Calendar className="w-3 h-3 mr-1 opacity-70"/> {trip.fecha}
                    </div>
                  </td>

                  {/* Estado (Badges originales) */}
                  <td className="p-4 align-top">
                    <span className={`
                        px-2.5 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wide
                        ${trip.estado === TripStatus.IN_PROGRESS ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                        ${trip.estado === TripStatus.PROGRAMMED ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                        ${trip.estado === TripStatus.COMPLETED ? 'bg-green-50 text-green-700 border-green-200' : ''}
                        ${trip.estado === TripStatus.CLOSED ? 'bg-slate-100 text-slate-500 border-slate-200' : ''}
                    `}>
                        {trip.estado === TripStatus.IN_PROGRESS ? 'En Curso' : trip.estado}
                    </span>
                  </td>

                  {/* Cliente y Carga */}
                  <td className="p-4 align-top">
                    <div className="font-bold text-slate-800 text-sm mb-0.5">{getClientName(trip.clientId)}</div>
                    <div className="text-xs text-slate-500 flex items-center">
                        <Package className="w-3 h-3 mr-1 opacity-70" /> 
                        <span className="font-medium">{(trip.pesoKg/1000).toFixed(1)} tons</span>
                        <span className="mx-1.5 text-slate-300">|</span>
                        {trip.contenido}
                    </div>
                  </td>

                  {/* Ruta */}
                  <td className="p-4 align-top">
                    <div className="flex items-center text-xs font-semibold text-slate-700 mb-1">
                        {trip.origen} <ArrowRight className="w-3 h-3 mx-2 text-slate-300"/> {trip.destino}
                    </div>
                    <div className="text-xs text-slate-400 font-medium bg-slate-50 px-2 py-0.5 rounded inline-block">
                        {trip.kmRecorridos} km
                    </div>
                  </td>

                  {/* Métricas (Derecha) */}
                  <td className="p-4 align-top text-right">
                    <div className="text-xs font-medium text-slate-500">USD {trip.tarifa} / ton</div>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">
                        USD {Math.round(trip.tarifa * (trip.pesoKg/1000)).toLocaleString()}
                    </div>
                  </td>

                  {/* KPI (Derecha) */}
                  <td className="p-4 align-top text-right">
                     <span className="bg-green-50 text-green-700 px-2 py-1 rounded-md text-xs font-bold border border-green-100">
                        ${calculateBenefitKm(trip)} /km
                     </span>
                  </td>

                  {/* Acciones */}
                  <td className="p-4 align-top text-center">
                    {isAdmin && (
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(trip)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md" title="Editar Estado y Datos"><Pencil className="w-4 h-4"/></button>
                            <button onClick={() => handleDelete(trip.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md" title="Eliminar"><Trash2 className="w-4 h-4"/></button>
                        </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
        </table>
      </div>

      {/* 4. MODAL DE EDICIÓN (Con Lógica de Estado Protegido) */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">{editingId ? 'Editar Gestión de Viaje' : 'Registrar Nuevo Viaje'}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Complete los datos operativos y fiscales.</p>
                </div>
                <button onClick={closeForm}><X className="text-slate-400 hover:text-slate-600"/></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    
                    {/* SECCIÓN 1: ESTADO DEL VIAJE (CRÍTICA) */}
                    <div className="col-span-2 bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex items-start gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-blue-800 uppercase mb-2">Estado Actual</label>
                            <select 
                                className="w-full p-2.5 bg-white border border-blue-200 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={newTrip.estado} 
                                onChange={e => setNewTrip({...newTrip, estado: e.target.value as TripStatus})}
                            >
                                <option value={TripStatus.PROGRAMMED}>Programado (Pendiente de inicio)</option>
                                <option value={TripStatus.IN_PROGRESS}>En Curso (En tránsito)</option>
                                <option value={TripStatus.COMPLETED}>Finalizado (Entregado)</option>
                                
                                {/* LOGICA DE BLOQUEO AQUÍ */}
                                <option 
                                    value={TripStatus.CLOSED} 
                                    disabled={!newTrip.facturaUrl}
                                    className={!newTrip.facturaUrl ? "text-slate-300 italic" : "text-slate-700 font-bold"}
                                >
                                    {newTrip.facturaUrl 
                                        ? "🔒 Cerrado (Factura Verificada)" 
                                        : "🚫 Cerrado (Requiere cargar factura en módulo Facturación)"}
                                </option>
                            </select>
                            
                            {!newTrip.facturaUrl && (
                                <div className="flex items-center mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                                    <AlertCircle className="w-3 h-3 mr-1.5" />
                                    <span>Para cerrar el viaje, primero cargue la factura en la sección "Facturación".</span>
                                </div>
                            )}
                             {newTrip.facturaUrl && (
                                <div className="flex items-center mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                                    <FileText className="w-3 h-3 mr-1.5" />
                                    <span>Factura vinculada correctamente.</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RESTO DE CAMPOS */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cliente</label>
                        <select required className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm" value={newTrip.clientId || ''} onChange={e => setNewTrip({...newTrip, clientId: e.target.value})}>
                            <option value="">Seleccionar Cliente...</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.nombreComercial}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha</label>
                        <input type="date" required className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm" value={newTrip.fecha} onChange={e => setNewTrip({...newTrip, fecha: e.target.value})} />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Origen</label>
                        <input type="text" className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm" value={newTrip.origen} onChange={e => setNewTrip({...newTrip, origen: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Destino</label>
                        <input type="text" className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm" value={newTrip.destino} onChange={e => setNewTrip({...newTrip, destino: e.target.value})} />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Producto</label>
                        <input type="text" className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm" placeholder="Ej: Soja" value={newTrip.contenido} onChange={e => setNewTrip({...newTrip, contenido: e.target.value})} />
                    </div>
                    <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex justify-between">
                            <span>KM Recorridos</span>
                            {suggestedKm && <span className="text-blue-600 flex items-center animate-pulse"><Sparkles className="w-3 h-3 mr-1"/>Sugerido</span>}
                        </label>
                        <input type="number" className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm" value={newTrip.kmRecorridos || ''} onChange={e => {setNewTrip({...newTrip, kmRecorridos: Number(e.target.value)}); setSuggestedKm(false);}} />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Peso (KG)</label>
                        <input type="number" className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm" value={newTrip.pesoKg || ''} onChange={e => setNewTrip({...newTrip, pesoKg: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tarifa (USD/Ton)</label>
                        <input type="number" className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm" value={newTrip.tarifa || ''} onChange={e => setNewTrip({...newTrip, tarifa: Number(e.target.value)})} />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                    <button type="button" onClick={closeForm} className="text-slate-500 px-4 py-2 text-sm font-medium hover:text-slate-700 transition-colors">Cancelar</button>
                    <button type="submit" disabled={loading} className="bg-blue-900 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-800 shadow-lg shadow-blue-900/20 flex items-center transition-all">
                        {loading && <RefreshCw className="animate-spin mr-2 w-4 h-4"/>}
                        {editingId ? 'Actualizar Viaje' : 'Guardar Viaje'}
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
