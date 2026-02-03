import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Client, Trip } from '../src/types';
import { DEPARTAMENTOS, MAP_CENTER, MAP_ZOOM } from '../src/constants';
import { Search, MapPin, Truck, X } from 'lucide-react';
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
      // Limpieza de coordenadas: Google Maps a veces da comas
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
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-4 items-center">
        <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="p-2 bg-slate-50 border rounded-lg text-sm font-semibold">
          <option value="Todos">Todos los Departamentos</option>
          {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar cliente por nombre comercial..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 rounded-2xl overflow-hidden border-4 border-white shadow-xl z-0">
        <MapContainer center={MAP_CENTER} zoom={MAP_ZOOM} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {filteredClients.map(client => (
            <Marker 
              key={client.id} 
              position={[parseFloat(String(client.latitud).replace(',','.')), parseFloat(String(client.longitud).replace(',','.'))]} 
              icon={customIcon}
            >
              <Popup>
                <div className="p-2 font-sans">
                  <h3 className="font-bold text-blue-900">{client.nombreComercial}</h3>
                  <p className="text-xs text-slate-500 flex items-center mt-1"><MapPin className="w-3 h-3 mr-1"/>{client.localidad}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};
