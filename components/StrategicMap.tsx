import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Client, Trip } from '../src/types';
import { DEPARTAMENTOS, MAP_CENTER, MAP_ZOOM } from '../src/constants';
import { Search, MapPin, Truck, Mail, Phone, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const customIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

export const StrategicMap: React.FC<{ clients: Client[]; trips: Trip[] }> = ({ clients, trips }) => {
  const [selectedDept, setSelectedDept] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      // Limpiar coordenadas por si vienen con coma desde Sheets
      const lat = parseFloat(String(c.latitud).replace(',', '.'));
      const lng = parseFloat(String(c.longitud).replace(',', '.'));
      const isValid = !isNaN(lat) && !isNaN(lng);
      
      const matchesDept = selectedDept === 'Todos' || c.departamento === selectedDept;
      const matchesSearch = c.nombreComercial.toLowerCase().includes(searchTerm.toLowerCase());
      
      return isValid && matchesDept && matchesSearch;
    });
  }, [clients, selectedDept, searchTerm]);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-4">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
        <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="p-2.5 bg-slate-50 border rounded-lg text-sm font-bold text-slate-700 outline-none">
          <option value="Todos">Todos los Departamentos</option>
          {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar cliente por nombre o RUT..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-slate-300 hover:text-slate-600"/></button>}
        </div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{filteredClients.length} Puntos localizados</div>
      </div>

      <div className="flex-1 rounded-3xl overflow-hidden border-4 border-white shadow-2xl z-0">
        <MapContainer center={MAP_CENTER} zoom={MAP_ZOOM} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {filteredClients.map(client => (
            <Marker 
              key={client.id} 
              position={[parseFloat(String(client.latitud).replace(',','.')), parseFloat(String(client.longitud).replace(',','.'))]} 
              icon={customIcon}
            >
              <Popup>
                <div className="p-1">
                  <h3 className="font-bold text-blue-900 text-base">{client.nombreComercial}</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">{client.localidad}</p>
                  <div className="space-y-1 border-t pt-2">
                     <p className="text-xs flex items-center"><Phone className="w-3 h-3 mr-1"/> {client.telefono}</p>
                     <p className="text-xs flex items-center text-blue-600 font-bold"><Truck className="w-3 h-3 mr-1"/> {trips.filter(t => t.clientId === client.id).length} Viajes realizados</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};
