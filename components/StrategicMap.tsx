import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { Client, Trip } from '../src/types';
import { DEPARTAMENTOS } from '../src/constants';
import { Search, MapPin, Truck, Phone, X, Mail, Hash, Navigation, Globe } from 'lucide-react';

// Importación obligatoria del CSS de Leaflet
import 'leaflet/dist/leaflet.css';

// Configuración de Icono Personalizado
const customIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [41, 41]
});

// LÍMITES DE URUGUAY (Para que el mapa no se mueva a otros países)
const URUGUAY_BOUNDS: L.LatLngBoundsExpression = [
  [-35.5, -58.5], // Suroeste
  [-30.0, -53.0]  // Noreste
];

const URUGUAY_CENTER: [number, number] = [-32.5228, -55.7658];

export const StrategicMap: React.FC<{ clients: Client[]; trips: Trip[] }> = ({ clients, trips }) => {
  const [selectedDept, setSelectedDept] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrado optimizado y seguro
  const filteredClients = useMemo(() => {
    if (!clients || !Array.isArray(clients)) return [];

    return clients.filter(c => {
      const lat = parseFloat(String(c?.latitud || '').replace(',', '.'));
      const lng = parseFloat(String(c?.longitud || '').replace(',', '.'));
      
      // Validar que las coordenadas estén dentro del rango lógico de Uruguay
      const hasValidCoords = !isNaN(lat) && !isNaN(lng) && lat < -29 && lat > -36;

      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        (c?.nombreComercial || '').toLowerCase().includes(search) || 
        (c?.rut || '').includes(search) ||
        (c?.email || '').toLowerCase().includes(search);
      
      const matchesDept = selectedDept === 'Todos' || c?.departamento === selectedDept;

      return hasValidCoords && matchesSearch && matchesDept;
    });
  }, [clients, selectedDept, searchTerm]);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-4 font-sans animate-fade-in">
      
      {/* BARRA DE FILTROS */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center z-[1000]">
        <div className="flex items-center gap-3 pr-4 border-r border-slate-100">
            <div className="bg-blue-900 p-2 rounded-lg text-white">
                <Globe className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
                <h2 className="font-bold text-slate-800 text-sm leading-none">Operativa Uruguay</h2>
                <span className="text-[10px] text-slate-400 font-medium">GDC Logistics</span>
            </div>
        </div>
        
        <select 
            value={selectedDept} 
            onChange={(e) => setSelectedDept(e.target.value)} 
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none hover:border-blue-500 cursor-pointer"
        >
            <option value="Todos">Todos los Departamentos</option>
            {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por RUT, Nombre o Email..." 
            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-200 rounded-full">
                <X className="w-3.5 h-3.5 text-slate-500"/>
            </button>
          )}
        </div>
      </div>

      {/* MAPA RESTRINGIDO A URUGUAY */}
      <div className="flex-1 rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-slate-100 relative z-0">
        <MapContainer 
            center={URUGUAY_CENTER} 
            zoom={7} 
            minZoom={7}
            maxZoom={18}
            maxBounds={URUGUAY_BOUNDS} // Restringe el mapa a Uruguay
            maxBoundsViscosity={1.0}    // Hace que el rebote sea sólido
            zoomControl={false}
            style={{ height: '100%', width: '100%' }}
        >
          <ZoomControl position="bottomright" />
          
          {/* TileLayer Ligera (CartoDB Voyager) */}
          <TileLayer 
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
            attribution='&copy; GDC Logistics - Uruguay'
          />
          
          {filteredClients.map(client => {
             const lat = parseFloat(String(client.latitud).replace(',', '.'));
             const lng = parseFloat(String(client.longitud).replace(',', '.'));
             const clientTrips = trips.filter(t => t.clientId === client.id);
             
             return (
                <Marker 
                  key={client.id} 
                  position={[lat, lng]} 
                  icon={customIcon}
                >
                  <Popup minWidth={280} className="custom-popup">
                    <div className="p-1 font-sans">
                      {/* Cabecera de la Tarjeta */}
                      <div className="flex justify-between items-start mb-2">
                        <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded italic">
                           ID: {client.id}
                        </span>
                        <div className="flex items-center text-[9px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                           <Hash className="w-2.5 h-2.5 mr-1"/> {client.rut}
                        </div>
                      </div>

                      <h3 className="font-extrabold text-slate-900 text-base leading-tight mb-1">
                        {client.nombreComercial}
                      </h3>
                      <p className="text-[11px] text-slate-500 mb-3 flex items-center font-medium">
                        <MapPin className="w-3 h-3 mr-1 text-red-500 shrink-0"/> {client.localidad}, {client.departamento}
                      </p>
                      
                      {/* Bloque de Contacto Detallado */}
                      <div className="space-y-2 border-t border-slate-100 pt-3 mb-3">
                        <a href={`tel:${client.telefono}`} className="flex items-center text-xs text-blue-600 hover:underline bg-blue-50/50 p-2 rounded-lg transition-colors">
                            <Phone className="w-3.5 h-3.5 mr-2 shrink-0"/>
                            {client.telefono || 'Sin teléfono'}
                        </a>
                        
                        <a href={`mailto:${client.email}`} className="flex items-center text-xs text-slate-600 hover:text-blue-600 p-2 rounded-lg border border-slate-50 hover:border-blue-100 transition-all">
                            <Mail className="w-3.5 h-3.5 mr-2 shrink-0 text-slate-400"/>
                            <span className="truncate">{client.email || 'Sin correo registrado'}</span>
                        </a>
                      </div>

                      {/* Resumen de Actividad */}
                      <div className="bg-blue-900 text-white p-3 rounded-xl flex items-center justify-between shadow-md">
                          <div className="flex items-center">
                              <Truck className="w-4 h-4 mr-2 text-blue-300"/>
                              <div className="flex flex-col">
                                <span className="text-[9px] uppercase font-bold text-blue-200 leading-none mb-1 text-left">Actividad</span>
                                <span className="text-xs font-bold leading-none">Viajes Realizados</span>
                              </div>
                          </div>
                          <span className="text-lg font-black bg-white/20 px-3 py-1 rounded-lg">
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
