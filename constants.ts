import { Client, Trip, TripStatus } from './types';

// Uruguay Departments
export const DEPARTAMENTOS = [
  'Artigas', 'Canelones', 'Cerro Largo', 'Colonia', 'Durazno', 
  'Flores', 'Florida', 'Lavalleja', 'Maldonado', 'Montevideo', 
  'Paysandú', 'Río Negro', 'Rivera', 'Rocha', 'Salto', 
  'San José', 'Soriano', 'Tacuarembó', 'Treinta y Tres'
];

export const MOCK_CLIENTS: Client[] = [
  { id: 'C001', nombreComercial: 'AgroSoy S.A.', departamento: 'Soriano', localidad: 'Mercedes', latitud: -33.2524, longitud: -58.0305, rut: '219999990012', email: 'juan@agrosoy.com', telefono: '099123456' },
  { id: 'C002', nombreComercial: 'Granos del Norte', departamento: 'Paysandú', localidad: 'Paysandú', latitud: -32.3214, longitud: -58.0756, rut: '218888880019', email: 'admin@granosnorte.uy', telefono: '098765432' },
  { id: 'C003', nombreComercial: 'Logística Sur', departamento: 'Canelones', localidad: 'Pando', latitud: -34.7228, longitud: -55.9546, rut: '217777770015', email: 'ops@logisur.com', telefono: '091234567' },
  { id: 'C004', nombreComercial: 'Cerealera Central', departamento: 'Durazno', localidad: 'Durazno', latitud: -33.3806, longitud: -56.5233, rut: '216666660011', email: 'comercial@cerealera.uy', telefono: '092345678' },
  { id: 'C005', nombreComercial: 'Arrozal 33', departamento: 'Treinta y Tres', localidad: 'Vergara', latitud: -32.9333, longitud: -53.9333, rut: '215555550018', email: 'pedro@arrozal33.com', telefono: '093456789' },
];

export const MOCK_TRIPS: Trip[] = [
  { id: 'V1001', fecha: '2024-05-10', clientId: 'C001', estado: TripStatus.COMPLETED, contenido: 'Soja', pesoKg: 28000, kmRecorridos: 320, tarifa: 42, origen: 'Mercedes', destino: 'Montevideo' },
  { id: 'V1002', fecha: '2024-05-12', clientId: 'C002', estado: TripStatus.COMPLETED, contenido: 'Trigo', pesoKg: 30000, kmRecorridos: 380, tarifa: 45, origen: 'Paysandú', destino: 'Nueva Palmira' },
  { id: 'V1003', fecha: '2024-05-15', clientId: 'C003', estado: TripStatus.IN_PROGRESS, contenido: 'Maíz', pesoKg: 29000, kmRecorridos: 150, tarifa: 28, origen: 'Pando', destino: 'Montevideo' },
  { id: 'V1004', fecha: '2024-05-20', clientId: 'C004', estado: TripStatus.PROGRAMMED, contenido: 'Cebada', pesoKg: 27500, kmRecorridos: 210, tarifa: 35, origen: 'Durazno', destino: 'Fray Bentos' },
  { id: 'V1005', fecha: '2024-05-08', clientId: 'C001', estado: TripStatus.COMPLETED, contenido: 'Soja', pesoKg: 28500, kmRecorridos: 320, tarifa: 42, origen: 'Mercedes', destino: 'Montevideo' },
];

// Map Center (Uruguay)
export const MAP_CENTER: [number, number] = [-32.522779, -55.765835];
export const MAP_ZOOM = 7;

// Operational Base
export const BASE_GDC = {
  nombre: "Paso de los Toros",
  lat: -32.811, 
  lng: -56.520
};