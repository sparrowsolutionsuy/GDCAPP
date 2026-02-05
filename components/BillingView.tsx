import React, { useState } from 'react';
import { Trip, TripStatus, Client } from '../src/types';
import { uploadInvoice } from '../services/api';
import { 
  UploadCloud, CheckCircle, Loader2, ExternalLink, 
  Calendar, Search, X, Receipt, Filter, FileText 
} from 'lucide-react'; // <-- CORREGIDO

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

  const visibleTrips = trips.filter(t => {
      if (activeTab === 'pending' && t.estado !== TripStatus.COMPLETED) return false;
      if (activeTab === 'closed' && t.estado !== TripStatus.CLOSED) return false;

      const client = clients.find(c => c.id === t.clientId);
      const rutMatch = client?.rut?.includes(filters.searchId) || false;
      const idMatch = t.id.toLowerCase().includes(filters.searchId.toLowerCase());
      
      if (filters.searchId && !idMatch && !rutMatch) return false;
      if (filters.clientId && t.clientId !== filters.clientId) return false;
      if (filters.dateStart && t.fecha < filters.dateStart) return false;
      if (filters.dateEnd && t.fecha > filters.dateEnd) return false;

      return true;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, tripId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(tripId);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = async () => {
      try {
        const base64Data = (reader.result as string).split(',')[1];
        const response = await uploadInvoice(tripId, base64Data, file.name, file.type);

        if (response && response.status === 'success') {
          onInvoiceUploaded(tripId, response.url);
          alert("Factura cargada y viaje cerrado con éxito.");
        } else {
          alert("Error del servidor: " + (response?.message || "No se pudo procesar el archivo."));
        }
      } catch (err) {
        alert("Falla de red. Verifique su conexión.");
      } finally {
        setUploadingId(null);
        e.target.value = '';
      }
    };
  };

  return (
    <div className="space-y-6 p-4 animate-fade-in">
      {/* Header con Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit border border-slate-200 shadow-sm">
            <button 
                onClick={() => setActiveTab('pending')}
                className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'pending' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Receipt className="w-4 h-4 mr-2" /> Pendientes de Facturar
            </button>
            <button 
                onClick={() => setActiveTab('closed')}
                className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'closed' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <CheckCircle className="w-4 h-4 mr-2" /> Viajes Cerrados
            </button>
          </div>
      </div>

      {/* Panel de Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Buscar ID o RUT</label>
              <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="GDC-XXX..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={filters.searchId} onChange={e => setFilters({...filters, searchId: e.target.value})} />
              </div>
          </div>
          <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Cliente</label>
              <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={filters.clientId} onChange={e => setFilters({...filters, clientId: e.target.value})}>
                  <option value="">Todos los clientes</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.nombreComercial}</option>)}
              </select>
          </div>
          <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Desde</label>
              <input type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={filters.dateStart} onChange={e => setFilters({...filters, dateStart: e.target.value})} />
          </div>
          <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Hasta</label>
              <input type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={filters.dateEnd} onChange={e => setFilters({...filters, dateEnd: e.target.value})} />
          </div>
      </div>

      {/* Tabla de Resultados */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-bold text-slate-600">ID Viaje</th>
              <th className="p-4 font-bold text-slate-600">Fecha</th>
              <th className="p-4 font-bold text-slate-600">Cliente / RUT</th>
              <th className="p-4 text-center font-bold text-slate-600">Estado</th>
              <th className="p-4 text-center font-bold text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleTrips.map(trip => {
              const client = clients.find(c => c.id === trip.clientId);
              return (
                <tr key={trip.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-mono font-bold text-xs text-blue-700">{trip.id}</td>
                  <td className="p-4 text-slate-500">{trip.fecha}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{client?.nombreComercial}</div>
                    <div className="text-[10px] text-slate-400">RUT: {client?.rut}</div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${trip.facturaUrl ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                      {trip.facturaUrl ? 'FACTURADO' : 'PENDIENTE'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      {uploadingId === trip.id ? (
                        <div className="flex items-center text-blue-600 text-xs font-bold animate-pulse">
                          <Loader2 className="w-4 h-4 animate-spin mr-1" /> Subiendo...
                        </div>
                      ) : (
                        <>
                          <label className="p-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 border border-blue-100 transition-all" title="Cargar Factura">
                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, trip.id)} accept=".pdf,image/*" />
                            <UploadCloud className="w-4 h-4" />
                          </label>
                          {trip.facturaUrl && (
                            <button onClick={() => setPreviewUrl(trip.facturaUrl!)} className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 border border-slate-200 transition-all">
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {visibleTrips.length === 0 && (
          <div className="p-20 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="italic">No se encontraron viajes con los filtros aplicados.</p>
          </div>
        )}
      </div>

      {/* Modal de Previsualización */}
      {previewUrl && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-zoom-in">
                <div className="p-4 border-b flex justify-between items-center bg-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Vista Previa de Factura</h3>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Documento Digitalizado</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={previewUrl} target="_blank" rel="noreferrer" className="flex items-center px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                        <ExternalLink className="w-4 h-4 mr-2" /> Expandir
                      </a>
                      <button onClick={() => setPreviewUrl(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                </div>
                <div className="flex-1 bg-slate-100 relative">
                    <iframe src={previewUrl} className="w-full h-full border-none shadow-inner" title="Invoice Preview" />
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
