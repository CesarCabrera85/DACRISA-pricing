import { GoogleGenAI } from '@google/genai';
import { CustomerType, Customer } from '../types';

// The API key is injected by the environment.
// Do not add your own key here.
const apiKey = process.env.API_KEY;

if (!apiKey) {
  // In a real app, you'd want to handle this more gracefully.
  // For this context, we'll log an error.
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: apiKey! });

export const classifyCustomer = async (name: string, address: string): Promise<Omit<Customer, 'id' | 'fecha_registro'>> => {
  let placeData: { place_id?: string; name?: string; visible_category?: string; formatted_address?: string; } = {};

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `Based on the following business details, find its information on Google Maps and return ONLY a single JSON object string with the fields: "place_id", "name", "visible_category", and "formatted_address". The "visible_category" should be the primary category text displayed to users on the Google Maps listing (e.g., "Restaurante chino", "Hotel", "Bar"). Do not include any other text, explanations, or markdown formatting.

Business Name: "${name}"
Business Address: "${address}"

If the place cannot be found, return a JSON object with empty strings, like this: {"place_id": "", "name": "${name}", "visible_category": "", "formatted_address": "${address}"}`;
    
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    let jsonString = response.text.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.substring(7, jsonString.length - 3).trim();
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.substring(3, jsonString.length - 3).trim();
    }
    
    placeData = JSON.parse(jsonString);

  } catch (error) {
    console.error('Error fetching place data with Gemini:', error);
    // Continue with the provided name and address if API fails
  }
  
  const visibleCategory = (placeData.visible_category || '').toLowerCase();
  let customerType = CustomerType.BASE;

  // Strict rule priority: CHINO -> HINDÚ -> HOTEL/CATERING -> HOSTELERÍA -> BASE
  const chinoKeywords = ["chino", "asiático", "asia", "oriental", "wok"];
  const hinduKeywords = ["indio", "hindú", "kebab", "shawarma", "tandoori", "curry"];
  const hotelKeywords = ["hotel", "hostal", "resort", "apartahotel", "catering", "banquetes", "eventos"];
  const hosteleriaKeywords = ["restaurante", "bar", "cafetería", "taberna", "cervecería"];

  const categoryMatches = (keywords: string[]) => keywords.some(kw => visibleCategory.includes(kw));

  if (categoryMatches(chinoKeywords)) {
      customerType = CustomerType.CHINO;
  } else if (categoryMatches(hinduKeywords)) {
      customerType = CustomerType.HINDU;
  } else if (categoryMatches(hotelKeywords)) {
      customerType = CustomerType.HOTEL_CATERING_VOLUMEN;
  } else if (categoryMatches(hosteleriaKeywords)) {
      customerType = CustomerType.HOSTELERIA;
  }
  
  // If none of the above match, it remains CustomerType.BASE by default.

  return {
    tipo_cliente: customerType,
    placeId: placeData.place_id,
    googleMapsCategory: placeData.visible_category,
    nombre: placeData.name || name,
    direccion: placeData.formatted_address || address,
  };
};