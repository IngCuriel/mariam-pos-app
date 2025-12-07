import axiosClient from './api';

export const getProductByCode = async (code) => {
  try {
    const response = await axiosClient.get(`/products/code/${code}`);
    return response.data;
  } catch (error) {
    console.error('Error al buscar producto por código:', error);
    throw error;
  }
};

export const filterProducts = async (searchTerm) => {
  try {
    const response = await axiosClient.get(`/products/filters`, {
      params: { search: searchTerm },
    });
    return response.data;
  } catch (error) {
    console.error('Error al buscar productos:', error);
    throw error;
  }
};

