import { Client, Trip, User } from '../src/types';

// REEMPLAZA ESTA URL POR LA DE TU IMPLEMENTACIÓN EN GOOGLE APPS SCRIPT
const API_URL = 'https://script.google.com/macros/s/AKfycbzyHGmjxKLdhufG0TPCITPL1Lxkf6jM3F43NyM5SFnUfhPAUH-S9_-G8Hg-1IeVZ7d_/exec';

/**
 * Obtiene todos los datos de logística (Viajes y Clientes)
 */
export const fetchLogisticsData = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Error en la respuesta del servidor');
    const data = await response.json();
    return {
      clients: data.clients as Client[],
      trips: data.trips as Trip[]
    };
  } catch (error) {
    console.error("Error al obtener datos:", error);
    return null;
  }
};

/**
 * Guarda un nuevo cliente en Google Sheets
 */
export const saveClientToSheet = async (client: Client) => {
  try {
    // Usamos 'text/plain' para evitar problemas de CORS con Google Apps Script
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors', 
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ type: 'client', data: client })
    });
    return true; 
  } catch (error) {
    console.error("Error al guardar cliente:", error);
    return false;
  }
};

/**
 * Guarda un nuevo viaje en Google Sheets
 */
export const saveTripToSheet = async (trip: Trip) => {
  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ type: 'trip', data: trip })
    });
    return true;
  } catch (error) {
    console.error("Error al guardar viaje:", error);
    return false;
  }
};

/**
 * Maneja el inicio de sesión
 */
export const loginUser = async (username: string, password: string): Promise<User | null> => {
  // Puerta trasera de emergencia
  if (username === 'admin' && password === 'admin123') {
    return { username: 'admin', nombre: 'Administrador Maestro', role: 'admin' };
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ type: 'login', data: { username, password } })
    });
    const result = await response.json();
    if (result.status === 'success') return result.user;
    return null;
  } catch (error) {
    return null;
  }
};
