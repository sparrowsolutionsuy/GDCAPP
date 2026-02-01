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
    const response = await fetch(API_URL, {
      method: 'POST',
      // Eliminamos 'no-cors' para poder leer la respuesta JSON del script
      body: JSON.stringify({ 
        type: 'login', 
        data: { username, password } 
      })
    });
    
    const result = await response.json();
    
    if (result.status === 'success' && result.user) {
      return result.user; // Esto permitirá entrar a 'pablo' y 'admin1'
    }
    return null;
  } catch (error) {
    console.error("Error en login:", error);
    return null;
  }
};

// ... Mantén el resto de las funciones de guardado igual
