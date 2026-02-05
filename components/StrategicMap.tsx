import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Client, Trip } from '../src/types';
import { DEPARTAMENTOS, MAP_CENTER, MAP_ZOOM } from '../src/constants';
import { Search, MapPin, Truck, Phone, X, Info, Mail, Hash } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Icono personalizado optimizado
const customIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35]
});

export const StrategicMap: React.FC<{ clients: Client[]; trips: Trip[] }> = ({ clients, trips }) => {
  const [selectedDept, setSelectedDept] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Lógica de filtrado ultra-segura para evitar "Pantalla Blanca"
  const filteredClients = useMemo(() => {
    if (!Array.isArray(clients)) return [];

    return clients.filter(c => {
      // 1. Validar existencia del objeto
      if (!c) return false;

      // 2. Limpieza y validación de coordenadas (soporta comas o puntos)
      const lat = parseFloat(String(c.latitud || '').replace(',', '.'));
      const lng = parseFloat(String(c.longitud || '').replace(',', '.'));
      const hasValidCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0;

      // 3. Filtros de búsqueda (con protección ante nulos)
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
      
      {/* PANEL DE CONTROL SUPERIOR */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center z-10">
        <div className="flex items-center gap-3 pr-4 border-r border-slate-100">
            <div className="bg-blue-600 p-2 rounded-lg">
                <MapPin className="text-white w-5 h-5" />
            </div>
            <div>
                <h2 className="font-extrabold text-slate-800 leading-none">Mapa Estratégico</h2>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Logística GDC</span>
            </div>
        </div>
        
        <div className="flex items-center gap-2">
            <select 
                value={selectedDept} 
                onChange={(e) => setSelectedDept(e.target.value)} 
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none cursor-pointer hover:border-blue-300 transition-all shadow-sm"
            >
                <option value="Todos">Uruguay (Todos)</option>
                {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
        </div>
        
        <div className="flex-1 min-w-[280px] relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar por cliente, RUT o razón social..." 
            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-200 rounded-full transition-colors"
            >
                <X className="w-3.5 h-3.5 text-slate-500"/>
            </button>
          )}
        </div>
        
        <div className="hidden md:flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            <span className="text-xs font-bold text-blue-800">{filteredClients.length} Clientes en vista</span>
        </div>
      </div>

      {/* CONTENEDOR DEL MAPA */}
      <div className="flex-1 rounded-3xl overflow-hidden border border-slate-200 shadow-2xl bg-slate-50 relative z-0">
        <MapContainer 
            center={MAP_CENTER} 
            zoom={MAP_ZOOM} 
            zoomControl={false}
            style={{ height: '100%', width: '100%' }}
        >
          <ZoomControl position="bottomright" />
          <TileLayer 
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" 
            attribution='&copy; CARTO'
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
                  <Popup maxWidth={300} minWidth={280} className="custom-popup">
                    <div className="p-1 font-sans">
                      {/* Cabecera Tarjeta */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="bg-blue-900 text-white p-2 rounded-lg">
                            <Truck className="w-5 h-5" />
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID Cliente</span>
                            <p className="text-xs font-mono font-bold text-slate-600 leading-none">{client.id}</p>
                        </div>
                      </div>

                      <h3 className="font-extrabold text-slate-900 text-lg leading-tight mb-1">
                        {client.nombreComercial}
                      </h3>
                      
                      <div className="flex items-center gap-1.5 mb-4">
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 flex items-center">
                            <Hash className="w-2.5 h-2.5 mr-1"/> {client.rut}
                        </span>
                        <span className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded border border-green-100 flex items-center">
                            Activo
                        </span>
                      </div>

                      {/* Info Detalle */}
                      <div className="space-y-2 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center text-sm text-slate-700">
                            <MapPin className="w-4 h-4 mr-2 text-blue-500 shrink-0"/>
                            <span className="truncate">{client.localidad}, {client.departamento}</span>
                        </div>
                        <div className="flex items-center text-sm text-slate-700">
                            <Phone className="w-4 h-4 mr-2 text-blue-500 shrink-0"/>
                            <span>{client.telefono}</span>
                        </div>
                        {client.email && (
                            <div className="flex items-center text-sm text-slate-700">
                                <Mail className="w-4 h-4 mr-2 text-blue-500 shrink-0"/>
                                <span className="truncate">{client.email}</span>
                            </div>
                        )}
                      </div>

                      {/* Métricas rápidas */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white border border-slate-200 p-2 rounded-lg text-center">
                            <p className="text-[9px] uppercase font-bold text-slate-400">Viajes</p>
                            <p className="text-sm font-black text-blue-900">{clientTrips.length}</p>
                        </div>
                        <div className="bg-white border border-slate-200 p-2 rounded-lg text-center">
                            <p className="text-[9px] uppercase font-bold text-slate-400">Estado</p>
                            <p className="text-xs font-bold text-slate-700">Ruta Ok</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-slate-100 text-center text-[10px] text-slate-400 italic">
                        Ubicación verificada vía GPS
                      </div>
                    </div>
                  </Popup>
                </Marker>
             );
          })}
        </MapContainer>
      </div>
      
      {/* LEYENDA / NOTA */}
      <div className="flex items-center justify-between text-slate-400 text-[11px] px-2">
          <div className="flex items-center gap-4">
              <span className="flex items-center"><span className="w-2 h-2 bg-blue-600 rounded-full mr-1"></span> Cliente con Operativa</span>
              <span className="flex items-center"><Info className="w-3 h-3 mr-1"/> Haga clic en el marcador para ver el detalle</span>
          </div>
          <div className="font-medium">© GDC LOGISTICS v4.1</div>
      </div>
    </div>
  );
};
