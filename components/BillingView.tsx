import React, { useState } from 'react';
import { Trip, TripStatus, Client } from '../src/types';
import { UploadCloud, CheckCircle, Loader2, ExternalLink, Calendar, Search, Filter, X, Receipt } from 'lucide-react';

interface BillingViewProps {
  trips: Trip[];
  clients: Client[];
  onInvoiceUploaded: (tripId: string, url: string) => void;
}

export const BillingView: React.FC<BillingViewProps> = ({ trips, clients, onInvoiceUploaded }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'closed'>('pending');

  // Filtrado Seguro
  const visibleTrips = trips.filter(t => {
      if (activeTab === 'pending' && t.estado !== TripStatus.COMPLETED) return false;
      if (activeTab === 'closed' && t.estado !== TripStatus.CLOSED) return false;
      return true;
  });

  // Función segura para obtener nombre de cliente
  const getClientName = (id: string) => {
    const c = clients.find(client => client.id === id);
    return c ? c.nombreComercial : 'Cliente Desconocido';
  };

  // Función segura para obtener RUT
  const getClientRut = (id: string) => {
    const c = clients.find(client => client.id === id);
    return c ? c.rut : '---';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center">
              <Receipt className="mr-2 text-blue-600"/> Facturación
           </h2>
           <p className="text-slate-500 text-sm">Gestión de cobros pendientes y realizados</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border shadow-sm">
            <button onClick={() => setActiveTab('pending')} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === 'pending' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Pendientes</button>
            <button onClick={() => setActiveTab('closed')} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === 'closed' ? 'bg-green-600 text-white' : 'text-slate-500'}`}>Facturados</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
         {visibleTrips.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
               <Receipt className="w-16 h-16 mx-auto mb-4 opacity-20"/>
               <p>No hay viajes en esta categoría.</p>
            </div>
         ) : (
             <table className="w-full text-left">
                <thead className="bg-slate-50 border-b">
                   <tr>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Fecha</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Cliente</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">RUT</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Monto Estimado</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">Estado</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                   {visibleTrips.map(trip => {
                      const amount = (Number(trip.pesoKg)/1000) * Number(trip.tarifa);
                      return (
                          <tr key={trip.id} className="hover:bg-slate-50">
                             <td className="p-4 font-mono text-slate-600">{trip.fecha}</td>
                             <td className="p-4 font-bold text-blue-900">{getClientName(trip.clientId)}</td>
                             <td className="p-4 text-slate-500">{getClientRut(trip.clientId)}</td>
                             <td className="p-4 text-right font-mono font-bold text-green-700">
                                {amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                             </td>
                             <td className="p-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${trip.estado === TripStatus.COMPLETED ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                   {trip.estado === TripStatus.COMPLETED ? 'PENDIENTE' : 'PAGADO'}
                                </span>
                             </td>
                          </tr>
                      );
                   })}
                </tbody>
             </table>
         )}
      </div>
    </div>
  );
};
