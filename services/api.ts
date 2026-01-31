import { Client, Trip, TripStatus, User } from '../types';

// TODO: Replace this URL with your deployed Google Apps Script Web App URL
const API_URL = 'https://script.google.com/macros/s/AKfycbzyHGmjxKLdhufG0TPCITPL1Lxkf6jM3F43NyM5SFnUfhPAUH-S9_-G8Hg-1IeVZ7d_/exec';

export const fetchLogisticsData = async () => {
  if (API_URL === 'https://script.google.com/macros/s/AKfycbzyHGmjxKLdhufG0TPCITPL1Lxkf6jM3F43NyM5SFnUfhPAUH-S9_-G8Hg-1IeVZ7d_/exec') {
    console.warn("API URL not configured. Using Mock Data.");
    return null;
  }

  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    return {
      clients: data.clients as Client[],
      trips: data.trips as Trip[]
    };
  } catch (error) {
    console.error("Failed to fetch data from Google Sheets", error);
    return null;
  }
};

export const loginUser = async (username: string, password: string): Promise<User | null> => {
  if (API_URL === 'INSERT_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
    // Mock login logic
    if (username === 'admin' && password === 'admin123') {
      return { username: 'admin', nombre: 'Administrador General', role: 'admin' };
    }
    if (username === 'operativo' && password === 'op123') {
      return { username: 'operativo', nombre: 'Chofer Operativo', role: 'operativo' };
    }
    return null;
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ 
        type: 'login', 
        data: { username, password } 
      })
    });
    const result = await response.json();
    
    if (result.status === 'success') {
      return result.user;
    }
    return null;
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};

export const saveTripToSheet = async (trip: Trip) => {
  if (API_URL === 'INSERT_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
    console.warn("API URL not configured. Mock save.");
    return true;
  }

  try {
    await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ type: 'trip', data: trip })
    });
    return true;
  } catch (error) {
    console.error("Failed to save trip", error);
    return false;
  }
};

export const updateTripInSheet = async (trip: Trip) => {
  if (API_URL === 'INSERT_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
    return true;
  }
  try {
    await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ type: 'updateTrip', data: trip })
    });
    return true;
  } catch (error) {
    console.error("Failed to update trip", error);
    return false;
  }
};

export const deleteTripInSheet = async (tripId: string) => {
  if (API_URL === 'INSERT_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
    return true;
  }
  try {
    await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ type: 'deleteTrip', data: { id: tripId } })
    });
    return true;
  } catch (error) {
    console.error("Failed to delete trip", error);
    return false;
  }
};

export const saveClientToSheet = async (client: Client) => {
  if (API_URL === 'INSERT_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
    console.warn("API URL not configured. Mock save.");
    return true;
  }

  try {
    await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ type: 'client', data: client })
    });
    return true;
  } catch (error) {
    console.error("Failed to save client", error);
    return false;
  }
};

export const uploadInvoice = async (tripId: string, clientName: string, file: File): Promise<string | null> => {
  if (API_URL === 'INSERT_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
    console.warn("API URL not configured. Mock upload.");
    return "https://mock.url/factura.pdf";
  }

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
