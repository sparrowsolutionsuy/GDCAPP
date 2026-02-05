import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Client, Trip } from '../src/types';
import { DEPARTAMENTOS, MAP_CENTER, MAP_ZOOM } from '../src/constants';
import { Search, Phone, Truck, X, MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix para iconos de Leaflet en producción
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
      // 1. Limpieza de datos (Doble check por si el backend falla)
      // Aseguramos que sea string, cambiamos coma por punto y parseamos
      const latRaw = String(c.latitud).replace(',', '.');
      const lngRaw = String(c.longitud).replace(',', '.');
      const lat = parseFloat(latRaw);
      const lng = parseFloat(lngRaw);
      
      // Validamos que sea un número real y que no sea 0 (coordenada default errónea)
      const isValidCoord = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

      // 2. Filtros de UI
      const matchesDept = selectedDept === 'Todos' || c.departamento === selectedDept;
      const matchesSearch = c.nombreComercial.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (c.rut && c.rut.includes(searchTerm));
      
      return isValidCoord && matchesDept && matchesSearch;
    });
  }, [clients, selectedDept, searchTerm]);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-4 animate-fade-in">
      
      {/* Barra de control */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center z-10">
        <div className="flex items-center gap-2">
            <MapPin className="text-blue-600 w-5 h-5" />
            <h2 className="font-bold text-slate-800">Mapa de Clientes</h2>
        </div>
        
        <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="p-2.5 bg-slate-50 border rounded-lg text-sm font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100">
          <option value="Todos">Todos los Departamentos</option>
          {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o RUT..." 
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full"><X className="w-3 h-3 text-slate-500"/></button>}
        </div>
        
        <div className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
            {filteredClients.length} Puntos Activos
        </div>
      </div>

      {/* Contenedor del Mapa */}
      <div className="flex-1 rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 relative z-0">
        <MapContainer center={MAP_CENTER} zoom={MAP_ZOOM} style={{ height: '100%', width: '100%' }}>
          <TileLayer 
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          
          {filteredClients.map(client => {
             // Parseo redundante para asegurar renderizado en el bucle
             const lat = parseFloat(String(client.latitud).replace(',', '.'));
             const lng = parseFloat(String(client.longitud).replace(',', '.'));
             
             return (
                <Marker 
                  key={client.id} 
                  position={[lat, lng]} 
                  icon={customIcon}
                >
                  <Popup>
                    <div className="min-w-[200px]">
                      <h3 className="font-bold text-blue-900 text-base mb-1">{client.nombreComercial}</h3>
                      <div className="flex items-center text-xs text-slate-500 mb-2 font-mono bg-slate-100 p-1 rounded w-fit">
                          RUT: {client.rut}
                      </div>
                      <p className="text-xs text-slate-600 mb-2 flex items-center">
                          <MapPin className="w-3 h-3 mr-1 text-slate-400"/> {client.localidad}, {client.departamento}
                      </p>
                      
                      <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
                        <p className="text-xs flex items-center text-slate-600">
                            <Phone className="w-3 h-3 mr-1.5 text-green-600"/> {client.telefono}
                        </p>
                        <p className="text-xs flex items-center text-blue-700 font-bold bg-blue-50 p-1 rounded">
                            <Truck className="w-3 h-3 mr-1.5"/> 
                            {trips.filter(t => t.clientId === client.id).length} Viajes registrados
                        </p>
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
