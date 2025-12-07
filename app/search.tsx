import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Image,
  TextInput,
  Keyboard,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import { useCart } from '@/contexts/CartContext';
import * as Haptics from 'expo-haptics';
import { Toast } from '@/components/Toast';
import { Alert } from 'react-native';
import { filterProducts } from './api/products';

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

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { addToCart } = useCart();
  const isDark = colorScheme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  // Granel modal state
  const [granelModalVisible, setGranelModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPresentation, setSelectedPresentation] = useState<{ id: string; name: string; unitPrice: number } | null>(null);
  const [granelPrice, setGranelPrice] = useState('');

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery.trim());
      } else if (searchQuery.trim().length === 0) {
        setProducts([]);
        setError(null);
      }
    }, 500); // Esperar 500ms después de que el usuario deje de escribir

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    if (!query || query.trim().length < 2) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await filterProducts(query);
      setProducts(results);
    } catch (err: any) {
      console.error('Error en búsqueda:', err);
      setError(
        err.response?.data?.error ||
        err.message ||
        'Error al buscar productos'
      );
      setProducts([]);
    } finally {
      setLoading(false);
    }
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
    presentation?: { id: string; name: string; unitPrice: number }
  ) => {
    const basePrice = presentation?.unitPrice || product.price;
    const isGranel = product.saleType?.toLowerCase() === 'granel';

    if (isGranel) {
      setSelectedProduct(product);
      setSelectedPresentation(presentation || null);
      setGranelPrice('');
      setGranelModalVisible(true);
    } else {
      const normalizedSaleType = product.saleType
        ? (product.saleType.toLowerCase() === 'granel' ? 'Granel' : 'Pieza')
        : 'Pieza';

      addToCart({
        productId: product.id.toString(),
        productName: product.name,
        presentationId: presentation?.id?.toString(),
        presentationName: presentation?.name,
        quantity: 1,
        unitPrice: basePrice,
        saleType: normalizedSaleType,
        basePrice: basePrice,
      });

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

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

    addToCart({
      productId: selectedProduct.id.toString(),
      productName: selectedProduct.name,
      presentationId: selectedPresentation?.id?.toString(),
      presentationName: selectedPresentation?.name,
      quantity: quantity,
      unitPrice: basePrice,
      saleType: 'Granel',
      basePrice: basePrice,
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const itemName = selectedPresentation
      ? `${selectedProduct.name} - ${selectedPresentation.name}`
      : selectedProduct.name;
    setToastMessage(`✅ ${itemName} (${quantity.toFixed(2)} kg/l) agregado`);
    setToastVisible(true);

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
        <TouchableOpacity
          style={styles.productHeader}
          activeOpacity={hasPresentations ? 0.7 : 1}
          onPress={() => hasPresentations && toggleProductExpansion(item.id)}
        >
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

            {item.category && (
              <ThemedText
                style={[styles.categoryLabel, isDark && styles.categoryLabelDark]}
              >
                {item.category.name}
              </ThemedText>
            )}
          </View>

          {hasPresentations && (
            <IconSymbol
              name="chevron.right"
              size={24}
              color={isDark ? '#9BA1A6' : '#687076'}
              style={[isExpanded && styles.expandButtonRotated]}
            />
          )}
        </TouchableOpacity>

        {hasPresentations && isExpanded && (
          <View style={styles.presentationsContainer}>
            {item.presentations.map((presentation) => (
              <View
                key={presentation.id}
                style={[styles.presentationItem, isDark && styles.presentationItemDark]}
              >
                <View style={styles.presentationInfo}>
                  <ThemedText style={[styles.presentationName, isDark && styles.presentationNameDark]}>
                    {presentation.name}
                  </ThemedText>
                  <ThemedText style={[styles.presentationPrice, isDark && styles.presentationPriceDark]}>
                    {formatCurrency(presentation.unitPrice)}
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
              Agregar al Carrito
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={isDark ? '#667eea' : '#667eea'} />
          <ThemedText style={[styles.emptyText, isDark && styles.emptyTextDark]}>
            Buscando productos...
          </ThemedText>
        </View>
      );
    }

    if (searchQuery.trim().length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <IconSymbol
            name="paperplane.fill"
            size={64}
            color={isDark ? '#9BA1A6' : '#687076'}
          />
          <ThemedText
            style={[styles.emptyText, isDark && styles.emptyTextDark]}
          >
            Buscar productos
          </ThemedText>
          <ThemedText
            style={[styles.emptySubtext, isDark && styles.emptySubtextDark]}
          >
            Escribe al menos 2 caracteres para buscar por nombre, descripción o código
          </ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <IconSymbol
          name="paperplane.fill"
          size={64}
          color={isDark ? '#9BA1A6' : '#687076'}
        />
        <ThemedText
          style={[styles.emptyText, isDark && styles.emptyTextDark]}
        >
          No se encontraron productos
        </ThemedText>
        <ThemedText
          style={[styles.emptySubtext, isDark && styles.emptySubtextDark]}
        >
          Intenta con otros términos de búsqueda
        </ThemedText>
      </View>
    );
  };

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
        onPress={() => performSearch(searchQuery.trim())}
      >
        <ThemedText style={styles.retryButtonText}>
          Reintentar
        </ThemedText>
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Barra de búsqueda */}
      <View style={[styles.searchBarContainer, isDark && styles.searchBarContainerDark]}>
        <View style={[styles.searchBar, isDark && styles.searchBarDark]}>
          <IconSymbol
            name="paperplane.fill"
            size={20}
            color={isDark ? '#9BA1A6' : '#687076'}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, isDark && styles.searchInputDark]}
            placeholder="Buscar por nombre, descripción o código..."
            placeholderTextColor={isDark ? '#9BA1A6' : '#687076'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={true}
            returnKeyType="search"
            onSubmitEditing={() => {
              Keyboard.dismiss();
              if (searchQuery.trim().length >= 2) {
                performSearch(searchQuery.trim());
              }
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setProducts([]);
                setError(null);
                Keyboard.dismiss();
              }}
              style={styles.clearButton}
            >
              <IconSymbol
                name="xmark.circle.fill"
                size={20}
                color={isDark ? '#9BA1A6' : '#687076'}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Lista de resultados */}
      {error && !loading ? (
        renderError()
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            products.length === 0 && styles.listContentEmpty,
          ]}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
        type="success"
      />

      {/* Granel Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={granelModalVisible}
        onRequestClose={() => setGranelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardContainer}
          >
            <Pressable
              style={[styles.modalContent, isDark && styles.modalContentDark]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={[styles.modalHeader, isDark && styles.modalHeaderDark]}>
                <ThemedText type="subtitle" style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                  {selectedProduct?.name}
                  {selectedPresentation && ` - ${selectedPresentation.name}`}
                </ThemedText>
                <TouchableOpacity
                  onPress={() => setGranelModalVisible(false)}
                  style={styles.modalCloseButton}
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
                <ThemedText style={[styles.modalSubtitle, isDark && styles.modalSubtitleDark]}>
                  Precio base: {formatCurrency(selectedPresentation?.unitPrice || selectedProduct?.price || 0)} por kg/litro
                </ThemedText>

                <View style={styles.inputGroup}>
                  <ThemedText style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
                    Precio Total:
                  </ThemedText>
                  <TextInput
                    style={[styles.textInput, isDark && styles.textInputDark]}
                    keyboardType="decimal-pad"
                    value={granelPrice}
                    onChangeText={setGranelPrice}
                    placeholder="0.00"
                    placeholderTextColor={isDark ? '#9BA1A6' : '#687076'}
                    autoFocus={true}
                  />
                  {granelPrice && granelPrice.trim() !== '' && selectedProduct && (
                    <ThemedText style={[styles.modalHelperText, isDark && styles.modalHelperTextDark]}>
                      Cantidad calculada: {((parseFloat(granelPrice) || 0) / (selectedPresentation?.unitPrice || selectedProduct?.price || 1)).toFixed(2)} kg/l
                    </ThemedText>
                  )}
                </View>

                {granelPrice && granelPrice.trim() !== '' && selectedProduct && (() => {
                  const basePrice = selectedPresentation?.unitPrice || selectedProduct?.price || 0;
                  const enteredPrice = parseFloat(granelPrice) || 0;
                  const calculatedQuantity = enteredPrice / basePrice;
                  return (
                    <ThemedText style={[styles.modalCalculatedTotal, isDark && styles.modalCalculatedTotalDark]}>
                      Resumen: {calculatedQuantity.toFixed(2)} × {formatCurrency(basePrice)} = {formatCurrency(enteredPrice)}
                    </ThemedText>
                  );
                })()}
              </ScrollView>

              <View style={[styles.modalFooter, isDark && styles.modalFooterDark]}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setGranelModalVisible(false)}
                >
                  <ThemedText style={styles.modalButtonText}>Cancelar</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonAdd]}
                  onPress={handleGranelAddToCart}
                >
                  <ThemedText style={styles.modalButtonText}>Agregar al Carrito</ThemedText>
                </TouchableOpacity>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBarContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchBarContainerDark: {
    backgroundColor: '#1E1E1E',
    borderBottomColor: '#2a2a2a',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBarDark: {
    backgroundColor: '#2a2a2a',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#11181C',
  },
  searchInputDark: {
    color: '#ECEDEE',
  },
  clearButton: {
    padding: 4,
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
  productCardDark: {
    backgroundColor: '#1E1E1E',
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  productIconContainer: {
    width: 80,
    height: 80,
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
    color: '#11181C',
    marginBottom: 4,
  },
  productNameDark: {
    color: '#ECEDEE',
  },
  productDescription: {
    fontSize: 14,
    color: '#687076',
    marginBottom: 8,
    lineHeight: 20,
  },
  productDescriptionDark: {
    color: '#9BA1A6',
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
    marginRight: 12,
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
  categoryLabel: {
    fontSize: 12,
    color: '#687076',
    marginTop: 4,
  },
  categoryLabelDark: {
    color: '#9BA1A6',
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
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  presentationPriceDark: {
    color: '#10B981',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingVertical: 8,
    paddingHorizontal: 16,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalKeyboardContainer: {
    width: '90%',
    maxWidth: 500,
    minWidth: 320,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
    maxHeight: '85%',
    minHeight: 400,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContentDark: {
    backgroundColor: '#1E1E1E',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalHeaderDark: {
    borderBottomColor: '#2a2a2a',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#11181C',
    flex: 1,
  },
  modalTitleDark: {
    color: '#ECEDEE',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBodyScroll: {
    flex: 1,
  },
  modalBody: {
    padding: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  modalHelperText: {
    fontSize: 14,
    color: '#687076',
    marginTop: 8,
  },
  modalHelperTextDark: {
    color: '#9BA1A6',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#687076',
    marginBottom: 20,
  },
  modalSubtitleDark: {
    color: '#9BA1A6',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 8,
  },
  inputLabelDark: {
    color: '#ECEDEE',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 18,
    fontSize: 20,
    fontWeight: '600',
    color: '#11181C',
    backgroundColor: '#f9fafb',
    minHeight: 56,
  },
  textInputDark: {
    borderColor: '#2a2a2a',
    backgroundColor: '#2a2a2a',
    color: '#ECEDEE',
  },
  modalCalculatedTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 12,
    textAlign: 'center',
  },
  modalCalculatedTotalDark: {
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
    borderTopColor: '#2a2a2a',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f3f4f6',
  },
  modalButtonAdd: {
    backgroundColor: '#667eea',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

