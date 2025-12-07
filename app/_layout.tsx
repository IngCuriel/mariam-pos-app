import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CartProvider, useCart } from '@/contexts/CartContext';
import { CartBadge } from '@/components/CartBadge';
import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LogoColors } from '@/constants/logoColors';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  return (
    <CartProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="categories" 
          options={{
            headerShown: true,
            title: 'Categorías',
            headerStyle: {
              backgroundColor: LogoColors.red,
            },
            headerTintColor: LogoColors.white,
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18,
            },
            headerTitleContainerStyle: {
              maxWidth: '60%',
            },
            headerRight: () => (
              <HeaderActions />
            ),
          }}
        />
        <Stack.Screen 
          name="products" 
          options={{
            headerShown: true,
            title: 'Productos',
            headerStyle: {
              backgroundColor: LogoColors.red,
            },
            headerTintColor: LogoColors.white,
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 12,
            },
            headerTitleContainerStyle: {
              maxWidth: '60%',
            },
            headerRight: () => (
              <HeaderActions />
            ),
          }}
        />
        <Stack.Screen 
          name="cart" 
          options={{
            headerShown: true,
            title: 'Carrito',
            headerStyle: {
              backgroundColor: LogoColors.red,
            },
            headerTintColor: LogoColors.white,
             headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <Stack.Screen 
          name="scanner" 
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen 
          name="search" 
          options={{
            headerShown: true,
            title: 'Buscar Productos',
            headerStyle: {
              backgroundColor: LogoColors.red,
            },
            headerTintColor: LogoColors.white,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            headerRight: () => <CartBadge />,
          }}
        />
        <Stack.Screen 
          name="copies" 
          options={{
            headerShown: true,
            title: '🖨️ Módulo de Copias',
            headerStyle: {
              backgroundColor: LogoColors.red,
            },
            headerTintColor: LogoColors.white,
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18,
            },
            headerBackTitleVisible: false,
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </CartProvider>
  );
}

function HeaderActions() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.headerActionsContainer}>
      <TouchableOpacity
        onPress={() => router.push('/search')}
        style={styles.headerActionButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <IconSymbol
          name="paperplane.fill"
          size={22}
          color="#fff"
        />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push('/scanner')}
        style={styles.headerActionButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <IconSymbol
          name="creditcard.fill"
          size={22}
          color="#fff"
        />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push('/copies')}
        style={styles.headerActionButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <IconSymbol
          name="printer.fill"
          size={22}
          color="#fff"
        />
      </TouchableOpacity>
      <View style={styles.cartBadgeContainer}>
        <CartBadge />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  headerActionButton: {
    padding: 6,
    marginRight: 4,
    borderRadius: 8,
    minWidth: 36,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeContainer: {
    marginLeft: 2,
  },
});
