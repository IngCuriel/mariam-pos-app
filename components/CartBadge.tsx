import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from './themed-text';
import { IconSymbol } from './ui/icon-symbol';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LogoColors } from '@/constants/logoColors';

export function CartBadge() {
  const { getItemCount } = useCart();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const itemCount = getItemCount();

  if (itemCount === 0) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push('/cart' as any)}
      activeOpacity={0.8}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <IconSymbol
        name="cart.fill"
        size={22}
        color="#fff"
        style={styles.cartIcon}
      />
      <View style={[styles.badge, isDark && styles.badgeDark]}>
        <ThemedText style={styles.badgeText}>
          {itemCount > 99 ? '99+' : itemCount}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 4,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    padding: 6,
    borderRadius: 8,
    minWidth: 36,
    minHeight: 36,
    justifyContent: 'center',
  },
  cartIcon: {
    marginRight: 0,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: LogoColors.white,
  },
  badgeDark: {
    backgroundColor: '#DC2626',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});

