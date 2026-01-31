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
  rut: string;      // Registro Único Tributario (12 digits)
  email: string;
  telefono: string;
}

export interface Trip {
  id: string;
  fecha: string; // ISO date string
  clientId: string;
  estado: TripStatus;
  contenido: string; // Product (Soja, Maíz, etc.)
  pesoKg: number;
  kmRecorridos: number;
  tarifa: number; // Price per Ton (USD/Ton)
  origen: string;
  destino: string;
  facturaUrl?: string;
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
