import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import { useCart } from '@/contexts/CartContext';
import { getProductByCode } from './api/products';
import * as Haptics from 'expo-haptics';
import { Toast } from '@/components/Toast';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ScannerScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { addToCart } = useCart();
  const isDark = colorScheme === 'dark';
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (permission && !permission.granted && !permission.canAskAgain) {
      Alert.alert(
        'Permisos de cámara',
        'Necesitas habilitar los permisos de cámara en la configuración de la app para escanear códigos de barras.',
        [
          { text: 'Cancelar', style: 'cancel', onPress: () => router.back() },
          { text: 'OK' },
        ]
      );
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || loading) return;

    setScanned(true);
    setLoading(true);

    try {
      console.log('Código escaneado:', data);
      
      // Feedback háptico
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Buscar producto por código
      const product = await getProductByCode(data);

      if (!product) {
        Alert.alert('Producto no encontrado', `No se encontró un producto con el código: ${data}`);
        setScanned(false);
        setLoading(false);
        return;
      }

      // Verificar si el producto tiene presentaciones
      const hasPresentations = product.presentations && product.presentations.length > 0;
      const defaultPresentation = product.presentations?.find((p: any) => p.isDefault);
      const basePrice = defaultPresentation?.unitPrice || product.price;
      const isGranel = product.saleType?.toLowerCase() === 'granel';

      if (hasPresentations && product.presentations.length > 1) {
        // Si tiene múltiples presentaciones, navegar a la pantalla de productos
        Alert.alert(
          'Producto con presentaciones',
          'Este producto tiene múltiples presentaciones. Por favor, selecciona una desde la lista de productos.',
          [
            {
              text: 'Ver producto',
              onPress: () => {
                router.push({
                  pathname: '/products',
                  params: {
                    categoryId: product.categoryId,
                    categoryName: product.category?.name || 'Productos',
                  },
                });
              },
            },
            { text: 'Cancelar', style: 'cancel' },
          ]
        );
        setScanned(false);
        setLoading(false);
        return;
      }

      // Si es granel, necesitamos que el usuario ingrese cantidad/precio
      if (isGranel) {
        Alert.alert(
          'Producto a granel',
          'Este producto se vende a granel. Por favor, agrégalo desde la lista de productos para ingresar la cantidad.',
          [
            {
              text: 'Ver producto',
              onPress: () => {
                router.push({
                  pathname: '/products',
                  params: {
                    categoryId: product.categoryId,
                    categoryName: product.category?.name || 'Productos',
                  },
                });
              },
            },
            { text: 'Cancelar', style: 'cancel' },
          ]
        );
        setScanned(false);
        setLoading(false);
        return;
      }

      // Agregar al carrito directamente
      const normalizedSaleType = product.saleType
        ? product.saleType.toLowerCase() === 'granel'
          ? 'Granel'
          : 'Pieza'
        : 'Pieza';

      addToCart({
        productId: product.id.toString(),
        productName: product.name,
        presentationId: defaultPresentation?.id?.toString(),
        presentationName: defaultPresentation?.name,
        quantity: 1,
        unitPrice: basePrice,
        saleType: normalizedSaleType,
        basePrice: basePrice,
      });

      // Feedback háptico de éxito
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Mostrar toast
      const itemName = defaultPresentation
        ? `${product.name} - ${defaultPresentation.name}`
        : product.name;
      setToastMessage(`✅ ${itemName} agregado al carrito`);
      setToastVisible(true);

      // Resetear después de 2 segundos para permitir otro escaneo
      setTimeout(() => {
        setScanned(false);
        setLoading(false);
      }, 2000);
    } catch (error: any) {
      console.error('Error al buscar producto:', error);
      const errorMessage =
        error.response?.status === 404
          ? 'Producto no encontrado con ese código de barras'
          : error.response?.data?.error || 'Error al buscar el producto';
      
      Alert.alert('Error', errorMessage);
      setScanned(false);
      setLoading(false);
    }
  };

  if (!permission) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? '#667eea' : '#667eea'} />
          <ThemedText style={[styles.loadingText, isDark && styles.loadingTextDark]}>
            Verificando permisos...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.permissionContainer}>
          <IconSymbol
            name="creditcard.fill"
            size={64}
            color={isDark ? '#667eea' : '#667eea'}
          />
          <ThemedText
            type="title"
            style={[styles.permissionTitle, isDark && styles.permissionTitleDark]}
          >
            Permisos de cámara
          </ThemedText>
          <ThemedText
            style={[styles.permissionText, isDark && styles.permissionTextDark]}
          >
            Necesitamos acceso a tu cámara para escanear códigos de barras
          </ThemedText>
          <TouchableOpacity
            style={[styles.permissionButton, isDark && styles.permissionButtonDark]}
            onPress={requestPermission}
          >
            <ThemedText style={styles.permissionButtonText}>
              Permitir acceso a la cámara
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.backButton, isDark && styles.backButtonDark]}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backButtonText}>Cancelar</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: [
            'ean13',
            'ean8',
            'upc_a',
            'upc_e',
            'code128',
            'code39',
            'code93',
            'codabar',
            'itf14',
            'datamatrix',
            'qr',
          ],
        }}
      >
        <View style={styles.overlay}>
          {/* Área de escaneo */}
          <View style={styles.scanArea}>
            <View style={styles.corner} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>

          {/* Instrucciones */}
          <View style={styles.instructionsContainer}>
            <ThemedText style={styles.instructionsText}>
              {loading ? 'Buscando producto...' : 'Apunta la cámara al código de barras'}
            </ThemedText>
          </View>

          {/* Botón de cerrar */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.right" size={24} color="#fff" />
            <ThemedText style={styles.closeButtonText}>Cerrar</ThemedText>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <ThemedText style={styles.loadingOverlayText}>
              Buscando producto...
            </ThemedText>
          </View>
        )}
      </CameraView>

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
        type="success"
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#687076',
  },
  loadingTextDark: {
    color: '#9BA1A6',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
    color: '#11181C',
    textAlign: 'center',
  },
  permissionTitleDark: {
    color: '#ECEDEE',
  },
  permissionText: {
    fontSize: 16,
    color: '#687076',
    textAlign: 'center',
    marginBottom: 32,
  },
  permissionTextDark: {
    color: '#9BA1A6',
  },
  permissionButton: {
    backgroundColor: '#667eea',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonDark: {
    backgroundColor: '#667eea',
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonDark: {
    // No necesita estilo especial
  },
  backButtonText: {
    color: '#687076',
    fontSize: 16,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    borderWidth: 2,
    borderColor: '#667eea',
    borderRadius: 16,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#667eea',
    top: -2,
    left: -2,
  },
  cornerTopRight: {
    top: -2,
    right: -2,
    left: 'auto',
    borderLeftWidth: 0,
    borderRightWidth: 4,
  },
  cornerBottomLeft: {
    top: 'auto',
    bottom: -2,
    left: -2,
    borderTopWidth: 0,
    borderBottomWidth: 4,
  },
  cornerBottomRight: {
    top: 'auto',
    bottom: -2,
    right: -2,
    left: 'auto',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 4,
    borderBottomWidth: 4,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.25,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  instructionsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlayText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '600',
  },
});

