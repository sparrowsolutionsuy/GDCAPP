import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Client, Trip } from '../src/types';
import { DEPARTAMENTOS, MAP_CENTER, MAP_ZOOM } from '../src/constants';
import { MapPin, Truck, Mail, Phone, Search, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const customIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

interface StrategicMapProps {
  clients: Client[];
  trips: Trip[];
}

export const StrategicMap: React.FC<StrategicMapProps> = ({ clients, trips }) => {
  const [selectedDept, setSelectedDept] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchesDept = selectedDept === 'Todos' || c.departamento === selectedDept;
      const matchesSearch = c.nombreComercial.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.localidad.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDept && matchesSearch;
    });
  }, [clients, selectedDept, searchTerm]);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-4">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          <span className="text-slate-500 mr-2 text-sm font-medium">Depto:</span>
          <select 
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-transparent outline-none text-sm font-semibold text-slate-700"
          >
            <option value="Todos">Todos</option>
            {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Buscar cliente por nombre o localidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 rounded-xl overflow-hidden shadow-inner border border-slate-200 z-0">
        <MapContainer center={MAP_CENTER} zoom={MAP_ZOOM} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {filteredClients.map(client => {
            const lat = parseFloat(client.latitud as any);
            const lng = parseFloat(client.longitud as any);
            if (isNaN(lat) || isNaN(lng)) return null;

            return (
              <Marker key={client.id} position={[lat, lng]} icon={customIcon}>
                <Popup>
                  <div className="p-1">
                    <h3 className="font-bold text-blue-900 text-base">{client.nombreComercial}</h3>
                    <p className="text-xs text-slate-500 mb-2">{client.localidad}, {client.departamento}</p>
                    <div className="space-y-1 text-xs">
                      <p className="flex items-center"><Mail className="w-3 h-3 mr-1"/> {client.email}</p>
                      <p className="flex items-center"><Phone className="w-3 h-3 mr-1"/> {client.telefono}</p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};
