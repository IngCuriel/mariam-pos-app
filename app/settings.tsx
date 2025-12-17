import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { getApiUrl, saveApiUrl, getDefaultApiUrl } from '@/utils/apiConfig';
import { updateApiUrl } from '@/app/api/api';

const logoRed = '#DC143C';
const logoYellow = '#FFD700';

export default function SettingsScreen() {
  const router = useRouter();
  const [apiUrl, setApiUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadApiUrl();
  }, []);

  const loadApiUrl = async () => {
    try {
      setIsLoading(true);
      const url = await getApiUrl();
      setApiUrl(url);
    } catch (error) {
      console.error('Error al cargar la configuración:', error);
      setApiUrl(getDefaultApiUrl());
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!apiUrl.trim()) {
        Alert.alert('Error', 'La URL no puede estar vacía');
        return;
      }

      // Validar formato de URL
      try {
        new URL(apiUrl);
      } catch {
        Alert.alert('Error', 'Por favor ingresa una URL válida (ej: http://192.168.0.17:3001)');
        return;
      }

      setIsSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Guardar la configuración en AsyncStorage (equivalente a localStorage en React Native)
      await saveApiUrl(apiUrl);
      
      // Actualizar el cliente axios
      await updateApiUrl(apiUrl);

      // Feedback háptico de éxito
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Mostrar mensaje y cerrar automáticamente después de un breve delay
      Alert.alert(
        'Guardado correctamente',
        'La configuración ha sido guardada exitosamente',
        [
          {
            text: 'OK',
            onPress: () => {
              router.back();
            },
          },
        ],
        { cancelable: false }
      );

      // Cerrar la pantalla automáticamente después de 1 segundo
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (error) {
      console.error('Error al guardar la configuración:', error);
      Alert.alert('Error', 'No se pudo guardar la configuración. Por favor intenta de nuevo.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={logoRed} />
        <ThemedText style={styles.loadingText}>Cargando configuración...</ThemedText>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      <LinearGradient
        colors={[logoRed, '#C41E3A', '#B71C1C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.back();
                }}
                style={styles.backButton}
              >
                <IconSymbol name="chevron.left" size={24} color="#fff" />
              </Pressable>
              <ThemedText style={styles.title}>Configuración</ThemedText>
              <View style={styles.placeholder} />
            </View>

            {/* Icono de configuración */}
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <IconSymbol name="gearshape.fill" size={48} color="#fff" />
              </View>
            </View>

            {/* Formulario */}
            <View style={styles.formContainer}>
              <ThemedText style={styles.label}>
                URL del Servidor API
              </ThemedText>
              <ThemedText style={styles.description}>
                Ingresa la dirección IP y puerto del servidor (ej: http://192.168.0.17:3001)
              </ThemedText>

              <TextInput
                style={styles.input}
                value={apiUrl}
                onChangeText={setApiUrl}
                placeholder="http://192.168.0.17:3001"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />

              {/* Botones de acción */}
              <View style={styles.actionsContainer}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.back();
                  }}
                  style={styles.cancelButton}
                >
                  <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
                </Pressable>

                <Pressable
                  onPress={handleSave}
                  disabled={isSaving}
                  style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={logoRed} />
                  ) : (
                    <LinearGradient
                      colors={[logoYellow, '#FFC107']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.saveButtonGradient}
                    >
                      <ThemedText style={styles.saveButtonText}>Guardar</ThemedText>
                    </LinearGradient>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#DC143C',
  },
  loadingText: {
    marginTop: 16,
    color: '#fff',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  formContainer: {
    width: '100%',
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
    lineHeight: 20,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: logoRed,
    fontSize: 16,
    fontWeight: '800',
  },
});

