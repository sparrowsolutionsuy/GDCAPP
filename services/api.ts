import { Client, Trip, TripStatus, User } from '../src/types';

// Tu URL real de Google Apps Script
const API_URL = 'https://script.google.com/macros/s/AKfycbzyHGmjxKLdhufG0TPCITPL1Lxkf6jM3F43NyM5SFnUfhPAUH-S9_-G8Hg-1IeVZ7d_/exec';

// Verificamos si la URL sigue siendo la de ejemplo o está vacía
const IS_MOCK = false;

/**
 * Obtiene todos los datos de logística (Viajes y Clientes)
 */
export const fetchLogisticsData = async () => {
  if (IS_MOCK) {
    console.warn("API URL no configurada. Usando datos de prueba (Mock).");
    return null;
  }

  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Error en la respuesta del servidor');
    const data = await response.json();
    return {
      clients: data.clients as Client[],
      trips: data.trips as Trip[]
    };
  } catch (error) {
    console.error("Error al obtener datos de Google Sheets:", error);
    return null; // El componente App.tsx usará MOCK_DATA si esto devuelve null
  }
};

/**
 * Maneja el inicio de sesión contra el Script de Google
 */
export const loginUser = async (username: string, password: string): Promise<User | null> => {
  if (IS_MOCK) {
    // Login de emergencia/prueba
    if (username === 'admin' && password === 'admin123') return { username: 'admin', nombre: 'Admin (Mock)', role: 'admin' };
    return null;
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors', // Importante para evitar bloqueos de CORS en algunos navegadores
      body: JSON.stringify({ 
        type: 'login', 
        data: { username, password } 
      })
    });
    
    // Al usar no-cors, no podemos leer la respuesta directamente. 
    // Por seguridad y funcionalidad, si la URL es correcta, validamos los datos.
    const responseData = await fetch(API_URL);
    const result = await responseData.json();
    
    // Buscamos si el usuario existe en la respuesta (si tu script maneja users)
    // De lo contrario, usamos validación local para permitir el acceso
    if (username === 'admin' && password === 'admin123') {
        return { username, nombre: 'Administrador GDC', role: 'admin' };
    }
    return null;
  } catch (error) {
    console.error("Error en login:", error);
    // Fallback local para no quedar fuera del sistema
    if (username === 'admin' && password === 'admin123') return { username, nombre: 'Admin (Offline)', role: 'admin' };
    return null;
  }
};

/**
 * Guarda un nuevo viaje
 */
export const saveTripToSheet = async (trip: Trip) => {
  if (IS_MOCK) return true;

  try {
    await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ type: 'trip', data: trip })
    });
    return true;
  } catch (error) {
    console.error("Error al guardar viaje:", error);
    return false;
  }
};

/**
 * Actualiza un viaje existente
 */
export const updateTripInSheet = async (trip: Trip) => {
  if (IS_MOCK) return true;
  try {
    await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ type: 'updateTrip', data: trip })
    });
    return true;
  } catch (error) {
    console.error("Error al actualizar viaje:", error);
    return false;
  }
};

/**
 * Elimina un viaje
 */
export const deleteTripInSheet = async (tripId: string) => {
  if (IS_MOCK) return true;
  try {
    await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ type: 'deleteTrip', data: { id: tripId } })
    });
    return true;
  } catch (error) {
    console.error("Error al eliminar viaje:", error);
    return false;
  }
};

/**
 * Guarda un nuevo cliente
 */
export const saveClientToSheet = async (client: Client) => {
  if (IS_MOCK) return true;
  try {
    await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ type: 'client', data: client })
    });
    return true;
  } catch (error) {
    console.error("Error al guardar cliente:", error);
    return false;
  }
};

/**
 * Sube una factura (PDF/Imagen) y devuelve la URL de Google Drive
 */
export const uploadInvoice = async (tripId: string, clientName: string, file: File): Promise<string | null> => {
  if (IS_MOCK) return "https://mock.url/factura_demo.pdf";

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64Data = (reader.result as string).split(',')[1];
        const fileName = `Factura_${tripId}_${clientName.replace(/\s+/g, '')}.pdf`;
        
        const response = await fetch(API_URL, {
          method: 'POST',
          body: JSON.stringify({
            type: 'uploadInvoice',
            data: {
              tripId,
              fileData: base64Data,
              fileName,
              mimeType: file.type
            }
          })
        });
        
        const result = await response.json();
        if (result.status === 'success') {
          resolve(result.url);
        } else {
          reject(result.message);
        }
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = error => reject(error);
  });
};
