import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { ThemedText } from './themed-text';
import { IconSymbol } from './ui/icon-symbol';

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  type?: 'success' | 'error' | 'info';
}

export function Toast({ message, visible, onHide, type = 'success' }: ToastProps) {
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(3000), // Aumentado a 3 segundos para mejor visibilidad
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide();
      });
    }
  }, [visible, opacity, onHide]);

  if (!visible) return null;

  const backgroundColor = type === 'success' ? '#10B981' : type === 'error' ? '#DC2626' : '#667eea';

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity, transform: [{ translateY: opacity.interpolate({ inputRange: [0, 1], outputRange: [-50, 0] }) }] },
      ]}
    >
      <View style={[styles.toast, { backgroundColor }]}>
        <IconSymbol 
          name={type === 'success' ? 'checkmark.circle.fill' : type === 'error' ? 'xmark.circle.fill' : 'info.circle.fill'} 
          size={20} 
          color="#fff" 
        />
        <ThemedText style={styles.message}>{message}</ThemedText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1000,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  message: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

