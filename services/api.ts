import { Client, Trip, User } from '../src/types';

const API_URL = 'https://script.google.com/macros/s/AKfycbzyHGmjxKLdhufG0TPCITPL1Lxkf6jM3F43NyM5SFnUfhPAUH-S9_-G8Hg-1IeVZ7d_/exec';

// 1. Obtener datos (Viajes y Clientes)
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

// 2. Login REAL conectado al Sheets
export const loginUser = async (username: string, password: string): Promise<User | null> => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ type: 'login', data: { username, password } })
    });
    const result = await response.json();
    if (result.status === 'success') return result.user;
    return null;
  } catch (error) {
    console.error("Error en login:", error);
    // Fallback para admin si falla la conexión
    if (username === 'admin' && password === 'admin123') {
      return { username: 'admin', nombre: 'Admin (Offline)', role: 'admin' };
    }
    return null;
  }
};

// 3. Funciones de Guardar y Actualizar (Necesarias para que compile)
export const saveTripToSheet = async (trip: Trip) => {
  try {
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ type: 'trip', data: trip }) });
    return true;
  } catch (error) { return false; }
};

export const updateTripInSheet = async (trip: Trip) => {
  try {
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ type: 'updateTrip', data: trip }) });
    return true;
  } catch (error) { return false; }
};

export const deleteTripInSheet = async (tripId: string) => {
  try {
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ type: 'deleteTrip', data: { id: tripId } }) });
    return true;
  } catch (error) { return false; }
};

export const saveClientToSheet = async (client: Client) => {
  try {
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ type: 'client', data: client }) });
    return true;
  } catch (error) { return false; }
};

// 4. Subida de facturas
export const uploadInvoice = async (tripId: string, clientName: string, file: File): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64Data = (reader.result as string).split(',')[1];
        const response = await fetch(API_URL, {
          method: 'POST',
          body: JSON.stringify({
            type: 'uploadInvoice',
            data: { tripId, fileData: base64Data, fileName: file.name, mimeType: file.type }
          })
        });
        const result = await response.json();
        if (result.status === 'success') resolve(result.url);
        else reject(result.message);
      } catch (error) { reject(error); }
    };
  });
};
