import React, { useState } from 'react';
import { Trip, TripStatus, Client } from '../src/types';
import { uploadInvoice } from '../services/api';
import { 
  UploadCloud, CheckCircle, Loader2, ExternalLink, 
  Calendar, Search, Receipt, Filter, FileText, RefreshCw 
} from 'lucide-react';

interface BillingViewProps {
  trips: Trip[];
  clients: Client[];
  onInvoiceUploaded: (tripId: string, url: string) => void;
}

export const BillingView: React.FC<BillingViewProps> = ({ trips, clients, onInvoiceUploaded }) => {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'closed'>('pending');

  // Filtros
  const [filters, setFilters] = useState({
      dateStart: '',
      dateEnd: '',
      clientId: '',
      searchId: ''
  });

  // Función para recargar la página y obtener datos frescos
  const handleRefresh = () => {
    window.location.reload();
  };

  // Lógica de filtrado de viajes
  const visibleTrips = trips.filter(t => {
      // 1. Filtro por pestaña (Pendientes de Facturar vs Cerrados)
      if (activeTab === 'pending' && t.estado !== TripStatus.COMPLETED) return false;
      if (activeTab === 'closed' && t.estado !== TripStatus.CLOSED) return false;

      // 2. Filtro de búsqueda (ID o RUT)
      const client = clients.find(c => c.id === t.clientId);
      const rutMatch = client?.rut?.includes(filters.searchId) || false;
      
      if (filters.searchId && !t.id.toLowerCase().includes(filters.searchId.toLowerCase()) && !rutMatch) {
          return false;
      }

      // 3. Filtro de Cliente
      if (filters.clientId && t.clientId !== filters.clientId) return false;

      // 4. Filtro de Fechas
      if (filters.dateStart && t.fecha < filters.dateStart) return false;
      if (filters.dateEnd && t.fecha > filters.dateEnd) return false;

      return true;
  });

  const getClientName = (id: string) => {
      const c = clients.find(client => client.id === id);
      return c ? c.nombreComercial : 'Cliente Desconocido';
  };

  const getClientRut = (id: string) => {
      const c = clients.find(client => client.id === id);
      return c ? c.rut : '-';
  };

  // Manejo de subida de archivo
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, tripId: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setUploadingId(tripId);

    // Convertir a Base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        const success = await uploadInvoice(tripId, base64Data, file.name, file.type);
        
        if (success && success.url) {
            onInvoiceUploaded(tripId, success.url);
            // Pequeña pausa visual antes de quitar el estado de carga
            setTimeout(() => setUploadingId(null), 1000);
        } else {
            alert("Error al subir la factura. Intente nuevamente.");
            setUploadingId(null);
        }
    };
    reader.onerror = () => {
        alert("Error al leer el archivo.");
        setUploadingId(null);
    };
  };

  // Función corregida: Abrir en nueva pestaña directamente
  const handleViewInvoice = (url: string) => {
    if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans text-slate-600">
      
      {/* HEADER & TABS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 inline-flex">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center ${
              activeTab === 'pending' 
                ? 'bg-white text-orange-600 shadow-sm border border-slate-100' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UploadCloud className="w-4 h-4 mr-2" />
            Pendientes de Carga
          </button>
          <button
            onClick={() => setActiveTab('closed')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center ${
              activeTab === 'closed' 
                ? 'bg-white text-blue-900 shadow-sm border border-slate-100' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Facturadas / Cerradas
          </button>
        </div>

        {/* Botón Refresh */}
        <button 
          onClick={handleRefresh}
          className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 px-4 py-2 rounded-lg flex items-center shadow-sm transition-all text-sm font-medium"
          title="Recargar datos"
        >
           <RefreshCw className="w-4 h-4 mr-2" /> Actualizar
        </button>
      </div>

      {/* FILTERS BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          <Filter className="w-3 h-3 mr-1.5" /> Filtros de Facturación
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-3 relative">
             <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="Buscar por ID viaje o RUT..." 
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
          <div className="md:col-span-6 flex gap-2">
            <div className="flex items-center flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2">
                <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                <input type="date" className="w-full p-2 bg-transparent text-sm text-slate-500 outline-none" onChange={e => setFilters({...filters, dateStart: e.target.value})} />
            </div>
            <div className="flex items-center flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2">
                <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                <input type="date" className="w-full p-2 bg-transparent text-sm text-slate-500 outline-none" onChange={e => setFilters({...filters, dateEnd: e.target.value})} />
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-600 font-bold text-xs uppercase border-b border-slate-200 tracking-wide">
              <tr>
                <th className="p-4 w-32">ID Viaje</th>
                <th className="p-4">Cliente / RUT</th>
                <th className="p-4 text-right">Monto (USD)</th>
                <th className="p-4 text-center">Estado Factura</th>
                <th className="p-4 text-center w-48">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleTrips.map(trip => (
                <tr key={trip.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4">
                    <div className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded w-fit">{trip.id}</div>
                    <div className="text-xs text-slate-400 mt-1">{trip.fecha}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{getClientName(trip.clientId)}</div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center">
                        <Receipt className="w-3 h-3 mr-1 opacity-70" /> 
                        RUT: {getClientRut(trip.clientId)}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="font-medium text-slate-700">USD {Math.round(trip.tarifa * (trip.pesoKg / 1000)).toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400">{(trip.pesoKg/1000).toFixed(1)} tons</div>
                  </td>
                  
                  <td className="p-4 text-center">
                    {trip.facturaUrl ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" /> Cargada
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                            <UploadCloud className="w-3 h-3 mr-1" /> Pendiente
                        </span>
                    )}
                  </td>

                  <td className="p-4 text-center">
                    {uploadingId === trip.id ? (
                        <div className="flex justify-center items-center text-blue-600 text-xs font-medium animate-pulse">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Subiendo...
                        </div>
                    ) : (
                        <div className="flex justify-center items-center gap-2">
                            {/* Botón de Carga (input oculto) */}
                            <label className="cursor-pointer group relative">
                                <input 
                                    type="file" 
                                    accept=".pdf,.jpg,.png" 
                                    className="hidden" 
                                    onChange={(e) => handleFileUpload(e, trip.id)}
                                />
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 shadow-sm flex items-center">
                                    <UploadCloud className="w-4 h-4" />
                                    <span className="ml-2 text-xs font-semibold">Cargar</span>
                                </div>
                            </label>

                            {/* Botón de Ver Factura (Nueva Pestaña) */}
                            {trip.facturaUrl && (
                                <button 
                                    onClick={() => handleViewInvoice(trip.facturaUrl!)}
                                    className="p-2 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                                    title="Abrir Factura en Nueva Pestaña"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                  </td>
                </tr>
              ))}
              
              {visibleTrips.length === 0 && (
                  <tr>
                      <td colSpan={5} className="p-12 text-center">
                          <div className="flex flex-col items-center justify-center text-slate-400">
                             <FileText className="w-12 h-12 mb-3 opacity-20" />
                             <p className="text-sm">No hay viajes que coincidan con los filtros.</p>
                          </div>
                      </td>
                  </tr>
              )}
            </tbody>
        </table>
      </div>
    </div>
  );
};
