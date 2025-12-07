import { Audio } from 'expo-av';
import { Platform } from 'react-native';

let soundObject: Audio.Sound | null = null;
let isSoundLoaded = false;

/**
 * Genera un sonido beep simple usando Web Audio API (para web)
 */
function generateBeepSound(): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Crear un contexto de audio
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configurar el beep (frecuencia, duración, volumen)
    oscillator.frequency.value = 800; // Frecuencia en Hz (tono agradable)
    oscillator.type = 'sine'; // Tipo de onda (sine = suave)

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime); // Volumen
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1); // Fade out

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1); // Duración: 100ms
  } catch (error) {
    console.log('Error al generar beep:', error);
  }
}

/**
 * Reproduce un sonido de éxito cuando se agrega un producto al carrito
 */
export async function playAddToCartSound() {
  try {
    // En web, usar Web Audio API para generar un beep simple
    if (Platform.OS === 'web') {
      try {
        generateBeepSound();
        return;
      } catch (error) {
        console.log('Web Audio no disponible, usando alternativa');
      }
    }

    // Para móvil (iOS/Android), crear un sonido simple generado programáticamente
    // Configurar el modo de audio
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    // Si ya hay un sonido cargado, reproducirlo
    if (soundObject && isSoundLoaded) {
      await soundObject.replayAsync();
      return;
    }

    // Crear un sonido beep simple usando datos de audio generados
    // Generamos un beep de 200ms a 800Hz
    const sampleRate = 44100;
    const duration = 0.2; // 200ms
    const frequency = 800; // Hz
    const numSamples = Math.floor(sampleRate * duration);
    const samples = new Float32Array(numSamples);

    // Generar onda senoidal con fade in/out
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const fadeIn = Math.min(1, t / 0.05); // Fade in en 50ms
      const fadeOut = Math.min(1, (duration - t) / 0.05); // Fade out en 50ms
      const fade = fadeIn * fadeOut;
      samples[i] = Math.sin(2 * Math.PI * frequency * t) * fade * 0.3; // Volumen 30%
    }

    // Crear un sonido desde los datos generados
    // Nota: expo-av no soporta directamente datos de audio generados
    // Para una solución completa, necesitarías un archivo de audio
    // Por ahora, usaremos un enfoque alternativo
    
    // Alternativa: Usar un sonido del sistema o un beep simple
    // Para móvil, el feedback háptico ya proporciona retroalimentación táctil
    
    // Si quieres un sonido personalizado en móvil, agrega un archivo:
    // 1. Crea assets/sounds/add-to-cart.mp3 (un beep corto de ~200ms)
    // 2. Descomenta y usa el código en loadAddToCartSound()
    
    // Por ahora, el sonido funcionará en web y el feedback háptico en móvil
    console.log('🔊 Sonido de agregar al carrito (móvil: usando feedback háptico)');
    
  } catch (error) {
    // Si falla, no hacer nada (fallo silencioso)
    // El feedback háptico ya proporciona retroalimentación
    console.log('Sonido no disponible, usando solo feedback háptico');
  }
}

/**
 * Carga el sonido de agregar al carrito (opcional, para archivos de audio)
 */
export async function loadAddToCartSound() {
  try {
    // Si tienes un archivo de sonido, cárgalo aquí
    // Ejemplo:
    // const { sound } = await Audio.Sound.createAsync(
    //   require('../assets/sounds/add-to-cart.mp3')
    // );
    // soundObject = sound;
    // await sound.setVolumeAsync(0.5);
    // isSoundLoaded = true;
  } catch (error) {
    console.error('Error al cargar sonido:', error);
  }
}

/**
 * Limpia el sonido cuando ya no se necesita
 */
export async function unloadAddToCartSound() {
  try {
    if (soundObject) {
      await soundObject.unloadAsync();
      soundObject = null;
      isSoundLoaded = false;
    }
  } catch (error) {
    console.error('Error al descargar sonido:', error);
  }
}

