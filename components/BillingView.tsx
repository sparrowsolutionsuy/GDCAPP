import React, { useState } from 'react';
import { Trip, TripStatus, Client } from '../src/types';
import { uploadInvoice } from '../services/api';
import { 
  UploadCloud, CheckCircle, Loader2, ExternalLink, 
  Search, RefreshCw, FileText 
} from 'lucide-center';

interface BillingViewProps {
  trips: Trip[];
  clients: Client[];
  onInvoiceUploaded: (tripId: string, url: string) => void;
}

export const BillingView: React.FC<BillingViewProps> = ({ trips, clients, onInvoiceUploaded }) => {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'closed'>('pending');
  const [filters, setFilters] = useState({ searchId: '', clientId: '', dateStart: '', dateEnd: '' });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, tripId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(tripId); // Inicia carga

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const response = await uploadInvoice(tripId, base64Data, file.name, file.type);

          if (response && response.status === 'success') {
            onInvoiceUploaded(tripId, response.url);
            alert("Factura cargada correctamente.");
          } else {
            alert("Error: " + (response?.message || "Respuesta fallida del servidor"));
          }
        } catch (err) {
          alert("Error en la conexión con Google AppScript.");
        } finally {
          setUploadingId(null); // Detiene carga siempre
        }
      };
    } catch (err) {
      alert("Error al procesar el archivo local.");
      setUploadingId(null);
    }
  };

  // Filtrado de viajes
  const visibleTrips = (trips || []).filter(t => {
    if (activeTab === 'pending' && t.estado !== TripStatus.COMPLETED) return false;
    if (activeTab === 'closed' && t.estado !== TripStatus.CLOSED) return false;
    
    const client = clients.find(c => c.id === t.clientId);
    const search = filters.searchId.toLowerCase();
    if (search && !t.id.toLowerCase().includes(search) && !client?.rut.includes(search)) return false;
    
    return true;
  });

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button onClick={() => setActiveTab('pending')} className={`px-4 py-2 rounded-md text-sm font-bold flex items-center ${activeTab === 'pending' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}>
            <UploadCloud className="w-4 h-4 mr-2" /> Pendientes
          </button>
          <button onClick={() => setActiveTab('closed')} className={`px-4 py-2 rounded-md text-sm font-bold flex items-center ${activeTab === 'closed' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500'}`}>
            <CheckCircle className="w-4 h-4 mr-2" /> Cerrados
          </button>
        </div>
        <button onClick={() => window.location.reload()} className="flex items-center text-sm font-bold text-slate-600 hover:text-blue-600">
          <RefreshCw className="w-4 h-4 mr-2" /> Actualizar
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-bold text-slate-600">ID Viaje</th>
              <th className="p-4 font-bold text-slate-600">Cliente</th>
              <th className="p-4 text-center font-bold text-slate-600">Factura</th>
              <th className="p-4 text-center font-bold text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleTrips.map(trip => (
              <tr key={trip.id} className="hover:bg-slate-50">
                <td className="p-4 font-mono font-bold text-xs">{trip.id}</td>
                <td className="p-4">{clients.find(c => c.id === trip.clientId)?.nombreComercial}</td>
                <td className="p-4 text-center">
                  {trip.facturaUrl ? (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-[10px] font-bold">CARGADA</span>
                  ) : (
                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-[10px] font-bold">PENDIENTE</span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex justify-center gap-2">
                    {uploadingId === trip.id ? (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    ) : (
                      <>
                        <label className="p-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 border border-blue-100">
                          <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, trip.id)} />
                          <UploadCloud className="w-4 h-4" />
                        </label>
                        {trip.facturaUrl && (
                          <button onClick={() => window.open(trip.facturaUrl, '_blank')} className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 border border-slate-200">
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
        {visibleTrips.length === 0 && <div className="p-10 text-center text-slate-400 italic">No hay viajes en esta sección.</div>}
      </div>
    </div>
  );
};
