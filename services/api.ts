import { Client, Trip, User } from '../src/types';

const API_URL = 'https://script.google.com/macros/s/AKfycbzyHGmjxKLdhufG0TPCITPL1Lxkf6jM3F43NyM5SFnUfhPAUH-S9_-G8Hg-1IeVZ7d_/exec';

export const fetchLogisticsData = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Error en red');
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

export const loginUser = async (username: string, password: string): Promise<User | null> => {
  try {
    // 1. Intentamos validar con Google Sheets primero
    const response = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ 
        type: 'login', 
        data: { username, password } 
      })
    });
    
    const result = await response.json();
    
    if (result.status === 'success' && result.user) {
      return result.user; // Retorna el usuario REAL de la Sheet (incluyendo a pablo)
    }
    return null;
  } catch (error) {
    console.error("Error en login:", error);
    // Fallback de emergencia solo si no hay internet
    if (username === 'admin' && password === 'admin123') {
      return { username: 'admin', nombre: 'Admin (Offline)', role: 'admin' };
    }
    return null;
  }
};

export const saveTripToSheet = async (trip: Trip) => {
  try {
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ type: 'trip', data: trip }) });
    return true;
  } catch (error) { return false; }
};

export const saveClientToSheet = async (client: Client) => {
  try {
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ type: 'client', data: client }) });
    return true;
  } catch (error) { return false; }
};
