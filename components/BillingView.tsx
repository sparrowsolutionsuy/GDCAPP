import React, { useState } from 'react';
// IMPORTANTE: Ruta corregida según tu estructura de carpetas
import { Trip, TripStatus, Client } from '../src/types';
import { uploadInvoice } from '../services/api';
import { 
  UploadCloud, CheckCircle, Loader2, ExternalLink, 
  Calendar, Search, X, Receipt, Filter, FileText 
} from 'lucide-react';

interface BillingViewProps {
  trips: Trip[];
  clients: Client[];
  onInvoiceUploaded: (tripId: string, url: string) => void;
}

export const BillingView: React.FC<BillingViewProps> = ({ trips, clients, onInvoiceUploaded }) => {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'closed'>('pending');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Filtros
  const [filters, setFilters] = useState({
      dateStart: '',
      dateEnd: '',
      clientId: '',
      searchId: ''
  });

  // Lógica de filtrado de viajes
  const visibleTrips = trips.filter(t => {
      // 1. Filtro por pestaña (Pendientes de Facturar vs Cerrados)
      if (activeTab === 'pending' && t.estado !== TripStatus.COMPLETED) return false;
      if (activeTab === 'closed' && t.estado !== TripStatus.CLOSED) return false;

      // 2. Filtro de búsqueda (ID o RUT)
      const client = clients.find(c => c.id === t.clientId);
      const searchMatch = 
        t.id.toLowerCase().includes(filters.searchId.toLowerCase()) || 
        (client?.rut && client.rut.includes(filters.searchId));
      
      if (filters.searchId && !searchMatch) return false;

      // 3. Filtro por Cliente
      if (filters.clientId && t.clientId !== filters.clientId) return false;

      // 4. Filtro por Fecha
      if (filters.dateStart && t.fecha < filters.dateStart) return false;
      if (filters.dateEnd && t.fecha > filters.dateEnd) return false;

      return true;
  });

  const handleFileUpload = async (trip: Trip, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(trip.id);
    try {
      const url = await uploadInvoice(trip.id, file);
      if (url) {
        onInvoiceUploaded(trip.id, url);
        alert("Factura cargada con éxito. El viaje ya puede ser cerrado en el Gestor de Viajes.");
      }
    } catch (error) {
      console.error("Error subiendo factura:", error);
      alert("Error al subir el archivo.");
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans text-slate-600">
      
      {/* HEADER Y TABS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 inline-flex">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'pending' 
                ? 'bg-white text-blue-900 shadow-sm border border-slate-100' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Pendientes de Facturar
          </button>
          <button
            onClick={() => setActiveTab('closed')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'closed' 
                ? 'bg-white text-blue-900 shadow-sm border border-slate-100' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Viajes Cerrados
          </button>
        </div>
      </div>

      {/* BARRA DE FILTROS (Fiel a la captura) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4 relative">
             <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="Buscar por ID de viaje o RUT..." 
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
                <option value="">Filtrar por Cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nombreComercial}</option>)}
            </select>
          </div>
          <div className="md:col-span-5 flex gap-2">
            <div className="relative flex-1">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input type="date" className="w-full pl-9 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500" onChange={e => setFilters({...filters, dateStart: e.target.value})} />
            </div>
            <div className="relative flex-1">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input type="date" className="w-full pl-9 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500" onChange={e => setFilters({...filters, dateEnd: e.target.value})} />
            </div>
          </div>
        </div>
      </div>

      {/* TABLA DE FACTURACIÓN */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="p-4">ID Viaje</th>
              <th className="p-4">Cliente / RUT</th>
              <th className="p-4">Monto Total</th>
              <th className="p-4 text-center">Factura</th>
              <th className="p-4 text-center">Estado Fiscal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleTrips.map(trip => {
              const client = clients.find(c => c.id === trip.clientId);
              const totalAmount = trip.tarifa * (trip.pesoKg / 1000);

              return (
                <tr key={trip.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-mono text-xs font-bold text-blue-900">{trip.id}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{client?.nombreComercial || 'Desconocido'}</div>
                    <div className="text-xs text-slate-400 font-mono">RUT: {client?.rut || 'N/A'}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-xs text-slate-400">USD {trip.tarifa} / ton</div>
                    <div className="font-bold text-slate-800">USD {totalAmount.toLocaleString()}</div>
                  </td>
                  <td className="p-4 text-center">
                    {trip.facturaUrl ? (
                      <button 
                        onClick={() => setPreviewUrl(trip.facturaUrl!)}
                        className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-xs font-bold"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1.5" /> Ver PDF
                      </button>
                    ) : (
                      <div className="relative inline-block">
                        <input 
                            type="file" 
                            accept=".pdf,image/*" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                            onChange={(e) => handleFileUpload(trip, e)}
                            disabled={uploadingId === trip.id}
                        />
                        <button className={`inline-flex items-center px-4 py-1.5 bg-blue-900 text-white rounded-lg transition-all text-xs font-bold shadow-sm ${uploadingId === trip.id ? 'opacity-50' : 'hover:bg-blue-800'}`}>
                          {uploadingId === trip.id ? (
                            <><Loader2 className="w-3 h-3 mr-2 animate-spin" /> Subiendo...</>
                          ) : (
                            <><UploadCloud className="w-3.5 h-3.5 mr-2" /> Cargar Factura</>
                          )}
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {trip.facturaUrl ? (
                      <span className="inline-flex items-center px-2.5 py-1 bg-green-100 text-green-800 rounded-full text-[10px] font-black uppercase tracking-tighter">
                        <CheckCircle className="w-3 h-3 mr-1" /> Lista para Cierre
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] font-black uppercase tracking-tighter">
                        Pendiente Carga
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {visibleTrips.length === 0 && (
                <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 italic bg-slate-50/30">
                        <Receipt className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        No se encontraron viajes en este estado.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE VISTA PREVIA PDF */}
      {previewUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-slate-800 flex items-center text-sm uppercase tracking-wider">
                          <ExternalLink className="w-4 h-4 mr-2" /> Vista Previa de Factura Digital
                      </h3>
                      <button 
                        onClick={() => setPreviewUrl(null)} 
                        className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                      >
                        <X className="w-6 h-6" />
                      </button>
                  </div>
                  <div className="flex-1 bg-slate-200">
                      <iframe 
                        src={previewUrl} 
                        className="w-full h-full border-none" 
                        title="Invoice Preview" 
                      />
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
