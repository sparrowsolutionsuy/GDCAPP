import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Client, Trip } from '../src/types';
import { DEPARTAMENTOS } from '../src/constants';
import { Search, MapPin, Truck, Phone, X, Info, Mail, Hash, Navigation } from 'lucide-react';

// Importación obligatoria del CSS de Leaflet
import 'leaflet/dist/leaflet.css';

// Configuración de Icono Personalizado (Solución definitiva para iconos rotos)
const customIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [41, 41]
});

// Valores por defecto en caso de que las constantes no carguen
const DEFAULT_CENTER: [number, number] = [-32.5228, -55.7658]; // Centro de Uruguay
const DEFAULT_ZOOM = 7;

export const StrategicMap: React.FC<{ clients: Client[]; trips: Trip[] }> = ({ clients, trips }) => {
  const [selectedDept, setSelectedDept] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Filtrado ultra-seguro
  const filteredClients = useMemo(() => {
    if (!Array.isArray(clients)) return [];

    return clients.filter(c => {
      if (!c) return false;

      // Limpieza de coordenadas (soporta string con coma, punto o números directos)
      const lat = parseFloat(String(c.latitud || '').replace(',', '.'));
      const lng = parseFloat(String(c.longitud || '').replace(',', '.'));
      
      // Solo mostramos si tiene coordenadas válidas en Uruguay (aprox)
      const hasValidCoords = !isNaN(lat) && !isNaN(lng) && lat < -30 && lat > -36;

      const name = (c.nombreComercial || '').toLowerCase();
      const rut = (c.rut || '').toLowerCase();
      const search = searchTerm.toLowerCase();
      
      const matchesSearch = name.includes(search) || rut.includes(search);
      const matchesDept = selectedDept === 'Todos' || c.departamento === selectedDept;

      return hasValidCoords && matchesSearch && matchesDept;
    });
  }, [clients, selectedDept, searchTerm]);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-4 animate-fade-in font-sans">
      
      {/* BARRA DE BUSQUEDA Y FILTROS */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center z-10">
        <div className="flex items-center gap-3 pr-4 border-r border-slate-100">
            <div className="bg-blue-900 p-2 rounded-lg">
                <Navigation className="text-white w-5 h-5" />
            </div>
            <h2 className="font-extrabold text-slate-800 hidden sm:block">Logística Estratégica</h2>
        </div>
        
        <select 
            value={selectedDept} 
            onChange={(e) => setSelectedDept(e.target.value)} 
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none hover:border-blue-400 transition-all cursor-pointer"
        >
            <option value="Todos">Todo Uruguay</option>
            {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por cliente o RUT..." 
            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-200 rounded-full">
                <X className="w-3.5 h-3.5 text-slate-500"/>
            </button>
          )}
        </div>
        
        <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-blue-800">{filteredClients.length} Clientes</span>
        </div>
      </div>

      {/* MAPA PRINCIPAL */}
      <div className="flex-1 rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-slate-100 relative z-0">
        <MapContainer 
            center={DEFAULT_CENTER} 
            zoom={DEFAULT_ZOOM} 
            zoomControl={false}
            style={{ height: '100%', width: '100%' }}
        >
          <ZoomControl position="bottomright" />
          {/* TileLayer de alto rendimiento (OSM HOT) */}
          <TileLayer 
            url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" 
            attribution='&copy; OpenStreetMap contributors'
          />
          
          {filteredClients.map(client => {
             // Parseo seguro dentro del loop
             const lat = parseFloat(String(client.latitud).replace(',', '.'));
             const lng = parseFloat(String(client.longitud).replace(',', '.'));
             const clientTrips = trips.filter(t => t.clientId === client.id);
             
             return (
                <Marker 
                  key={client.id} 
                  position={[lat, lng]} 
                  icon={customIcon}
                >
                  <Popup maxWidth={300} minWidth={250}>
                    <div className="p-1 font-sans">
                      <div className="flex justify-between items-start mb-2">
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                           {client.id}
                        </span>
                        <p className="text-[10px] font-mono text-slate-400">{client.rut}</p>
                      </div>

                      <h3 className="font-extrabold text-slate-900 text-base leading-tight mb-2">
                        {client.nombreComercial}
                      </h3>
                      
                      <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3">
                        <div className="flex items-center text-xs text-slate-600">
                            <MapPin className="w-3.5 h-3.5 mr-2 text-blue-500 shrink-0"/>
                            {client.localidad}, {client.departamento}
                        </div>
                        <div className="flex items-center text-xs text-slate-600">
                            <Phone className="w-3.5 h-3.5 mr-2 text-blue-500 shrink-0"/>
                            {client.telefono}
                        </div>
                      </div>

                      <div className="bg-white border border-blue-100 p-2 rounded-lg flex items-center justify-between">
                          <div className="flex items-center">
                              <Truck className="w-4 h-4 mr-2 text-blue-600"/>
                              <span className="text-xs font-bold text-slate-700">Viajes Totales</span>
                          </div>
                          <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-black">
                              {clientTrips.length}
                          </span>
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
