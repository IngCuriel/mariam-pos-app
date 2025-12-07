import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
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
import { useRouter } from 'expo-router';
import { useCart } from '@/contexts/CartContext';
import { createPendingSale } from './api/pendingSales';
import { Toast } from '@/components/Toast';
import * as Haptics from 'expo-haptics';
import { LogoColors } from '@/constants/logoColors';

export default function CartScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { items, removeFromCart, updateQuantity, clearCart, getTotal } = useCart();
  const isDark = colorScheme === 'dark';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const renderCartItem = ({ item }: { item: typeof items[0] }) => {
    const isGranel = item.saleType === 'Granel';
    
    return (
      <View style={[styles.cartItem, isDark && styles.cartItemDark]}>
        {/* Contenedor principal del item */}
        <View style={styles.cartItemMain}>
          {/* Información del producto */}
          <View style={styles.cartItemInfo}>
            <View style={styles.productHeaderRow}>
              {/*<View style={styles.productIconContainer}>
                <IconSymbol
                  name="house.fill"
                  size={20}
                  color={LogoColors.red}
                />
              </View>*/}
               {/* Botón eliminar */}
               <View style={styles.productIconContainer}>
                <TouchableOpacity
                  style={[styles.removeButton, isDark && styles.removeButtonDark]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    removeFromCart(item.productId, item.presentationId);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <IconSymbol
                    name="trash.fill"
                    size={18}
                    color={LogoColors.error}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.productNameContainer}>
                <ThemedText
                  type="subtitle"
                  style={[styles.cartItemName, isDark && styles.cartItemNameDark]}
                  numberOfLines={2}
                >
                  {item.productName}
                </ThemedText>
                {item.presentationName && (
                  <View style={styles.presentationBadge}>
                    <ThemedText
                      style={[styles.cartItemPresentation, isDark && styles.cartItemPresentationDark]}
                      numberOfLines={1}
                    >
                      {item.presentationName}
                    </ThemedText>
                  </View>
                )}
                {isGranel && (
                  <View style={styles.granelBadge}>
                    <ThemedText style={styles.granelBadgeText}>
                      Granel
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>

            {/* Precio unitario */}
            <View style={[styles.priceRow, isDark && styles.priceRowDark]}>
              <ThemedText
                style={[styles.cartItemPriceLabel, isDark && styles.cartItemPriceLabelDark]}
              >
                Precio unitario:
              </ThemedText>
              <ThemedText
                style={[styles.cartItemPrice, isDark && styles.cartItemPriceDark]}
              >
                {formatCurrency(item.unitPrice)}
              </ThemedText>
            </View>
          </View>

          {/* Controles y acciones */}
          <View style={[styles.cartItemActions, isDark && styles.cartItemActionsDark]}>
            {/* Controles de cantidad */}
            {!isGranel ? (
              <View style={[styles.quantityControls, isDark && styles.quantityControlsDark]}>
                <TouchableOpacity
                  style={[styles.quantityButton, isDark && styles.quantityButtonDark]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateQuantity(item.productId, item.presentationId, item.quantity - 1);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <ThemedText style={[styles.quantityButtonText, isDark && styles.quantityButtonTextDark]}>
                    −
                  </ThemedText>
                </TouchableOpacity>
                <View style={[styles.quantityDisplay, isDark && styles.quantityDisplayDark]}>
                  <ThemedText
                    style={[styles.quantityText, isDark && styles.quantityTextDark]}
                  >
                    {item.quantity.toFixed(0)}
                  </ThemedText>
                </View>
                <TouchableOpacity
                  style={[styles.quantityButton, isDark && styles.quantityButtonDark]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateQuantity(item.productId, item.presentationId, item.quantity + 1);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <ThemedText style={[styles.quantityButtonText, isDark && styles.quantityButtonTextDark]}>
                    +
                  </ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.quantityDisplayGranel}>
                <ThemedText
                  style={[styles.quantityLabel, isDark && styles.quantityLabelDark]}
                >
                  Cantidad:
                </ThemedText>
                <ThemedText
                  style={[styles.quantityTextGranel, isDark && styles.quantityTextGranelDark]}
                >
                  {item.quantity.toFixed(2)} {isGranel ? 'kg/l' : ''}
                </ThemedText>
              </View>
            )}

            {/* Total del item */}
            <View style={styles.totalRow}>
              <ThemedText
                style={[styles.cartItemTotalLabel, isDark && styles.cartItemTotalLabelDark]}
              >
                Subtotal:
              </ThemedText>
              <ThemedText
                style={[styles.cartItemTotal, isDark && styles.cartItemTotalDark]}
              >
                {formatCurrency(item.total)}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const   renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, isDark && styles.emptyIconContainerDark]}>
        <IconSymbol
          name="cart.fill"
          size={64}
          color={LogoColors.red}
        />
      </View>
      <ThemedText
        style={[styles.emptyText, isDark && styles.emptyTextDark]}
      >
        Tu carrito está vacío
      </ThemedText>
      <ThemedText
        style={[styles.emptySubtext, isDark && styles.emptySubtextDark]}
      >
        Agrega productos desde las categorías para comenzar una venta
      </ThemedText>
      <TouchableOpacity
        style={[styles.shopButton, isDark && styles.shopButtonDark]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
      >
        <IconSymbol
          name="house.fill"
          size={20}
          color="#fff"
          style={{ marginRight: 8 }}
        />
        <ThemedText style={styles.shopButtonText}>
          Ir a comprar
        </ThemedText>
      </TouchableOpacity>
    </View>
  );

  const handleSendToCashier = () => {
    if (items.length === 0) {
      Alert.alert('Carrito vacío', 'No hay productos en el carrito');
      return;
    }
    // Abrir modal para ingresar nombre del cliente
    setShowClientModal(true);
  };

  const handleConfirmSendToCashier = async () => {
    if (!clientName || clientName.trim() === '') {
      Alert.alert('Error', 'Debes ingresar un nombre de cliente');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Error', 'No hay productos en el carrito');
      setShowClientModal(false);
      return;
    }

    setIsSubmitting(true);
    // NO cerrar el modal todavía, esperar a que se complete la operación

    try {
      console.log('=== INICIANDO ENVÍO DE VENTA PENDIENTE ===');
      console.log('Items del carrito:', JSON.stringify(items, null, 2));
      console.log('Cantidad de items:', items.length);
      console.log('Nombre del cliente:', clientName);

      if (!items || items.length === 0) {
        throw new Error('No hay productos en el carrito');
      }

      // Convertir items del carrito al formato que espera el backend
      const details = items.map((item, index) => {
        console.log(`Procesando item ${index + 1}:`, item);
        
        // Convertir productId a number (puede venir como string o number)
        let productIdNum: number;
        if (typeof item.productId === 'string') {
          productIdNum = parseInt(item.productId, 10);
        } else if (typeof item.productId === 'number') {
          productIdNum = item.productId;
        } else {
          throw new Error(`ProductId tiene tipo inválido: ${typeof item.productId}, valor: ${item.productId}`);
        }
        
        // Validar que productId sea un número válido
        if (isNaN(productIdNum) || productIdNum <= 0) {
          throw new Error(`ProductId inválido: ${item.productId} (convertido a: ${productIdNum})`);
        }

        // Convertir presentationId si existe
        let presentationIdNum: number | null = null;
        if (item.presentationId !== undefined && item.presentationId !== null) {
          if (typeof item.presentationId === 'string') {
            const parsed = parseInt(item.presentationId, 10);
            if (!isNaN(parsed) && parsed > 0) {
              presentationIdNum = parsed;
            }
          } else if (typeof item.presentationId === 'number') {
            if (!isNaN(item.presentationId) && item.presentationId > 0) {
              presentationIdNum = item.presentationId;
            }
          }
        }

        const detail = {
          productId: productIdNum,
          quantity: Number(item.quantity),
          price: Number(item.unitPrice),
          subTotal: Number(item.total),
          productName: item.productName || null,
          presentationId: presentationIdNum,
          presentationName: item.presentationName || null,
          saleType: item.saleType || null,
          basePrice: item.basePrice ? Number(item.basePrice) : Number(item.unitPrice),
        };
        
        console.log(`Detail ${index + 1} procesado:`, detail);
        return detail;
      });

      console.log('Details procesados:', JSON.stringify(details, null, 2));

      const total = getTotal();
      console.log('Total calculado:', total);

      if (isNaN(total) || total <= 0) {
        throw new Error(`Total inválido: ${total}`);
      }

      const pendingSaleData = {
        clientName: clientName.trim(),
        total: Number(total),
        branch: 'Sucursal Default',
        cashRegister: 'Caja 1',
        details,
      };

      console.log('Datos completos a enviar:', JSON.stringify(pendingSaleData, null, 2));

      // Crear la venta pendiente
      console.log('Llamando a createPendingSale...');
      const pendingSale = await createPendingSale(pendingSaleData);
      console.log('Respuesta del servidor:', pendingSale);

      if (!pendingSale || !pendingSale.code) {
        throw new Error('La respuesta del servidor no contiene el código de la venta');
      }

      console.log('Venta guardada exitosamente:', pendingSale.code);

      // Feedback háptico de éxito
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Mostrar toast de éxito
      setToastMessage(`✅ Venta enviada exitosamente\nCódigo: ${pendingSale.code}`);
      setToastVisible(true);

      // Cerrar el modal después de un pequeño delay para que se vea el toast
      setTimeout(() => {
        setShowClientModal(false);
        setClientName('');

        // Limpiar el carrito después de cerrar el modal
        clearCart();

        // Esperar un poco más antes de regresar para que el usuario vea el mensaje
        setTimeout(() => {
          router.back();
        }, 1500);
      }, 500);
    } catch (error: any) {
      console.error('=== ERROR AL ENVIAR VENTA ===');
      console.error('Error completo:', error);
      console.error('Error tipo:', typeof error);
      console.error('Error response:', error?.response);
      console.error('Error message:', error?.message);
      console.error('Error data:', error?.response?.data);
      console.error('Error stack:', error?.stack);
      
      // Cerrar el modal en caso de error
      setShowClientModal(false);
      
      // Construir mensaje de error más detallado
      let errorMessage = 'No se pudo enviar la venta a caja.';
      
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      console.error('Mensaje de error a mostrar:', errorMessage);
      
      Alert.alert(
        '❌ Error al enviar venta',
        `${errorMessage}\n\nPor favor, verifica tu conexión e intenta nuevamente.`,
        [
          { 
            text: 'OK',
            onPress: () => {
              console.log('Usuario cerró el alert de error');
            }
          }
        ]
      );
    } finally {
      setIsSubmitting(false);
      console.log('=== FINALIZANDO ENVÍO (finally) ===');
    }
  };

  const total = getTotal();

  return (
    <ThemedView style={styles.container}>
      {items.length === 0 ? (
        renderEmpty()
      ) : (
        <>
          <FlatList
            data={items}
            renderItem={renderCartItem}
            keyExtractor={(item, index) => `${item.productId}-${item.presentationId || 'default'}-${index}`}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <TouchableOpacity
                style={[styles.addMoreButton, isDark && styles.addMoreButtonDark]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/categories');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.addMoreButtonContent}>
                  <View style={[styles.addMoreIconContainer, isDark && styles.addMoreIconContainerDark]}>
                    <IconSymbol
                      name="house.fill"
                      size={20}
                      color={LogoColors.red}
                    />
                  </View>
                  <View style={styles.addMoreTextContainer}>
                    <ThemedText style={styles.addMoreButtonTitle}>
                      Agregar más productos
                    </ThemedText>
                    <ThemedText style={[styles.addMoreButtonSubtitle, isDark && styles.addMoreButtonSubtitleDark]}>
                      Ver categorías disponibles
                    </ThemedText>
                  </View>
                  <IconSymbol
                    name="chevron.right"
                    size={24}
                    color={isDark ? '#9BA1A6' : '#687076'}
                  />
                </View>
              </TouchableOpacity>
            }
          />

          <View style={[styles.footer, isDark && styles.footerDark]}>
            <View style={styles.footerContent}>
              <View style={[styles.totalContainer, isDark && styles.totalContainerDark]}>
                <View style={styles.totalLabelContainer}>
                  <IconSymbol
                    name="cart.fill"
                    size={24}
                    color={LogoColors.red}
                    style={{ marginRight: 8 }}
                  />
                  <ThemedText
                    style={[styles.totalLabel, isDark && styles.totalLabelDark]}
                  >
                    Total:
                  </ThemedText>
                </View>
                <ThemedText
                  style={[styles.totalAmount, isDark && styles.totalAmountDark]}
                >
                  {formatCurrency(total)}
                </ThemedText>
              </View>

              <View style={styles.footerButtons}>
                <TouchableOpacity
                  style={[styles.clearButton, isDark && styles.clearButtonDark]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    clearCart();
                  }}
                >
                  <IconSymbol
                    name="trash.fill"
                    size={18}
                    color={LogoColors.error}
                  />
                  <ThemedText style={styles.clearButtonText}>
                    Limpiar
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.checkoutButton,
                    isDark && styles.checkoutButtonDark,
                    isSubmitting && styles.checkoutButtonDisabled,
                  ]}
                  onPress={handleSendToCashier}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#fff" />
                      <ThemedText style={[styles.checkoutButtonText, { marginLeft: 8 }]}>
                        Enviando...
                      </ThemedText>
                    </View>
                  ) : (
                    <>
                      <IconSymbol
                        name="checkmark.circle.fill"
                        size={20}
                        color="#fff"
                        style={{ marginRight: 8 }}
                      />
                      <ThemedText style={styles.checkoutButtonText}>
                        Enviar a caja
                      </ThemedText>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </>
      )}

      {/* Modal para ingresar nombre del cliente */}
      <Modal
        visible={showClientModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowClientModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowClientModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardContainer}
          >
            <Pressable
              style={[styles.modalContent, isDark && styles.modalContentDark]}
              onPress={(e) => e.stopPropagation()}
            >
              <ThemedText
                type="title"
                style={[styles.modalTitle, isDark && styles.modalTitleDark]}
              >
                Enviar a pagar a caja
              </ThemedText>
              <ThemedText
                style={[styles.modalSubtitle, isDark && styles.modalSubtitleDark]}
              >
                Ingresa el nombre del cliente para esta venta:
              </ThemedText>
              <TextInput
                style={[styles.modalInput, isDark && styles.modalInputDark]}
                value={clientName}
                onChangeText={setClientName}
                placeholder="Ej: Juan Pérez, Mostrador 1, etc."
                placeholderTextColor={isDark ? '#9BA1A6' : '#687076'}
                autoFocus={true}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalCancelButton, isDark && styles.modalCancelButtonDark]}
                  onPress={() => {
                    setShowClientModal(false);
                    setClientName('');
                  }}
                >
                  <ThemedText style={styles.modalCancelText}>Cancelar</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalConfirmButton, isDark && styles.modalConfirmButtonDark]}
                  onPress={handleConfirmSendToCashier}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <View style={styles.modalLoadingContainer}>
                      <ActivityIndicator size="small" color="#fff" />
                      <ThemedText style={[styles.modalConfirmText, { marginLeft: 8 }]}>
                        Enviando...
                      </ThemedText>
                    </View>
                  ) : (
                    <ThemedText style={styles.modalConfirmText}>Enviar</ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* Toast de éxito */}
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
  listContent: {
    padding: 16,
    paddingBottom: 200,
  },
  addMoreButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 2,
    borderColor: LogoColors.red,
    borderStyle: 'dashed',
  },
  addMoreButtonDark: {
    backgroundColor: '#1E1E1E',
    borderColor: LogoColors.red,
  },
  addMoreButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addMoreIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(220, 20, 60, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(220, 20, 60, 0.2)',
  },
  addMoreIconContainerDark: {
    backgroundColor: 'rgba(220, 20, 60, 0.15)',
    borderColor: 'rgba(220, 20, 60, 0.3)',
  },
  addMoreTextContainer: {
    flex: 1,
  },
  addMoreButtonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#11181C',
    marginBottom: 2,
  },
  addMoreButtonSubtitle: {
    fontSize: 13,
    color: '#687076',
    fontWeight: '500',
  },
  addMoreButtonSubtitleDark: {
    color: '#9BA1A6',
  },
  cartItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    overflow: 'hidden',
  },
  cartItemDark: {
    backgroundColor: '#1E1E1E',
    borderColor: '#2a2a2a',
  },
  cartItemMain: {
    padding: 16,
  },
  cartItemInfo: {
    marginBottom: 16,
  },
  productHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(220, 20, 60, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(220, 20, 60, 0.2)',
  },
  productNameContainer: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 6,
    lineHeight: 22,
  },
  cartItemNameDark: {
    color: '#ECEDEE',
  },
  presentationBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  cartItemPresentation: {
    fontSize: 12,
    fontWeight: '500',
    color: '#667eea',
  },
  cartItemPresentationDark: {
    color: '#8B9AFF',
  },
  granelBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  granelBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B8860B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  priceRowDark: {
    borderTopColor: '#2a2a2a',
  },
  cartItemPriceLabel: {
    fontSize: 13,
    color: '#687076',
    fontWeight: '500',
  },
  cartItemPriceLabelDark: {
    color: '#9BA1A6',
  },
  cartItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#11181C',
  },
  cartItemPriceDark: {
    color: '#ECEDEE',
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cartItemActionsDark: {
    borderTopColor: '#2a2a2a',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quantityControlsDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#3a3a3a',
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quantityButtonDark: {
    backgroundColor: '#1E1E1E',
    borderColor: '#3a3a3a',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#11181C',
  },
  quantityButtonTextDark: {
    color: '#ECEDEE',
  },
  quantityDisplay: {
    minWidth: 50,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityDisplayDark: {
    backgroundColor: '#1E1E1E',
    borderColor: '#3a3a3a',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#11181C',
    textAlign: 'center',
  },
  quantityTextDark: {
    color: '#ECEDEE',
  },
  quantityDisplayGranel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  quantityLabel: {
    fontSize: 13,
    color: '#687076',
    marginRight: 8,
    fontWeight: '500',
  },
  quantityLabelDark: {
    color: '#9BA1A6',
  },
  quantityTextGranel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#B8860B',
  },
  quantityTextGranelDark: {
    color: '#FFD700',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartItemTotalLabel: {
    fontSize: 13,
    color: '#687076',
    fontWeight: '500',
  },
  cartItemTotalLabelDark: {
    color: '#9BA1A6',
  },
  cartItemTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: LogoColors.success,
  },
  cartItemTotalDark: {
    color: LogoColors.success,
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
  },
  removeButtonDark: {
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 2,
    borderTopColor: LogoColors.red,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  footerDark: {
    backgroundColor: '#1E1E1E',
    borderTopColor: LogoColors.red,
  },
  footerContent: {
    marginBottom: 16,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
  },
  totalContainerDark: {
    borderBottomColor: '#2a2a2a',
  },
  totalLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#11181C',
  },
  totalLabelDark: {
    color: '#ECEDEE',
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: LogoColors.success,
    letterSpacing: 0.5,
  },
  totalAmountDark: {
    color: LogoColors.success,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  clearButtonDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#3a3a3a',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: LogoColors.error,
    marginLeft: 6,
  },
  checkoutButton: {
    flex: 2,
    backgroundColor: LogoColors.red,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: LogoColors.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  checkoutButtonDark: {
    backgroundColor: LogoColors.red,
  },
  checkoutButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(220, 20, 60, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(220, 20, 60, 0.2)',
  },
  emptyIconContainerDark: {
    backgroundColor: 'rgba(220, 20, 60, 0.15)',
    borderColor: 'rgba(220, 20, 60, 0.3)',
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
    color: '#11181C',
    textAlign: 'center',
  },
  emptyTextDark: {
    color: '#ECEDEE',
  },
  emptySubtext: {
    fontSize: 16,
    marginTop: 12,
    color: '#687076',
    textAlign: 'center',
    lineHeight: 24,
  },
  emptySubtextDark: {
    color: '#9BA1A6',
  },
  shopButton: {
    marginTop: 32,
    backgroundColor: LogoColors.red,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: LogoColors.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  shopButtonDark: {
    backgroundColor: LogoColors.red,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalKeyboardContainer: {
    width: '100%',
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContentDark: {
    backgroundColor: '#1E1E1E',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#11181C',
    marginBottom: 8,
  },
  modalTitleDark: {
    color: '#ECEDEE',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#687076',
    marginBottom: 20,
  },
  modalSubtitleDark: {
    color: '#9BA1A6',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#11181C',
    backgroundColor: '#f9fafb',
    marginBottom: 24,
  },
  modalInputDark: {
    borderColor: '#2a2a2a',
    backgroundColor: '#2a2a2a',
    color: '#ECEDEE',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
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
  modalConfirmButton: {
    flex: 2,
    backgroundColor: LogoColors.red,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalConfirmButtonDark: {
    backgroundColor: '#667eea',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff', 
  },
});

