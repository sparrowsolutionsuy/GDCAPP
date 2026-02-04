export enum TripStatus {
  PROGRAMMED = 'Programado',
  IN_PROGRESS = 'En Curso',
  COMPLETED = 'Finalizado',
  CLOSED = 'Cerrado'
}

export type UserRole = 'admin' | 'operativo';

export interface User {
  username: string;
  nombre: string;
  role: UserRole;
}

export interface Client {
  id: string;
  nombreComercial: string;
  departamento: string;
  localidad: string;
  latitud: number;
  longitud: number;
  rut: string;      
  email: string;
  telefono: string;
}

export interface Trip {
  id: string;
  fecha: string; 
  clientId: string;
  estado: TripStatus;
  contenido: string; 
  pesoKg: number;
  kmRecorridos: number;
  tarifa: number; // USD por Tonelada
  origen: string;
  destino: string;
  facturaUrl?: string;
  tipoCambio: number; // Cotización UYU del día
}

export interface KPIMetrics {
  totalTonelaje: number;
  totalFacturacion: number;
  beneficioPorKm: number;
  eficienciaRetorno: number;
}

export interface AIInsight {
  title: string;
  description: string;
  type: 'optimization' | 'alert' | 'info';
}
