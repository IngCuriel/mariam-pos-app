import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter, useNavigation } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogoColors } from '@/constants/logoColors';
import {
  printCopies,
  photocopy,
  scanDocument,
  createPdfFromImages,
  combineImages,
  getAvailablePrinters,
} from './api/copies';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STORAGE_KEY_PRINTERS = 'mariam_pos_printers';
const STORAGE_KEY_DEFAULT_PRINTER = 'mariam_pos_default_printer';

interface Printer {
  id: string;
  name: string;
  isDefault: boolean;
}

type Mode = 'print' | 'photocopy' | 'scan';
type ColorMode = 'color' | 'bw';
type ScanFormat = 'jpg' | 'png' | 'pdf';

export default function CopiesScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const navigation = useNavigation();
  const isDark = colorScheme === 'dark';

  // Estados principales
  const [mode, setMode] = useState<Mode>('print');
  const [copies, setCopies] = useState<number>(1);
  const [colorMode, setColorMode] = useState<ColorMode>('bw');
  const [isPrinting, setIsPrinting] = useState(false);
  const [isPhotocopying, setIsPhotocopying] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  // Estados para doble cara
  const [doubleSided, setDoubleSided] = useState<boolean>(false);
  const [photocopySide, setPhotocopySide] = useState<'first' | 'second' | null>(null);
  const [firstSideUri, setFirstSideUri] = useState<string | null>(null);
  
  // Estados para escaneo
  const [scanFormat, setScanFormat] = useState<ScanFormat>('jpg');
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const pdfPagesRef = useRef<string[]>([]);
  
  // Estados para impresoras
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);
  const [newPrinterName, setNewPrinterName] = useState<string>('');
  const [defaultPrinter, setDefaultPrinter] = useState<string>('');
  
  // Estado para archivo seleccionado
  const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string } | null>(null);
  const [pdfPageCount, setPdfPageCount] = useState<number>(0);

  // Cargar impresoras al iniciar
  useEffect(() => {
    loadPrinters();
    loadDefaultPrinter();
  }, []);

  // Configurar el header con botón de configuración
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowConfigModal(true);
          }}
          style={{ marginRight: 16, padding: 8 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol
            name="gearshape.fill"
            size={24}
            color={LogoColors.white}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // Limpiar estados cuando cambia el modo
  useEffect(() => {
    if (mode !== 'scan') {
      setPdfPages([]);
      pdfPagesRef.current = [];
    }
    if (mode !== 'photocopy') {
      setDoubleSided(false);
      setPhotocopySide(null);
      setFirstSideUri(null);
    }
  }, [mode]);

  const loadPrinters = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY_PRINTERS);
      if (saved) {
        const parsed = JSON.parse(saved) as Printer[];
        setPrinters(parsed);
      }
    } catch (error) {
      console.error('Error al cargar impresoras:', error);
    }
  };

  const loadDefaultPrinter = async () => {
    try {
      const defaultName = await AsyncStorage.getItem(STORAGE_KEY_DEFAULT_PRINTER);
      if (defaultName) {
        setDefaultPrinter(defaultName);
      }
    } catch (error) {
      console.error('Error al cargar impresora predeterminada:', error);
    }
  };

  const savePrinters = async (printerList: Printer[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_PRINTERS, JSON.stringify(printerList));
      setPrinters(printerList);
    } catch (error) {
      console.error('Error al guardar impresoras:', error);
    }
  };

  const saveDefaultPrinter = async (name: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_DEFAULT_PRINTER, name);
      setDefaultPrinter(name);
    } catch (error) {
      console.error('Error al guardar impresora predeterminada:', error);
    }
  };

  const handleCopiesChange = (value: string) => {
    const num = parseInt(value, 10) || 1;
    if (num < 1) return;
    if (num > 100) return;
    setCopies(num);
  };

  const handleFileSelect = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile({ uri: file.uri, name: file.name || 'archivo' });
        
        // Detectar páginas si es PDF
        if (file.mimeType === 'application/pdf' || file.name?.endsWith('.pdf')) {
          // En React Native, no podemos leer PDF directamente, así que asumimos 1 página
          // El backend lo detectará correctamente
          setPdfPageCount(1);
        } else {
          setPdfPageCount(1);
        }
      }
    } catch (error) {
      console.error('Error al seleccionar archivo:', error);
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const handlePrint = async () => {
    if (!defaultPrinter) {
      Alert.alert(
        'No hay impresora configurada',
        'Por favor, configura una impresora por defecto en la configuración',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ir a Configuración', onPress: () => setShowConfigModal(true) },
        ]
      );
      return;
    }

    if (!selectedFile) {
      Alert.alert('No hay archivo seleccionado', 'Por favor, selecciona un archivo para imprimir');
      return;
    }

    setIsPrinting(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await printCopies(selectedFile.uri, copies, colorMode, defaultPrinter);
      
      Alert.alert(
        '¡Éxito!',
        `Se enviaron ${copies} copia(s) del archivo`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Error al imprimir:', error);
      Alert.alert(
        'Error al imprimir',
        error.response?.data?.message || error.response?.data?.error || error.message || 'No se pudo imprimir el archivo'
      );
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePhotocopy = async () => {
    if (!defaultPrinter) {
      Alert.alert(
        'No hay impresora configurada',
        'Por favor, configura una impresora por defecto en la configuración',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ir a Configuración', onPress: () => setShowConfigModal(true) },
        ]
      );
      return;
    }

    // Si es doble cara y aún no se ha escaneado la primera cara
    if (doubleSided && photocopySide === null) {
      setIsPhotocopying(true);
      setPhotocopySide('first');
      
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const firstSideUri = await scanDocument(colorMode, 'jpg');
        setFirstSideUri(firstSideUri);
        setIsPhotocopying(false);
        
        Alert.alert(
          'Frente escaneado',
          'El frente de la credencial se ha escaneado correctamente.\n\nPor favor:\n1. Voltea la credencial\n2. Coloca el reverso en la cama del escáner\n3. Haz clic en "Continuar" para escanear el reverso',
          [
            { text: 'Cancelar', style: 'cancel', onPress: () => {
              setFirstSideUri(null);
              setPhotocopySide(null);
            }},
            { text: 'Continuar con reverso', onPress: async () => {
              setIsPhotocopying(true);
              setPhotocopySide('second');
              
              try {
                const secondSideUri = await scanDocument(colorMode, 'jpg');
                
                // Combinar ambas caras
                const combinedUri = await combineImages([firstSideUri, secondSideUri], 'horizontal');
                
                // Imprimir la imagen combinada
                await printCopies(combinedUri, copies, colorMode, defaultPrinter);
                
                // Limpiar estados
                setFirstSideUri(null);
                setPhotocopySide(null);
                
                Alert.alert(
                  '¡Éxito!',
                  `Se fotocopiaron ${copies} copia(s) a doble cara (frente y reverso combinados en una sola hoja)`,
                  [{ text: 'OK' }]
                );
              } catch (error: any) {
                console.error('Error al escanear segunda cara:', error);
                setFirstSideUri(null);
                setPhotocopySide(null);
                Alert.alert(
                  'Error al escanear reverso',
                  error.response?.data?.message || error.response?.data?.error || error.message || 'No se pudo escanear el reverso de la credencial.'
                );
              } finally {
                setIsPhotocopying(false);
              }
            }},
          ]
        );
      } catch (error: any) {
        console.error('Error al escanear primera cara:', error);
        setPhotocopySide(null);
        Alert.alert(
          'Error al escanear frente',
          error.response?.data?.message || error.response?.data?.error || error.message || 'No se pudo escanear el frente de la credencial.'
        );
      } finally {
        setIsPhotocopying(false);
      }
      return;
    }

    // Fotocopia simple (una cara)
    setIsPhotocopying(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await photocopy(copies, colorMode, defaultPrinter);
      
      Alert.alert(
        '¡Éxito!',
        `Se fotocopiaron ${copies} copia(s) correctamente`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Error al fotocopiar:', error);
      Alert.alert(
        'Error al fotocopiar',
        error.response?.data?.message || error.response?.data?.error || error.message || 'No se pudo completar la fotocopia.'
      );
    } finally {
      setIsPhotocopying(false);
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const format = scanFormat === 'pdf' ? 'jpg' : scanFormat;
      const scannedUri = await scanDocument('color', format);

      if (scanFormat === 'pdf') {
        // Agregar a la lista de páginas
        const updatedPages = [...pdfPages, scannedUri];
        setPdfPages(updatedPages);
        pdfPagesRef.current = updatedPages;

        Alert.alert(
          '¡Página escaneada!',
          `Página agregada al PDF\n\nTotal de páginas: ${updatedPages.length}\n\n¿Deseas agregar más páginas?`,
          [
            { text: 'Finalizar PDF', onPress: () => handleFinalizePdf() },
            { text: 'Agregar otra página', style: 'cancel' },
          ]
        );
      } else {
        // Descargar/Compartir el archivo escaneado
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(scannedUri);
        } else {
          Alert.alert('Éxito', 'El documento se ha escaneado correctamente');
        }
      }
    } catch (error: any) {
      console.error('Error al escanear:', error);
      Alert.alert(
        'Error al escanear',
        error.response?.data?.message || error.response?.data?.error || error.message || 'No se pudo escanear el documento. Asegúrate de que haya un documento en la cama del escáner.'
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleFinalizePdf = async () => {
    const currentPages = pdfPagesRef.current.length > 0 ? pdfPagesRef.current : pdfPages;
    
    if (currentPages.length === 0) {
      Alert.alert('No hay páginas', 'No hay páginas escaneadas para crear el PDF');
      return;
    }

    setIsScanning(true);
    try {
      const pdfUri = await createPdfFromImages(currentPages);
      
      // Compartir el PDF
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(pdfUri);
      }
      
      // Limpiar páginas
      setPdfPages([]);
      pdfPagesRef.current = [];
      
      Alert.alert(
        '¡PDF creado!',
        `Se creó un PDF con ${currentPages.length} página(s)`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Error al crear PDF:', error);
      Alert.alert(
        'Error al crear PDF',
        error.response?.data?.error || error.message || 'No se pudo crear el PDF'
      );
    } finally {
      setIsScanning(false);
    }
  };

  // Funciones para gestión de impresoras
  const handleAddPrinter = async () => {
    if (!newPrinterName.trim()) {
      Alert.alert('Error', 'Por favor, ingresa un nombre para la impresora');
      return;
    }

    const newPrinter: Printer = {
      id: Date.now().toString(),
      name: newPrinterName.trim(),
      isDefault: printers.length === 0,
    };

    const updatedPrinters = [...printers, newPrinter];
    await savePrinters(updatedPrinters);

    if (newPrinter.isDefault) {
      await saveDefaultPrinter(newPrinter.name);
    }

    setNewPrinterName('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Éxito', 'Impresora agregada correctamente');
  };

  const handleUpdatePrinter = async () => {
    if (!editingPrinter || !newPrinterName.trim()) {
      Alert.alert('Error', 'Por favor, ingresa un nombre para la impresora');
      return;
    }

    const updatedPrinters = printers.map((p) =>
      p.id === editingPrinter.id ? { ...p, name: newPrinterName.trim() } : p
    );
    await savePrinters(updatedPrinters);

    if (editingPrinter.isDefault) {
      await saveDefaultPrinter(newPrinterName.trim());
    }

    setEditingPrinter(null);
    setNewPrinterName('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Éxito', 'Impresora actualizada correctamente');
  };

  const handleDeletePrinter = async (printer: Printer) => {
    Alert.alert(
      'Eliminar impresora',
      `¿Estás seguro de eliminar la impresora "${printer.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const updatedPrinters = printers.filter((p) => p.id !== printer.id);
            await savePrinters(updatedPrinters);

            if (printer.isDefault && updatedPrinters.length > 0) {
              const newDefault = updatedPrinters[0];
              const printersWithDefault = updatedPrinters.map((p, idx) => ({
                ...p,
                isDefault: idx === 0,
              }));
              await savePrinters(printersWithDefault);
              await saveDefaultPrinter(newDefault.name);
            } else if (printer.isDefault) {
              await AsyncStorage.removeItem(STORAGE_KEY_DEFAULT_PRINTER);
              setDefaultPrinter('');
            }

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Alert.alert('Éxito', 'Impresora eliminada correctamente');
          },
        },
      ]
    );
  };

  const handleSetDefaultPrinter = async (printer: Printer) => {
    const updatedPrinters = printers.map((p) => ({
      ...p,
      isDefault: p.id === printer.id,
    }));
    await savePrinters(updatedPrinters);
    await saveDefaultPrinter(printer.name);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Éxito', `"${printer.name}" ahora es la impresora predeterminada`);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Selector de Modo */}
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[styles.modeCard, mode === 'print' && styles.modeCardActive]}
            onPress={() => {
              setMode('print');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <IconSymbol
              name="printer.fill"
              size={32}
              color={mode === 'print' ? LogoColors.white : LogoColors.red}
            />
            <ThemedText
              style={[
                styles.modeTitle,
                mode === 'print' && styles.modeTitleActive,
              ]}
            >
              Imprimir
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeCard, mode === 'photocopy' && styles.modeCardActive]}
            onPress={() => {
              setMode('photocopy');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <IconSymbol
              name="doc.on.doc.fill"
              size={32}
              color={mode === 'photocopy' ? LogoColors.white : LogoColors.red}
            />
            <ThemedText
              style={[
                styles.modeTitle,
                mode === 'photocopy' && styles.modeTitleActive,
              ]}
            >
              Fotocopiar
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeCard, mode === 'scan' && styles.modeCardActive]}
            onPress={() => {
              setMode('scan');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <IconSymbol
              name="scanner.fill"
              size={32}
              color={mode === 'scan' ? LogoColors.white : LogoColors.red}
            />
            <ThemedText
              style={[
                styles.modeTitle,
                mode === 'scan' && styles.modeTitleActive,
              ]}
            >
              Escanear
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Contenido según el modo */}
        {mode === 'print' && (
          <View style={styles.content}>
            <TouchableOpacity
              style={styles.fileButton}
              onPress={handleFileSelect}
            >
              <IconSymbol name="folder.fill" size={24} color={LogoColors.red} />
              <ThemedText style={styles.fileButtonText}>
                {selectedFile ? selectedFile.name : 'Seleccionar archivo'}
              </ThemedText>
            </TouchableOpacity>

            {selectedFile && pdfPageCount > 0 && (
              <ThemedText style={styles.pageCount}>
                📄 {pdfPageCount} página{pdfPageCount > 1 ? 's' : ''}
              </ThemedText>
            )}

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Cantidad de copias</ThemedText>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => {
                    if (copies > 1) {
                      setCopies(copies - 1);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                >  
                  <IconSymbol name="minus" size={20} color={LogoColors.white} />
                </TouchableOpacity>
                <TextInput
                  style={styles.quantityInput}
                  value={copies.toString()}
                  onChangeText={handleCopiesChange}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => {
                    if (copies < 100) {
                      setCopies(copies + 1);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                > 
                  <IconSymbol name="plus" size={20} color={LogoColors.white} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Modo de color</ThemedText>
              <View style={styles.colorOptions}>
                <TouchableOpacity
                  style={[
                    styles.colorOption,
                    colorMode === 'bw' && styles.colorOptionActive,
                  ]}
                  onPress={() => {
                    setColorMode('bw');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <IconSymbol
                    name="circle.fill"
                    size={24}
                    color={colorMode === 'bw' ? LogoColors.white : '#666'}
                  />
                  <ThemedText
                    style={[
                      styles.colorOptionText,
                      colorMode === 'bw' && styles.colorOptionTextActive,
                    ]}
                  >
                    Blanco y Negro
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.colorOption,
                    colorMode === 'color' && styles.colorOptionActive,
                  ]}
                  onPress={() => {
                    setColorMode('color');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <IconSymbol
                    name="paintpalette.fill"
                    size={24}
                    color={colorMode === 'color' ? LogoColors.white : '#666'}
                  />
                  <ThemedText
                    style={[
                      styles.colorOptionText,
                      colorMode === 'color' && styles.colorOptionTextActive,
                    ]}
                  >
                    Color
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.actionButton, isPrinting && styles.actionButtonDisabled]}
              onPress={handlePrint}
              disabled={isPrinting || !selectedFile}
            >
              {isPrinting ? (
                <ActivityIndicator color={LogoColors.white} />
              ) : (
                <>
                  <IconSymbol name="printer.fill" size={20} color={LogoColors.white} />
                  <ThemedText style={styles.actionButtonText}>Imprimir</ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {mode === 'photocopy' && (
          <View style={styles.content}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Cantidad de copias</ThemedText>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => {
                    if (copies > 1) {
                      setCopies(copies - 1);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                >
                  <IconSymbol name="minus" size={20} color={LogoColors.white} />
                </TouchableOpacity>
                <TextInput
                  style={styles.quantityInput}
                  value={copies.toString()}
                  onChangeText={handleCopiesChange}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => {
                    if (copies < 100) {
                      setCopies(copies + 1);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                >
                  <IconSymbol name="plus" size={20} color={LogoColors.white} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Modo de color</ThemedText>
              <View style={styles.colorOptions}>
                <TouchableOpacity
                  style={[
                    styles.colorOption,
                    colorMode === 'bw' && styles.colorOptionActive,
                  ]}
                  onPress={() => {
                    setColorMode('bw');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <IconSymbol
                    name="circle.fill"
                    size={24}
                    color={colorMode === 'bw' ? LogoColors.white : '#666'}
                  />
                  <ThemedText
                    style={[
                      styles.colorOptionText,
                      colorMode === 'bw' && styles.colorOptionTextActive,
                    ]}
                  >
                    Blanco y Negro
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.colorOption,
                    colorMode === 'color' && styles.colorOptionActive,
                  ]}
                  onPress={() => {
                    setColorMode('color');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <IconSymbol
                    name="paintpalette.fill"
                    size={24}
                    color={colorMode === 'color' ? LogoColors.white : '#666'}
                  />
                  <ThemedText
                    style={[
                      styles.colorOptionText,
                      colorMode === 'color' && styles.colorOptionTextActive,
                    ]}
                  >
                    Color
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.doubleSidedOption,
                doubleSided && styles.doubleSidedOptionActive,
              ]}
              onPress={() => {
                setDoubleSided(!doubleSided);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <IconSymbol
                name="doc.on.doc.fill"
                size={24}
                color={doubleSided ? LogoColors.white : LogoColors.red}
              />
              <ThemedText
                style={[
                  styles.doubleSidedText,
                  doubleSided && styles.doubleSidedTextActive,
                ]}
              >
                Doble cara (Credencial)
              </ThemedText>
            </TouchableOpacity>

            {photocopySide && (
              <ThemedText style={styles.statusText}>
                {photocopySide === 'first' ? '📄 Escaneando frente...' : '📄 Escaneando reverso...'}
              </ThemedText>
            )}

            <TouchableOpacity
              style={[
                styles.actionButton,
                isPhotocopying && styles.actionButtonDisabled,
              ]}
              onPress={handlePhotocopy}
              disabled={isPhotocopying}
            >
              {isPhotocopying ? (
                <ActivityIndicator color={LogoColors.white} />
              ) : (
                <>
                  <IconSymbol name="doc.on.doc.fill" size={20} color={LogoColors.white} />
                  <ThemedText style={styles.actionButtonText}>
                    {doubleSided && photocopySide === null
                      ? 'Escanear Frente'
                      : doubleSided && photocopySide === 'first'
                      ? 'Escanear Reverso'
                      : 'Fotocopiar'}
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {mode === 'scan' && (
          <View style={styles.content}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Formato de salida</ThemedText>
              <View style={styles.formatOptions}>
                <TouchableOpacity
                  style={[
                    styles.formatOption,
                    scanFormat === 'jpg' && styles.formatOptionActive,
                  ]}
                  onPress={() => {
                    setScanFormat('jpg');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <ThemedText
                    style={[
                      styles.formatOptionText,
                      scanFormat === 'jpg' && styles.formatOptionTextActive,
                    ]}
                  >
                    JPG
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.formatOption,
                    scanFormat === 'png' && styles.formatOptionActive,
                  ]}
                  onPress={() => {
                    setScanFormat('png');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <ThemedText
                    style={[
                      styles.formatOptionText,
                      scanFormat === 'png' && styles.formatOptionTextActive,
                    ]}
                  >
                    PNG
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.formatOption,
                    scanFormat === 'pdf' && styles.formatOptionActive,
                  ]}
                  onPress={() => {
                    setScanFormat('pdf');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <ThemedText
                    style={[
                      styles.formatOptionText,
                      scanFormat === 'pdf' && styles.formatOptionTextActive,
                    ]}
                  >
                    PDF
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            {scanFormat === 'pdf' && pdfPages.length > 0 && (
              <View style={styles.pdfPagesInfo}>
                <ThemedText style={styles.pdfPagesText}>
                  📄 {pdfPages.length} página{pdfPages.length > 1 ? 's' : ''} escaneada{pdfPages.length > 1 ? 's' : ''}
                </ThemedText>
                <TouchableOpacity
                  style={styles.finalizeButton}
                  onPress={handleFinalizePdf}
                >
                  <ThemedText style={styles.finalizeButtonText}>Finalizar PDF</ThemedText>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.actionButton,
                isScanning && styles.actionButtonDisabled,
              ]}
              onPress={handleScan}
              disabled={isScanning}
            >
              {isScanning ? (
                <ActivityIndicator color={LogoColors.white} />
              ) : (
                <>
                  <IconSymbol name="scanner.fill" size={20} color={LogoColors.white} />
                  <ThemedText style={styles.actionButtonText}>
                    {scanFormat === 'pdf' ? 'Agregar Página' : 'Escanear'}
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Modal de Configuración de Impresoras */}
      <Modal
        visible={showConfigModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowConfigModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="title" style={styles.modalTitle}>
                Configuración de Impresoras
              </ThemedText>
              <TouchableOpacity
                onPress={() => {
                  setShowConfigModal(false);
                  setEditingPrinter(null);
                  setNewPrinterName('');
                }}
              >
                <IconSymbol name="xmark" size={24} color={LogoColors.red} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>
                  {editingPrinter ? 'Editar nombre' : 'Nombre de la impresora'}
                </ThemedText>
                <TextInput
                  style={styles.textInput}
                  value={newPrinterName}
                  onChangeText={setNewPrinterName}
                  placeholder="Ej: Epson L380"
                  placeholderTextColor="#999"
                />
              </View>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={editingPrinter ? handleUpdatePrinter : handleAddPrinter}
              >
                <ThemedText style={styles.modalButtonText}>
                  {editingPrinter ? 'Actualizar' : 'Agregar'}
                </ThemedText>
              </TouchableOpacity>

              <ThemedText style={styles.modalSectionTitle}>Impresoras guardadas</ThemedText>
              {printers.length === 0 ? (
                <ThemedText style={styles.emptyText}>No hay impresoras configuradas</ThemedText>
              ) : (
                printers.map((printer) => (
                  <View key={printer.id} style={styles.printerItem}>
                    <View style={styles.printerInfo}>
                      <ThemedText style={styles.printerName}>{printer.name}</ThemedText>
                      {printer.isDefault && (
                        <ThemedText style={styles.defaultBadge}>Predeterminada</ThemedText>
                      )}
                    </View>
                    <View style={styles.printerActions}>
                      {!printer.isDefault && (
                        <TouchableOpacity
                          style={styles.printerActionButton}
                          onPress={() => handleSetDefaultPrinter(printer)}
                        >
                          <IconSymbol name="star.fill" size={20} color={LogoColors.yellow} />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.printerActionButton}
                        onPress={() => {
                          setEditingPrinter(printer);
                          setNewPrinterName(printer.name);
                        }}
                      >
                        <IconSymbol name="pencil" size={20} color={LogoColors.info} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.printerActionButton}
                        onPress={() => handleDeletePrinter(printer)}
                      >
                        <IconSymbol name="trash.fill" size={20} color={LogoColors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  modeCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: LogoColors.red,
    minHeight: 100,
  },
  modeCardActive: {
    backgroundColor: LogoColors.red,
    borderColor: LogoColors.red,
  },
  modeTitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: LogoColors.red,
  },
  modeTitleActive: {
    color: LogoColors.white,
  },
  content: {
    paddingHorizontal: 16,
    gap: 16,
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: LogoColors.red,
    borderStyle: 'dashed',
    gap: 8,
  },
  fileButtonText: {
    fontSize: 16,
    color: LogoColors.red,
    fontWeight: '500',
  },
  pageCount: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginTop: -8,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: LogoColors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityInput: {
    width: 80,
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: LogoColors.red,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  colorOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  colorOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#ddd',
    gap: 8,
  },
  colorOptionActive: {
    backgroundColor: LogoColors.red,
    borderColor: LogoColors.red,
  },
  colorOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  colorOptionTextActive: {
    color: LogoColors.white,
  },
  doubleSidedOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: LogoColors.red,
    gap: 8,
  },
  doubleSidedOptionActive: {
    backgroundColor: LogoColors.red,
  },
  doubleSidedText: {
    fontSize: 16,
    fontWeight: '600',
    color: LogoColors.red,
  },
  doubleSidedTextActive: {
    color: LogoColors.white,
  },
  statusText: {
    textAlign: 'center',
    fontSize: 16,
    color: LogoColors.red,
    fontWeight: '600',
  },
  formatOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  formatOption: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  formatOptionActive: {
    backgroundColor: LogoColors.red,
    borderColor: LogoColors.red,
  },
  formatOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  formatOptionTextActive: {
    color: LogoColors.white,
  },
  pdfPagesInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  pdfPagesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  finalizeButton: {
    backgroundColor: LogoColors.yellow,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  finalizeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: LogoColors.red,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LogoColors.red,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginTop: 8,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: LogoColors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalScroll: {
    padding: 16,
  },
  textInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalButton: {
    backgroundColor: LogoColors.red,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: LogoColors.white,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    padding: 20,
  },
  printerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  printerInfo: {
    flex: 1,
    gap: 4,
  },
  printerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  defaultBadge: {
    fontSize: 12,
    color: LogoColors.yellow,
    fontWeight: '600',
  },
  printerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  printerActionButton: {
    padding: 8,
  },
});


