import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Image,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useCart } from '@/contexts/CartContext';
import * as Haptics from 'expo-haptics';
import { Toast } from '@/components/Toast';
import { Alert } from 'react-native';
import api from './api/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  code: string | null;
  icon: string | null;
  status: string;
  saleType: string | null;
  category: {
    id: string;
    name: string;
  };
  inventory: {
    currentStock: number;
    minStock: number;
    trackInventory: boolean;
  } | null;
  presentations: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    isDefault: boolean;
  }>;
}

export default function ProductsScreen() {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const { addToCart } = useCart();
  const params = useLocalSearchParams();
  const categoryId = params.categoryId as string;
  const categoryName = params.categoryName as string || 'Productos';
  const isDark = colorScheme === 'dark';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [granelModalVisible, setGranelModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPresentation, setSelectedPresentation] = useState<{ id: string; name: string; unitPrice: number } | null>(null);
  const [granelPrice, setGranelPrice] = useState<string>('');

  useEffect(() => {
    if (categoryName) {
      navigation.setOptions({
        title: categoryName,
        headerTitleStyle: {
           fontSize: 14,
        },
        headerTitleContainerStyle: {
          maxWidth: '60%',
        },
      });
    }
  }, [categoryName, navigation]);

  useEffect(() => {
    if (categoryId) {
      loadProducts();
    }
  }, [categoryId]);

  const loadProducts = async () => {
    try {
      setError(null);
      const response = await api.get(`/products/category/${categoryId}`);
      setProducts(response.data);
    } catch (err: any) {
      console.error('Error cargando productos:', err);
      setError(
        err.response?.data?.error || 
        err.message || 
        'Error al cargar los productos'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const toggleProductExpansion = (productId: string) => {
    setExpandedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleAddToCart = (
    product: Product,
    presentation?: { id: string; name: string; unitPrice: number; quantity: number }
  ) => {
    console.log('presentation', presentation);
    const basePrice = presentation?.unitPrice || product.price;
    // Comparar de forma case-insensitive para mayor robustez
    const isGranel = product.saleType?.toLowerCase() === 'granel';

    if (isGranel) {
      // Si es granel, abrir modal para ingresar precio total
      setSelectedProduct(product);
      setSelectedPresentation(presentation || null);
      setGranelPrice('');
      setGranelModalVisible(true);
    } else {
      // Si es pieza, agregar directo
      // Normalizar saleType: 'Granel' o 'Pieza' con mayúscula
      const normalizedSaleType = product.saleType 
        ? (product.saleType.toLowerCase() === 'granel' ? 'Granel' : 'Pieza')
        : 'Pieza';
      
      addToCart({
        productId: product.id,
        productName: product.name,
        presentationId: presentation?.id,
        presentationName: presentation?.name,
        quantity: presentation?.quantity || 1,
        unitPrice: basePrice,
        saleType: normalizedSaleType,
        basePrice: basePrice,
      });

      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Notificación toast
      const itemName = presentation ? `${product.name} - ${presentation.name}` : product.name;
      setToastMessage(`✅ ${itemName} agregado`);
      setToastVisible(true);
    }
  };

  const handleGranelAddToCart = () => {
    if (!selectedProduct) return;

    const basePrice = selectedPresentation?.unitPrice || selectedProduct.price;

    // Validar que se haya ingresado un precio total
    if (!granelPrice || granelPrice.trim() === '') {
      Alert.alert('Error', 'Debes ingresar el precio total');
      return;
    }

    const enteredPrice = parseFloat(granelPrice);
    if (isNaN(enteredPrice) || enteredPrice <= 0) {
      Alert.alert('Error', 'El precio total debe ser mayor a 0');
      return;
    }

    // Calcular cantidad: precio ingresado / precio base
    const quantity = enteredPrice / basePrice;

    if (quantity <= 0 || isNaN(quantity)) {
      Alert.alert('Error', 'El precio total no es válido');
      return;
    }

    // Agregar al carrito con precio base para cálculos futuros
    addToCart({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      presentationId: selectedPresentation?.id,
      presentationName: selectedPresentation?.name,
      quantity: quantity,
      unitPrice: basePrice, // Siempre usar precio base como unitPrice
      saleType: 'Granel',
      basePrice: basePrice,
    });

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Notificación toast
    const itemName = selectedPresentation 
      ? `${selectedProduct.name} - ${selectedPresentation.name}` 
      : selectedProduct.name;
    setToastMessage(`✅ ${itemName} (${quantity.toFixed(2)} kg/l) agregado`);
    setToastVisible(true);

    // Cerrar modal y limpiar
    setGranelModalVisible(false);
    setSelectedProduct(null);
    setSelectedPresentation(null);
    setGranelPrice('');
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const defaultPrice = item.presentations?.find(p => p.isDefault)?.unitPrice || item.price;
    const stock = item.inventory?.currentStock ?? null;
    const hasStock = stock === null || stock > 0;
    const hasPresentations = item.presentations && item.presentations.length > 0;
    const isExpanded = expandedProducts.has(item.id);

    return (
      <View
        style={[
          styles.productCard,
          isDark && styles.productCardDark,
        ]}
      >
        <View style={styles.productHeader}>
          {item.icon ? (
            <Image
              source={{ uri: item.icon }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.productIconContainer, isDark && styles.productIconContainerDark]}>
              <IconSymbol
                name="house.fill"
                size={32}
                color={isDark ? '#667eea' : '#667eea'}
              />
            </View>
          )}
          
          <View style={styles.productContent}>
            <ThemedText 
              type="subtitle" 
              style={[styles.productName, isDark && styles.productNameDark]}
              numberOfLines={2}
            >
              {item.name}
            </ThemedText>
            
            {item.description && (
              <ThemedText 
                style={[styles.productDescription, isDark && styles.productDescriptionDark]}
                numberOfLines={2}
              >
                {item.description}
              </ThemedText>
            )}
            
            <View style={styles.productFooter}>
              <ThemedText 
                style={[styles.productPrice, isDark && styles.productPriceDark]}
              >
                {formatCurrency(defaultPrice)}
              </ThemedText>
              
              {item.inventory?.trackInventory && stock !== null && (
                <View style={[
                  styles.stockBadge,
                  !hasStock && styles.stockBadgeEmpty,
                ]}>
                  <ThemedText style={styles.stockText}>
                    {hasStock ? `Stock: ${stock}` : 'Sin stock'}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
          
          {hasPresentations && (
            <TouchableOpacity
              onPress={() => toggleProductExpansion(item.id)}
              style={styles.expandButton}
            >
              <IconSymbol
                name={isExpanded ? "chevron.right" : "chevron.right"}
                size={24}
                color={isDark ? '#9BA1A6' : '#687076'}
                style={[isExpanded && styles.expandButtonRotated]}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Presentaciones */}
        {hasPresentations && isExpanded && (
          <View style={styles.presentationsContainer}>
            {item.presentations.map((presentation) => (
              <View
                key={presentation.id}
                style={[styles.presentationItem, isDark && styles.presentationItemDark]}
              >
                <View style={styles.presentationInfo}>
                  <ThemedText
                    style={[styles.presentationName, isDark && styles.presentationNameDark]}
                  >
                    {presentation.name}
                  </ThemedText>
                  <ThemedText
                    style={[styles.presentationPrice, isDark && styles.presentationPriceDark]}
                  >
                    {formatCurrency(presentation.quantity * presentation.unitPrice)}
                  </ThemedText>
                </View>
                <TouchableOpacity
                  style={[styles.addToCartButton, isDark && styles.addToCartButtonDark]}
                  onPress={() => handleAddToCart(item, presentation)}
                  activeOpacity={0.8}
                >
                  <IconSymbol
                    name="cart.fill"
                    size={18}
                    color="#fff"
                  />
                  <ThemedText style={styles.addToCartText}>
                    Agregar
                  </ThemedText>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Botón agregar si no tiene presentaciones */}
        {!hasPresentations && (
          <TouchableOpacity
            style={[styles.addToCartButtonFull, isDark && styles.addToCartButtonFullDark]}
            onPress={() => handleAddToCart(item)}
            activeOpacity={0.8}
          >
            <IconSymbol
              name="cart.fill"
              size={20}
              color="#fff"
            />
            <ThemedText style={styles.addToCartTextFull}>
              Agregar al carrito
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <IconSymbol
        name="house.fill"
        size={64}
        color={isDark ? '#9BA1A6' : '#687076'}
      />
      <ThemedText 
        style={[styles.emptyText, isDark && styles.emptyTextDark]}
      >
        No hay productos disponibles
      </ThemedText>
      <ThemedText 
        style={[styles.emptySubtext, isDark && styles.emptySubtextDark]}
      >
        Los productos aparecerán aquí cuando estén disponibles
      </ThemedText>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <IconSymbol
        name="paperplane.fill"
        size={64}
        color="#DC2626"
      />
      <ThemedText style={styles.errorText}>
        {error}
      </ThemedText>
      <TouchableOpacity
        style={[styles.retryButton, isDark && styles.retryButtonDark]}
        onPress={loadProducts}
      >
        <ThemedText style={styles.retryButtonText}>
          Reintentar
        </ThemedText>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? '#667eea' : '#667eea'} />
          <ThemedText style={[styles.loadingText, isDark && styles.loadingTextDark]}>
            Cargando productos...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error && !refreshing) {
    return (
      <ThemedView style={styles.container}>
        {renderError()}
      </ThemedView>
    );
  }

  const renderGranelModal = () => {
    if (!selectedProduct) return null;

    const basePrice = selectedPresentation?.unitPrice || selectedProduct.price;
    
    // Calcular cantidad basada en el precio total ingresado
    let calculatedQuantity = 0;
    let calculatedTotal = 0;
    
    if (granelPrice && granelPrice.trim() !== '') {
      const enteredPrice = parseFloat(granelPrice);
      if (!isNaN(enteredPrice) && enteredPrice > 0) {
        calculatedQuantity = enteredPrice / basePrice;
        calculatedTotal = enteredPrice; // El total es el precio ingresado
      }
    }

    return (
      <Modal
        visible={granelModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setGranelModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setGranelModalVisible(false)}
          >
            <Pressable 
              style={styles.modalContentWrapper}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
                <View style={[styles.modalHeader, isDark && styles.modalHeaderDark]}>
                  <View style={styles.modalHeaderContent}>
                    <ThemedText
                      type="title"
                      style={[styles.modalTitle, isDark && styles.modalTitleDark]}
                      numberOfLines={2}
                    >
                      {selectedProduct.name}
                    </ThemedText>
                    {selectedPresentation && (
                      <ThemedText
                        style={[styles.modalSubtitle, isDark && styles.modalSubtitleDark]}
                      >
                        {selectedPresentation.name}
                      </ThemedText>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setGranelModalVisible(false)}
                  >
                    <IconSymbol
                      name="xmark.circle.fill"
                      size={24}
                      color={isDark ? '#9BA1A6' : '#687076'}
                    />
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  style={styles.modalBodyScroll}
                  contentContainerStyle={styles.modalBody}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <ThemedText
                    style={[styles.modalLabel, isDark && styles.modalLabelDark]}
                  >
                    Precio base: {formatCurrency(basePrice)} por kg/litro
                  </ThemedText>

                  <View style={styles.modalInputGroup}>
                    <ThemedText
                      style={[styles.modalInputLabel, isDark && styles.modalInputLabelDark]}
                    >
                      Precio Total
                    </ThemedText>
                    <TextInput
                      style={[styles.modalInput, isDark && styles.modalInputDark]}
                      value={granelPrice}
                      onChangeText={setGranelPrice}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor={isDark ? '#9BA1A6' : '#687076'}
                      autoFocus={true}
                    />
                    {granelPrice && granelPrice.trim() !== '' && calculatedQuantity > 0 && (
                      <ThemedText
                        style={[styles.modalHelperText, isDark && styles.modalHelperTextDark]}
                      >
                        Cantidad calculada: {calculatedQuantity.toFixed(2)} kg/l
                      </ThemedText>
                    )}
                  </View>

                  {calculatedQuantity > 0 && (
                    <View style={styles.modalSummary}>
                      <ThemedText
                        style={[styles.modalSummaryLabel, isDark && styles.modalSummaryLabelDark]}
                      >
                        Resumen:
                      </ThemedText>
                      <ThemedText
                        style={[styles.modalSummaryText, isDark && styles.modalSummaryTextDark]}
                      >
                        {calculatedQuantity.toFixed(2)} × {formatCurrency(basePrice)} = {formatCurrency(calculatedTotal)}
                      </ThemedText>
                    </View>
                  )}
                </ScrollView>

                <View style={[styles.modalFooter, isDark && styles.modalFooterDark]}>
                  <TouchableOpacity
                    style={[styles.modalCancelButton, isDark && styles.modalCancelButtonDark]}
                    onPress={() => setGranelModalVisible(false)}
                  >
                    <ThemedText style={styles.modalCancelText}>Cancelar</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalAddButton, isDark && styles.modalAddButtonDark]}
                    onPress={handleGranelAddToCart}
                  >
                    <ThemedText style={styles.modalAddText}>Agregar al carrito</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
        type="success"
      />
      {renderGranelModal()}
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          products.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? '#667eea' : '#667eea'}
          />
        }
        showsVerticalScrollIndicator={false}
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
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productCardDark: {
    backgroundColor: '#1E1E1E',
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: '#f0f0f0',
  },
  productIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  productIconContainerDark: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
  },
  productContent: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#11181C',
  },
  productNameDark: {
    color: '#ECEDEE',
  },
  productDescription: {
    fontSize: 14,
    color: '#687076',
    lineHeight: 20,
    marginBottom: 8,
  },
  productDescriptionDark: {
    color: '#9BA1A6',
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  productPriceDark: {
    color: '#10B981',
  },
  stockBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockBadgeEmpty: {
    backgroundColor: '#FEE2E2',
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  expandButton: {
    marginLeft: 12,
    padding: 8,
  },
  expandButtonRotated: {
    transform: [{ rotate: '90deg' }],
  },
  presentationsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  presentationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  presentationItemDark: {
    backgroundColor: '#2a2a2a',
  },
  presentationInfo: {
    flex: 1,
  },
  presentationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 4,
  },
  presentationNameDark: {
    color: '#ECEDEE',
  },
  presentationPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  presentationPriceDark: {
    color: '#10B981',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  addToCartButtonDark: {
    backgroundColor: '#667eea',
  },
  addToCartText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  addToCartButtonFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 12,
  },
  addToCartButtonFullDark: {
    backgroundColor: '#667eea',
  },
  addToCartTextFull: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 24,
    color: '#11181C',
  },
  emptyTextDark: {
    color: '#ECEDEE',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    color: '#687076',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  emptySubtextDark: {
    color: '#9BA1A6',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    marginTop: 24,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonDark: {
    backgroundColor: '#667eea',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentWrapper: {
    width: '90%',
    maxWidth: 500,
    minWidth: 320,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    maxHeight: '85%',
    minHeight: 400,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 24,
    paddingTop: 0,
  },
  modalContentDark: {
    backgroundColor: '#1E1E1E',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  modalHeaderDark: {
    backgroundColor: '#1E1E1E',
    borderBottomColor: '#2a2a2a',
  },
  modalHeaderContent: {
    flex: 1,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#11181C',
    marginBottom: 4,
  },
  modalTitleDark: {
    color: '#ECEDEE',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#687076',
    marginTop: 4,
  },
  modalSubtitleDark: {
    color: '#9BA1A6',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#687076',
  },
  modalBodyScroll: {
    flex: 1,
  },
  modalBody: {
    padding: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 16,
  },
  modalLabelDark: {
    color: '#ECEDEE',
  },
  modalInputGroup: {
    marginBottom: 24,
  },
  modalInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 8,
  },
  modalInputLabelDark: {
    color: '#ECEDEE',
  },
  modalInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 18,
    fontSize: 20,
    fontWeight: '600',
    color: '#11181C',
    minHeight: 56,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  modalInputDark: {
    backgroundColor: '#2a2a2a',
    color: '#ECEDEE',
    borderColor: '#3a3a3a',
  },
  modalHelperText: {
    fontSize: 14,
    color: '#687076',
    marginTop: 8,
  },
  modalHelperTextDark: {
    color: '#9BA1A6',
  },
  modalDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  modalDividerText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: '#687076',
    fontWeight: '600',
  },
  modalDividerTextDark: {
    color: '#9BA1A6',
  },
  modalSummary: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  modalSummaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 8,
  },
  modalSummaryLabelDark: {
    color: '#ECEDEE',
  },
  modalSummaryText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  modalSummaryTextDark: {
    color: '#10B981',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
    minHeight: 80,
  },
  modalFooterDark: {
    backgroundColor: '#1E1E1E',
    borderTopColor: '#2a2a2a',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelButtonDark: {
    backgroundColor: '#2a2a2a',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#687076',
  },
  modalAddButton: {
    flex: 2,
    backgroundColor: '#667eea',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalAddButtonDark: {
    backgroundColor: '#667eea',
  },
  modalAddText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

