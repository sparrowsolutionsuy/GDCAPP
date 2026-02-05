import React, { useState } from 'react';
import { Trip, TripStatus, Client } from '../src/types';
import { uploadInvoice } from '../services/api';
import { 
  UploadCloud, CheckCircle, Loader2, ExternalLink, 
  Search, RefreshCw, Filter, FileText 
} from 'lucide-react';

interface BillingViewProps {
  trips: Trip[];
  clients: Client[];
  onInvoiceUploaded: (tripId: string, url: string) => void;
}

export const BillingView: React.FC<BillingViewProps> = ({ trips, clients, onInvoiceUploaded }) => {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'closed'>('pending');
  const [filters, setFilters] = useState({ dateStart: '', dateEnd: '', clientId: '', searchId: '' });

  const visibleTrips = (trips || []).filter(t => {
      if (!t) return false;
      if (activeTab === 'pending' && t.estado !== TripStatus.COMPLETED) return false;
      if (activeTab === 'closed' && t.estado !== TripStatus.CLOSED) return false;

      const client = clients.find(c => c.id === t.clientId);
      const searchLower = (filters.searchId || '').toLowerCase();
      const tripIdStr = String(t.id || '').toLowerCase();
      const clientRutStr = String(client?.rut || '').toLowerCase();
      
      if (filters.searchId && !tripIdStr.includes(searchLower) && !clientRutStr.includes(searchLower)) return false;
      if (filters.clientId && t.clientId !== filters.clientId) return false;
      if (filters.dateStart && t.fecha < filters.dateStart) return false;
      if (filters.dateEnd && t.fecha > filters.dateEnd) return false;
      return true;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, tripId: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setUploadingId(tripId);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        try {
            const base64Data = (reader.result as string).split(',')[1];
            // Llamada al servicio API
            const response = await uploadInvoice(tripId, base64Data, file.name, file.type);
            
            if (response && response.status === 'success') {
                onInvoiceUploaded(tripId, response.url);
                alert("Factura cargada y viaje cerrado con éxito.");
            } else {
                alert("Error del servidor: " + (response?.message || "Desconocido"));
            }
        } catch (err) {
            console.error(err);
            alert("Error crítico al subir archivo.");
        } finally {
            setUploadingId(null);
        }
    };
  };

  const handleViewInvoice = (url: string) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans text-slate-600">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 inline-flex">
          <button onClick={() => setActiveTab('pending')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center ${activeTab === 'pending' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}>
            <UploadCloud className="w-4 h-4 mr-2" /> Pendientes
          </button>
          <button onClick={() => setActiveTab('closed')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center ${activeTab === 'closed' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500'}`}>
            <CheckCircle className="w-4 h-4 mr-2" /> Facturadas / Cerradas
          </button>
        </div>
        <button onClick={() => window.location.reload()} className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 px-4 py-2 rounded-lg flex items-center text-sm font-bold">
           <RefreshCw className="w-4 h-4 mr-2 text-blue-600" /> Actualizar
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4 relative">
             <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
             <input type="text" placeholder="Buscar ID o RUT..." className="w-full pl-9 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={filters.searchId} onChange={e => setFilters({...filters, searchId: e.target.value})} />
          </div>
          <div className="md:col-span-3">
            <select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={filters.clientId} onChange={e => setFilters({...filters, clientId: e.target.value})}>
                <option value="">Todos los Clientes</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nombreComercial}</option>)}
            </select>
          </div>
          <div className="md:col-span-5 flex gap-2">
            <input type="date" className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" onChange={e => setFilters({...filters, dateStart: e.target.value})} />
            <input type="date" className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" onChange={e => setFilters({...filters, dateEnd: e.target.value})} />
          </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase border-b">
              <tr>
                <th className="p-4">ID Viaje</th>
                <th className="p-4">Cliente</th>
                <th className="p-4 text-right">Monto</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleTrips.map(trip => (
                <tr key={trip.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-mono text-xs font-bold">{trip.id}</td>
                  <td className="p-4 font-bold">{clients.find(c => c.id === trip.clientId)?.nombreComercial || 'S/D'}</td>
                  <td className="p-4 text-right">USD {Math.round(trip.tarifa * (trip.pesoKg / 1000)).toLocaleString()}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${trip.facturaUrl ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {trip.facturaUrl ? 'CARGADA' : 'PENDIENTE'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                        {uploadingId === trip.id ? (
                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        ) : (
                            <>
                                <label className="cursor-pointer p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-100">
                                    <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, trip.id)} />
                                    <UploadCloud className="w-4 h-4" />
                                </label>
                                {trip.facturaUrl && (
                                    <button onClick={() => handleViewInvoice(trip.facturaUrl!)} className="p-2 bg-slate-50 text-slate-600 hover:text-blue-600 rounded-lg border border-slate-200">
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
        {visibleTrips.length === 0 && <div className="p-10 text-center text-slate-400 italic">No se encontraron registros.</div>}
      </div>
    </div>
  );
};
