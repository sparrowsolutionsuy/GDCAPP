import { Client, Trip, User } from '../src/types';

const API_URL = 'https://script.google.com/macros/s/AKfycbzyHGmjxKLdhufG0TPCITPL1Lxkf6jM3F43NyM5SFnUfhPAUH-S9_-G8Hg-1IeVZ7d_/exec';
const DRIVE_FOLDER_ID = '1YtZkI6d8zvGbtgUbb4nqSGl4wTwrvZQO';

// 1. OBTENER DATOS
export const fetchLogisticsData = async () => {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    return { 
      clients: (data.clients || []) as Client[], 
      trips: (data.trips || []) as Trip[] 
    };
  } catch (error) {
    console.error("Error fetch:", error);
    return null;
  }
};

// 2. SUBIR FACTURA A DRIVE (Corregido)
export const uploadInvoice = async (tripId: string, file: File): Promise<string | null> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64Data = (reader.result as string).split(',')[1];
        const fileName = `Factura_Viaje_${tripId}_${Date.now()}`;
        
        // No usamos no-cors aquí porque necesitamos leer la URL de respuesta
        const response = await fetch(API_URL, {
          method: 'POST',
          body: JSON.stringify({
            type: 'uploadInvoice',
            data: {
              tripId,
              fileData: base64Data,
              fileName,
              mimeType: file.type,
              folderId: DRIVE_FOLDER_ID // Enviamos el ID de la carpeta
            }
          })
        });
        
        const result = await response.json();
        if (result.status === 'success') {
          resolve(result.url);
        } else {
          console.error("Error en AppScript:", result.message);
          resolve(null);
        }
      } catch (error) {
        console.error("Error de conexión al subir factura:", error);
        resolve(null);
      }
    };
  });
};

// 3. ACTUALIZAR VIAJE (Para cambiar estado a COMPLETED o CLOSED)
export const updateTripInSheet = async (trip: Trip) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ type: 'updateTrip', data: trip })
    });
    const result = await response.json();
    return result.status === 'success';
  } catch (error) {
    return false;
  }
};

// 4. GUARDAR CLIENTE
export const saveClientToSheet = async (client: Client) => {
  try {
    await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ type: 'client', data: client })
    });
    return true;
  } catch (error) { return false; }
};

// 5. GUARDAR VIAJE
export const saveTripToSheet = async (trip: Trip) => {
  try {
    await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ type: 'trip', data: trip })
    });
    return true;
  } catch (error) { return false; }
};

// 6. ELIMINAR VIAJE
export const deleteTripInSheet = async (id: string) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ type: 'deleteTrip', data: { id } })
    });
    const result = await response.json();
    return result.status === 'success';
  } catch (error) { return false; }
};

// 7. LOGIN
export const loginUser = async (username: string, password: string): Promise<User | null> => {
  if (username === 'admin' && password === 'admin123') {
    return { username: 'admin', nombre: 'Administrador Maestro', role: 'admin' };
  }
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ type: 'login', data: { username, password } })
    });
    const result = await response.json();
    return result.status === 'success' ? result.user : null;
  } catch (error) { return null; }
};
