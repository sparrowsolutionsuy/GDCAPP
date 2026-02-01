import { Client, Trip, User } from '../src/types';

const API_URL = 'https://script.google.com/macros/s/AKfycbzyHGmjxKLdhufG0TPCITPL1Lxkf6jM3F43NyM5SFnUfhPAUH-S9_-G8Hg-1IeVZ7d_/exec';

// Cambia a true solo si quieres probar sin internet
const IS_MOCK = false;

/**
 * Obtiene todos los datos
 */
export const fetchLogisticsData = async () => {
  if (IS_MOCK) return null;
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

/**
 * Login de usuario
 */
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
    // Fallback local por seguridad
    if (username === 'admin' && password === 'admin123') {
      return { username: 'admin', nombre: 'Admin (Offline)', role: 'admin' };
    }
    return null;
  }
};

/**
 * Guardar nuevo viaje
 */
export const saveTripToSheet = async (trip: Trip) => {
  try {
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ type: 'trip', data: trip }) });
    return true;
  } catch (error) { return false; }
};

/**
 * ACTUALIZAR VIAJE (Requerido por TripManager)
 */
export const updateTripInSheet = async (trip: Trip) => {
  try {
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ type: 'updateTrip', data: trip }) });
    return true;
  } catch (error) { return false; }
};

/**
 * ELIMINAR VIAJE (Requerido por TripManager)
 */
export const deleteTripInSheet = async (tripId: string) => {
  try {
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ type: 'deleteTrip', data: { id: tripId } }) });
    return true;
  } catch (error) { return false; }
};

/**
 * Guardar cliente
 */
export const saveClientToSheet = async (client: Client) => {
  try {
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ type: 'client', data: client }) });
    return true;
  } catch (error) { return false; }
};

/**
 * Subir Factura
 */
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
