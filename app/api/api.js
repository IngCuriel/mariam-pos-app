import axios from "axios";
import { getApiUrl, getDefaultApiUrl } from "../../utils/apiConfig";

// URL por defecto (se actualizará cuando se cargue la configuración)
let API_URL = getDefaultApiUrl();

// Crear el cliente axios con la URL por defecto
const axiosClient = axios.create({
  baseURL: API_URL + "/api",
  timeout: 10000,
});

// Función para actualizar la URL de la API dinámicamente
export const updateApiUrl = async (newUrl) => {
  API_URL = newUrl;
  axiosClient.defaults.baseURL = API_URL + "/api";
};

export const getCurrentApiUrl = () => API_URL;

// Inicializar la URL de la API al cargar el módulo
getApiUrl().then((url) => {
  API_URL = url;
  // Actualizar el baseURL del cliente axios
  axiosClient.defaults.baseURL = API_URL + "/api";
});

axiosClient.interceptors.request.use((config) => {
  const token = '';
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log detallado del error para debugging
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
      });
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      console.error('API Error Request:', {
        message: error.message,
        code: error.code,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        timeout: error.config?.timeout,
      });
      console.error('No se recibió respuesta del servidor. Verifica:');
      console.error('1. Que el servidor esté corriendo');
      console.error('2. Que la IP sea correcta:', API_URL);
      console.error('3. Que el dispositivo esté en la misma red');
      console.error('4. Que el firewall permita conexiones en el puerto 3001');
    } else {
      // Algo pasó al configurar la petición
      console.error('API Error Config:', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
