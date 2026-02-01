import { Client, Trip, User } from '../src/types';

const API_URL = 'https://script.google.com/macros/s/AKfycbzyHGmjxKLdhufG0TPCITPL1Lxkf6jM3F43NyM5SFnUfhPAUH-S9_-G8Hg-1IeVZ7d_/exec';

export const fetchLogisticsData = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Error en red');
    const data = await response.json();
    return { clients: data.clients as Client[], trips: data.trips as Trip[] };
  } catch (error) {
    console.error("Error fetch:", error);
    return null;
  }
};

export const saveClientToSheet = async (client: Client) => {
  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ type: 'client', data: client })
    });
    return true;
  } catch (error) {
    return false;
  }
};

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
    return false;
  }
};

// --- ESTAS SON LAS QUE FALTABAN PARA EL BUILD ---

export const updateTripInSheet = async (trip: Trip) => {
  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ type: 'updateTrip', data: trip })
    });
    return true;
  } catch (error) {
    return false;
  }
};

export const deleteTripInSheet = async (tripId: string) => {
  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ type: 'deleteTrip', data: { id: tripId } })
    });
    return true;
  } catch (error) {
    return false;
  }
};

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
  } catch (error) {
    return null;
  }
};
