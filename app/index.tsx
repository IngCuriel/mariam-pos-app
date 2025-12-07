import React from 'react';
import { StyleSheet, View, Dimensions, StatusBar, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter, Link } from 'expo-router';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WelcomeScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  // Colores del logo Mini Super Curiel
  const logoRed = '#DC143C'; // Rojo brillante del logo
  const logoYellow = '#FFD700'; // Amarillo del logo
  const logoDarkBrown = '#8B4513'; // Marrón oscuro del logo
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[logoRed, '#C41E3A', '#B71C1C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Icono principal compacto */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircleOuter}>
              <View style={styles.iconCircle}>
                <IconSymbol
                  name="store.fill"
                  size={48}
                  color="#fff"
                />
              </View>
            </View>
          </View>

          {/* Texto de bienvenida compacto */}
          <View style={styles.textContainer}>
            <ThemedText 
              type="title" 
              style={styles.welcomeTitle}
            >
              Bienvenido
            </ThemedText>
            <ThemedText 
              type="title" 
              style={styles.welcomeSubtitle}
            >
              Mini Super Curiel
            </ThemedText>
          </View>

          {/* Descripción compacta */}
          <View style={styles.descriptionContainer}>
            <ThemedText 
              style={styles.description}
            >
              SISTEMA DE PUNTO DE VENTA
            </ThemedText>
          </View>

          {/* Botón de inicio con colores del logo */}
          <Link href="/categories" asChild>
            <Pressable
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={styles.startButtonWrapper}
            >
              <Animated.View
                style={[
                  styles.startButtonContainer,
                  { transform: [{ scale: scaleAnim }] },
                ]}
              >
                <LinearGradient
                  colors={[logoYellow, '#FFC107']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.startButtonGradient}
                >
                  <ThemedText style={styles.startButtonText}>
                    Comenzar
                  </ThemedText>
                  <View style={styles.startButtonIconContainer}>
                    <IconSymbol
                      name="chevron.right"
                      size={18}
                      color={logoRed}
                    />
                  </View>
                </LinearGradient>
              </Animated.View>
            </Pressable>
          </Link>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  iconContainer: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  welcomeSubtitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  descriptionContainer: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  description: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  startButtonWrapper: {
    width: '100%',
    maxWidth: 280,
    zIndex: 10,
    position: 'relative',
  },
  startButtonContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
  },
  startButtonText: {
    color: '#DC143C',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginRight: 10,
  },
  startButtonIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(220, 20, 60, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

