import { GoogleGenAI } from "@google/genai";
import { Client, Trip, AIInsight } from "../types";
import { BASE_GDC } from "../constants";

// NOTE: In a real environment, the API key should be in process.env.API_KEY
// and accessed via a backend proxy to keep it secure.
// For this frontend demo, we assume process.env.API_KEY is available.

export const generateLogisticsInsights = async (
  trips: Trip[],
  clients: Client[]
): Promise<AIInsight[]> => {
  try {
    if (!process.env.API_KEY) {
      console.warn("Gemini API Key missing");
      return [
        {
          title: "Configuración Requerida",
          description: "Agregue su API Key de Gemini para obtener insights de IA.",
          type: "info"
        }
      ];
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const activeTrips = trips.filter(t => t.estado === 'En Curso' || t.estado === 'Programado');
    
    // Construct a context-aware prompt
    const prompt = `
      Actúa como un Gerente de Logística Experto para GDC (Transporte de Carga en Uruguay).
      Nuestra Base Operativa está en: ${BASE_GDC.nombre} (Lat: ${BASE_GDC.lat}, Lng: ${BASE_GDC.lng}).
      
      Analiza los siguientes datos y proporciona 3 sugerencias breves y estratégicas para optimizar la logística.
      PRIORIDAD: Optimizar "viajes de retorno" (backhaul) que minimicen el desvío hacia la base en ${BASE_GDC.nombre} desde los puntos de destino actuales.
      
      Clientes Disponibles (Ubicaciones):
      ${JSON.stringify(clients.map(c => ({ nombre: c.nombreComercial, loc: c.localidad, dep: c.departamento, lat: c.latitud, lng: c.longitud })))}
      
      Viajes Activos (Donde quedarán los camiones):
      ${JSON.stringify(activeTrips.map(t => ({ id: t.id, origen: t.origen, destino: t.destino, estado: t.estado, carga: t.contenido })))}
      
      Devuelve SOLO un array JSON válido con la siguiente estructura:
      [
        { "title": "Título corto", "description": "Explicación de 1 frase enfocada en retorno a base o eficiencia", "type": "optimization" | "alert" | "info" }
      ]
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return [];

    const insights = JSON.parse(text) as AIInsight[];
    return insights;

  } catch (error) {
    console.error("Error fetching Gemini insights:", error);
    return [
      {
        title: "Error de IA",
        description: "No se pudieron generar sugerencias en este momento.",
        type: "alert"
      }
    ];
  }
};