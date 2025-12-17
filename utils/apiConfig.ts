import AsyncStorage from '@react-native-async-storage/async-storage';

const API_CONFIG_KEY = '@mariam_pos_api_url';
const DEFAULT_API_URL = 'http://192.168.0.17:3001';

/**
 * Obtiene la URL de la API configurada o retorna la URL por defecto
 */
export const getApiUrl = async (): Promise<string> => {
  try {
    const savedUrl = await AsyncStorage.getItem(API_CONFIG_KEY);
    return savedUrl || DEFAULT_API_URL;
  } catch (error) {
    console.error('Error al obtener la configuración de la API:', error);
    return DEFAULT_API_URL;
  }
};

/**
 * Guarda la URL de la API en el almacenamiento local
 */
export const saveApiUrl = async (url: string): Promise<boolean> => {
  try {
    // Validar que la URL tenga un formato básico válido
    if (!url || !url.trim()) {
      throw new Error('La URL no puede estar vacía');
    }

    // Validar formato básico de URL
    try {
      new URL(url);
    } catch {
      throw new Error('La URL no tiene un formato válido');
    }

    await AsyncStorage.setItem(API_CONFIG_KEY, url.trim());
    return true;
  } catch (error) {
    console.error('Error al guardar la configuración de la API:', error);
    throw error;
  }
};

/**
 * Obtiene la URL de la API de forma síncrona (retorna la por defecto si no está cargada)
 * Útil para inicialización rápida
 */
export const getDefaultApiUrl = (): string => {
  return DEFAULT_API_URL;
};

