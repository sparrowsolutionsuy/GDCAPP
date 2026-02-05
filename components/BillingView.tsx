import React, { useState } from 'react';
import { Trip, TripStatus, Client } from '../src/types';
import { uploadInvoice } from '../services/api'; // Importamos tu función existente
import { 
  UploadCloud, CheckCircle, Loader2, ExternalLink, 
  Search, Receipt, FileText, Filter 
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

  const visibleTrips = trips.filter(t => {
      if (activeTab === 'pending' && t.estado !== TripStatus.COMPLETED) return false;
      if (activeTab === 'closed' && t.estado !== TripStatus.CLOSED) return false;

      const client = clients.find(c => c.id === t.clientId);
      const search = filters.searchId.toLowerCase();
      
      const matchSearch = 
        (t.id && t.id.toLowerCase().includes(search)) || 
        (client?.rut && client.rut.includes(search));

      if (filters.searchId && !matchSearch) return false;
      if (filters.clientId && t.clientId !== filters.clientId) return false;
      if (filters.dateStart && t.fecha < filters.dateStart) return false;
      if (filters.dateEnd && t.fecha > filters.dateEnd) return false;

      return true;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, trip: Trip) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(trip.id);

    try {
      // Usamos la función uploadInvoice que ya tienes en api.ts
      // Nota: api.ts espera (tripId, file). Asegúrate de que coincida.
      const uploadedUrl = await uploadInvoice(trip.id, file);

      if (uploadedUrl) {
        onInvoiceUploaded(trip.id, uploadedUrl);
        alert("✅ Factura cargada correctamente.");
      } else {
        alert("⚠️ Error al cargar. Revise la consola.");
      }
    } catch (err) {
      alert("❌ Error de conexión.");
    } finally {
      setUploadingId(null);
      e.target.value = ''; 
    }
  };

  return (
    <div className="space-y-6 p-4 animate-fade-in">
      {/* HEADER DE PESTAÑAS */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit border border-slate-200 shadow-sm">
        <button 
            onClick={() => setActiveTab('pending')}
            className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'pending' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Receipt className="w-4 h-4 mr-2" /> Pendientes
        </button>
        <button 
            onClick={() => setActiveTab('closed')}
            className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'closed' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <CheckCircle className="w-4 h-4 mr-2" /> Cerrados
        </button>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Buscar ID o RUT..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none" value={filters.searchId} onChange={e => setFilters({...filters, searchId: e.target.value})} />
          </div>
          <div>
              <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" value={filters.clientId} onChange={e => setFilters({...filters, clientId: e.target.value})}>
                  <option value="">Todos los clientes</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.nombreComercial}</option>)}
              </select>
          </div>
          <input type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 outline-none" value={filters.dateStart} onChange={e => setFilters({...filters, dateStart: e.target.value})} />
          <input type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 outline-none" value={filters.dateEnd} onChange={e => setFilters({...filters, dateEnd: e.target.value})} />
      </div>

      {/* TABLA DE FACTURACIÓN */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-bold text-slate-600">ID Viaje</th>
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
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{client?.nombreComercial || 'S/D'}</div>
                    <div className="text-[10px] text-slate-400">RUT: {client?.rut || '-'}</div>
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
                          {/* Botón de Carga */}
                          <label className="p-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 border border-blue-100 transition-all shadow-sm" title="Subir Factura">
                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, trip)} accept=".pdf,image/*" />
                            <UploadCloud className="w-4 h-4" />
                          </label>
                          
                          {/* Botón de Ver (Abre nueva pestaña) */}
                          {trip.facturaUrl && (
                            <button 
                                onClick={() => window.open(trip.facturaUrl, '_blank')} 
                                className="p-2 bg-white text-slate-600 rounded-lg hover:text-blue-600 hover:bg-slate-50 border border-slate-200 transition-all shadow-sm"
                                title="Abrir factura en nueva pestaña"
                            >
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
          <div className="p-16 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="italic font-medium">No se encontraron viajes con los filtros actuales.</p>
          </div>
        )}
      </div>
    </div>
  );
};
