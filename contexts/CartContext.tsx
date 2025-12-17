import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { playAddToCartSound } from '@/utils/sound';

const CART_STORAGE_KEY = '@mariam_pos_cart';

export interface CartItem {
  productId: string;
  productName: string;
  presentationId?: string;
  presentationName?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  saleType?: string | null;
  basePrice?: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'total'>) => void;
  removeFromCart: (productId: string, presentationId?: string) => void;
  updateQuantity: (productId: string, presentationId: string | undefined, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar el carrito desde AsyncStorage al inicializar
  useEffect(() => {
    loadCartFromStorage();
  }, []);

  // Guardar el carrito en AsyncStorage cada vez que cambie (solo después de la carga inicial)
  useEffect(() => {
    if (!isLoading) {
      saveCartToStorage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const loadCartFromStorage = async () => {
    try {
      const cartData = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (cartData) {
        const parsedItems = JSON.parse(cartData);
        setItems(parsedItems);
      }
    } catch (error) {
      console.error('Error al cargar el carrito desde AsyncStorage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCartToStorage = async () => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error al guardar el carrito en AsyncStorage:', error);
    }
  };

  const addToCart = (item: Omit<CartItem, 'total'>) => {
    // Reproducir sonido cuando se agrega un producto
    playAddToCartSound();
    
    setItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (i) => i.productId === item.productId && i.presentationId === item.presentationId
      );

      // Para granel, siempre usar basePrice para calcular total
      const basePrice = item.basePrice || item.unitPrice;
      const total = item.quantity * basePrice;

      if (existingItemIndex >= 0) {
        // Si ya existe, actualizar cantidad
        const updatedItems = [...prevItems];
        const existingBasePrice = updatedItems[existingItemIndex].basePrice || updatedItems[existingItemIndex].unitPrice;
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + item.quantity,
          total: (updatedItems[existingItemIndex].quantity + item.quantity) * existingBasePrice,
        };
        return updatedItems;
      } else {
        // Si no existe, agregar nuevo
        return [
          ...prevItems,
          {
            ...item,
            unitPrice: basePrice, // Siempre usar precio base como unitPrice
            total: total,
          },
        ];
      }
    });
  };

  const removeFromCart = (productId: string, presentationId?: string) => {
    setItems((prevItems) =>
      prevItems.filter(
        (item) => !(item.productId === productId && item.presentationId === presentationId)
      )
    );
  };

  const updateQuantity = (productId: string, presentationId: string | undefined, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, presentationId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.productId === productId && item.presentationId === presentationId) {
          // Usar basePrice si existe (para granel o presentaciones), sino usar unitPrice
          const priceToUse = item.basePrice || item.unitPrice;
          return {
            ...item,
            quantity,
            total: quantity * priceToUse,
            unitPrice: priceToUse, // Mantener el precio unitario (que es el total de la presentación)
          };
        }
        return item;
      })
    );
  };

  const clearCart = async () => {
    setItems([]);
    try {
      await AsyncStorage.removeItem(CART_STORAGE_KEY);
    } catch (error) {
      console.error('Error al limpiar el carrito en AsyncStorage:', error);
    }
  };

  const getTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const getItemCount = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0).toFixed(0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

