import axiosClient from './api';
import { Platform } from 'react-native';
import { Buffer } from 'buffer';

// Importar FileSystem solo para plataformas nativas
let FileSystem = null;
if (Platform.OS !== 'web') {
  FileSystem = require('expo-file-system/legacy');
}

/**
 * Imprimir copias de un archivo
 */
export const printCopies = async (fileUri, copies, colorMode, printerName) => {
  try {
    // Verificar que el archivo existe solo en plataformas nativas
    // En web, confiamos en que el archivo existe ya que viene de expo-document-picker
    if (Platform.OS !== 'web' && FileSystem) {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error('El archivo no existe');
      }
    }

    // Obtener el nombre del archivo
    const fileName = fileUri.split('/').pop() || 'file.pdf';
    const fileType = fileName.endsWith('.pdf') ? 'application/pdf' : 
                     fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ? 'image/jpeg' :
                     fileName.endsWith('.png') ? 'image/png' : 'application/pdf';

    // Crear FormData con el archivo
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      type: fileType,
      name: fileName,
    });
    formData.append('copies', copies.toString());
    formData.append('colorMode', colorMode);
    formData.append('printerName', printerName);

    const response = await axiosClient.post('/copies/print', formData, {
      timeout: 60000,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error al imprimir copias:', error);
    throw error;
  }
};

/**
 * Obtener impresoras disponibles
 */
export const getAvailablePrinters = async () => {
  try {
    const response = await axiosClient.get('/copies/printers');
    return response.data.printers || [];
  } catch (error) {
    console.error('Error al obtener impresoras:', error);
    throw error;
  }
};

/**
 * Fotocopiar (escanear e imprimir)
 */
export const photocopy = async (copies, colorMode, printerName) => {
  try {
    const response = await axiosClient.post('/copies/photocopy', {
      copies,
      colorMode,
      printerName,
    }, {
      timeout: 120000, // 120 segundos para escanear + imprimir
    });
    return response.data;
  } catch (error) {
    console.error('Error al fotocopiar:', error);
    throw error;
  }
};

/**
 * Escanear documento (solo escanear, no imprimir)
 */
export const scanDocument = async (colorMode = 'color', format = 'jpg') => {
  try {
    const response = await axiosClient.post('/copies/scan', {
      colorMode,
      format,
    }, {
      timeout: 60000,
      responseType: 'arraybuffer', // Usar arraybuffer en lugar de blob para React Native
    });
    
    // Convertir arraybuffer a base64 y guardar como archivo
    const uint8Array = new Uint8Array(response.data);
    
    if (Platform.OS === 'web') {
      // En web, crear un blob y devolver la URL
      const blob = new Blob([uint8Array], { 
        type: format === 'pdf' ? 'application/pdf' : `image/${format}` 
      });
      const url = URL.createObjectURL(blob);
      return url;
    } else {
      // En plataformas nativas, usar FileSystem
      const base64 = Buffer.from(uint8Array).toString('base64');
      const fileName = `scan-${Date.now()}.${format}`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return fileUri;
    }
  } catch (error) {
    console.error('Error al escanear:', error);
    throw error;
  }
};

/**
 * Crear PDF desde imágenes
 */
export const createPdfFromImages = async (imageUris) => {
  try {
    const formData = new FormData();
    
    for (let i = 0; i < imageUris.length; i++) {
      const uri = imageUris[i];
      const fileName = uri.split('/').pop() || `page-${i}.jpg`;
      formData.append('images', {
        uri,
        type: 'image/jpeg',
        name: fileName,
      });
    }

    const response = await axiosClient.post('/copies/create-pdf', formData, {
      timeout: 120000,
      responseType: 'arraybuffer',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Convertir arraybuffer a base64 y guardar como archivo
    const uint8Array = new Uint8Array(response.data);
    
    if (Platform.OS === 'web') {
      // En web, crear un blob y devolver la URL
      const blob = new Blob([uint8Array], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      return url;
    } else {
      // En plataformas nativas, usar FileSystem
      const base64 = Buffer.from(uint8Array).toString('base64');
      const fileName = `scan-${Date.now()}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return fileUri;
    }
  } catch (error) {
    console.error('Error al crear PDF:', error);
    throw error;
  }
};

/**
 * Combinar dos imágenes en una sola
 */
export const combineImages = async (imageUris, layout = 'horizontal') => {
  try {
    if (imageUris.length !== 2) {
      throw new Error('Se requieren exactamente 2 imágenes para combinar');
    }

    const formData = new FormData();
    
    for (let i = 0; i < imageUris.length; i++) {
      const uri = imageUris[i];
      const fileName = uri.split('/').pop() || `side-${i}.jpg`;
      formData.append('images', {
        uri,
        type: 'image/jpeg',
        name: fileName,
      });
    }
    formData.append('layout', layout);

    const response = await axiosClient.post('/copies/combine-images', formData, {
      timeout: 120000,
      responseType: 'arraybuffer',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Convertir arraybuffer a base64 y guardar como archivo
    const uint8Array = new Uint8Array(response.data);
    
    if (Platform.OS === 'web') {
      // En web, crear un blob y devolver la URL
      const blob = new Blob([uint8Array], { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      return url;
    } else {
      // En plataformas nativas, usar FileSystem
      const base64 = Buffer.from(uint8Array).toString('base64');
      const fileName = `combined-${Date.now()}.jpg`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return fileUri;
    }
  } catch (error) {
    console.error('Error al combinar imágenes:', error);
    throw error;
  }
};
