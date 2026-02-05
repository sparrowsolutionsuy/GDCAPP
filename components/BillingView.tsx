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

  // Función para normalizar el URL de Google Drive
  // Esto asegura que el enlace siempre sea el de "Vista" (el que funcionaba primero)
  const getCleanUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('drive.google.com')) {
        // Extrae el ID del archivo y recompone el link en formato /view
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            return `https://drive.google.com/file/d/${match[1]}/view?usp=sharing`;
        }
    }
    return url;
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // Lógica de filtrado protegida contra valores nulos/undefined
  const visibleTrips = (trips || []).filter(t => {
      if (!t) return false;

      // 1. Filtro por pestaña
      if (activeTab === 'pending' && t.estado !== TripStatus.COMPLETED) return false;
      if (activeTab === 'closed' && t.estado !== TripStatus.CLOSED) return false;

      // 2. Filtro de búsqueda (ID o RUT)
      const client = clients.find(c => c.id === t.clientId);
      const searchLower = (filters.searchId || '').toLowerCase();
      const tripIdStr = String(t.id || '').toLowerCase();
      const clientRutStr = String(client?.rut || '').toLowerCase();
      
      if (filters.searchId && !tripIdStr.includes(searchLower) && !clientRutStr.includes(searchLower)) {
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, tripId: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setUploadingId(tripId);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const success = await uploadInvoice(tripId, base64Data, file.name, file.type);
        
        if (success && success.url) {
            onInvoiceUploaded(tripId, success.url);
            setTimeout(() => setUploadingId(null), 1000);
        } else {
            alert("Error al subir la factura.");
            setUploadingId(null);
        }
    };
    reader.onerror = () => {
        alert("Error al leer el archivo.");
        setUploadingId(null);
    };
  };

  const handleViewInvoice = (url: string) => {
    const cleanUrl = getCleanUrl(url);
    if (cleanUrl) {
        window.open(cleanUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans text-slate-600">
      
      {/* CABECERA CON BOTONES DE NAVEGACIÓN Y REFRESH */}
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
            Pendientes
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

        <button 
          onClick={handleRefresh}
          className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 px-4 py-2 rounded-lg flex items-center shadow-sm transition-all text-sm font-bold"
        >
           <RefreshCw className="w-4 h-4 mr-2 text-blue-600" /> Actualizar Datos
        </button>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4 relative">
             <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="Buscar por ID o RUT..." 
               className="w-full pl-9 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
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
          <div className="md:col-span-5 flex gap-2">
            <input type="date" className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" onChange={e => setFilters({...filters, dateStart: e.target.value})} />
            <input type="date" className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" onChange={e => setFilters({...filters, dateEnd: e.target.value})} />
          </div>
        </div>
      </div>

      {/* TABLA DE FACTURACIÓN */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase border-b border-slate-200">
              <tr>
                <th className="p-4">ID Viaje</th>
                <th className="p-4">Cliente / RUT</th>
                <th className="p-4 text-right">Monto (USD)</th>
                <th className="p-4 text-center">Factura</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleTrips.map(trip => (
                <tr key={trip.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="font-mono text-xs font-bold text-slate-700">{trip.id}</div>
                    <div className="text-[10px] text-slate-400">{trip.fecha}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{getClientName(trip.clientId)}</div>
                    <div className="text-xs text-slate-500">RUT: {getClientRut(trip.clientId)}</div>
                  </td>
                  <td className="p-4 text-right font-medium text-slate-700">
                    USD {Math.round(trip.tarifa * (trip.pesoKg / 1000)).toLocaleString()}
                  </td>
                  <td className="p-4 text-center">
                    {trip.facturaUrl ? (
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">CARGADA</span>
                    ) : (
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200">PENDIENTE</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                        {uploadingId === trip.id ? (
                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        ) : (
                            <>
                                <label className="cursor-pointer p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100" title="Subir Factura">
                                    <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, trip.id)} />
                                    <UploadCloud className="w-4 h-4" />
                                </label>
                                {trip.facturaUrl && (
                                    <button 
                                        onClick={() => handleViewInvoice(trip.facturaUrl!)}
                                        className="p-2 bg-slate-50 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
                                        title="Ver Factura (Nueva Pestaña)"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
        </table>
        {visibleTrips.length === 0 && (
            <div className="p-12 text-center text-slate-400">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p>No se encontraron viajes para mostrar.</p>
            </div>
        )}
      </div>
    </div>
  );
};
