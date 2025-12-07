import axiosClient from './api';

export const createPendingSale = async (pendingSaleData) => {
  try {
    const response = await axiosClient.post('/pending-sales', pendingSaleData);
    return response.data;
  } catch (error) {
    console.error('Error al crear venta pendiente:', error);
    throw error;
  }
};

export const getPendingSales = async () => {
  try {
    const response = await axiosClient.get('/pending-sales');
    return response.data;
  } catch (error) {
    console.error('Error al obtener ventas pendientes:', error);
    throw error;
  }
};

export const deletePendingSale = async (id) => {
  try {
    const response = await axiosClient.delete(`/pending-sales/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar venta pendiente:', error);
    throw error;
  }
};

