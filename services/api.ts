import { Client, Trip, User } from '../src/types';

const API_URL = 'https://script.google.com/macros/s/AKfycbzyHGmjxKLdhufG0TPCITPL1Lxkf6jM3F43NyM5SFnUfhPAUH-S9_-G8Hg-1IeVZ7d_/exec';

// 1. OBTENER DATOS (GET)
export const fetchLogisticsData = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Error en red');
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

// 2. GUARDAR CLIENTE
export const saveClientToSheet = async (client: Client) => {
  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ type: 'client', data: client })
    });
    return true;
  } catch (error) { return false; }
};

// 3. GUARDAR VIAJE
export const saveTripToSheet = async (trip: Trip) => {
  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ type: 'trip', data: trip })
    });
    return true;
  } catch (error) { return false; }
};

// 4. ACTUALIZAR VIAJE
export const updateTripInSheet = async (trip: Trip) => {
  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ type: 'updateTrip', data: trip })
    });
    return true;
  } catch (error) { return false; }
};

// 5. BORRAR VIAJE
export const deleteTripInSheet = async (tripId: string) => {
  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ type: 'deleteTrip', data: { id: tripId } })
    });
    return true;
  } catch (error) { return false; }
};

// 6. SUBIR FACTURA (La que faltaba para el Build)
export const uploadInvoice = async (tripId: string, clientName: string, file: File): Promise<string | null> => {
  return new Promise((resolve) => {
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
        resolve(result.status === 'success' ? result.url : null);
      } catch (error) {
        console.error("Error upload:", error);
        resolve(null);
      }
    };
  });
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
