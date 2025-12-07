import { Image } from 'expo-image';
import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import api from '../api/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = 175;
const CARD_GAP = 12;
const CARD_TOTAL_WIDTH = CARD_WIDTH + CARD_GAP;

export default function HomeScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resumenGeneral, setResumenGeneral] = useState({
    ventasHoy: 0,
    montoHoy: 0,
  });
  const [sucursales, setSucursales] = useState<any[]>([]);
  
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Obtener estadísticas del día de hoy
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      const [statsRes, salesRes] = await Promise.all([
        api.get('/sales/stats', {
          params: {
            startDate: todayStr,
            endDate: todayStr,
          },
        }),
        api.get('/sales/stats'),
      ]);
      
      const stats = statsRes.data;
      const allStats = salesRes.data;
      
      // Resumen general del día
      setResumenGeneral({
        ventasHoy: stats.totalSales || 0,
        montoHoy: stats.totalAmount || 0,
      });
      
      // Sucursales con datos del día
      const branchData = stats.byBranch || [];
      setSucursales(branchData.map((item: any) => ({
        nombre: item.branch,
        ventas: item.count,
        monto: item.total,
      })));
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / CARD_TOTAL_WIDTH);
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <ThemedText style={{ marginTop: 12 }}>Cargando datos...</ThemedText>
      </View>
    );
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#34ace0', dark: '#222f3e' }}
      headerImage={
        <IconSymbol
          size={120}
          name="house.fill"
          color="#fff"
          style={{marginTop: 50}}
        />
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <ThemedView style={styles.topSection}>
        <View>
          <ThemedText type="title">¡Bienvenido!</ThemedText>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ThemedText type="subtitle">Ventas Curiel </ThemedText>
            <HelloWave />
          </View>
        </View>
      </ThemedView>

      {/* Card resumen global */}
      <View style={styles.cardsContainer}>
        <View style={styles.generalCard}>
          <IconSymbol name="paperplane.fill" size={38} color="#26de81" />
          <ThemedText type="subtitle">Resumen del Día</ThemedText>
          <ThemedText style={styles.ventasTxt}>{resumenGeneral.ventasHoy} ventas</ThemedText>
          <ThemedText style={{ fontWeight: 'bold', color: '#227093' }}>
            Total: ${resumenGeneral.montoHoy.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </ThemedText>
        </View>
      </View>

      {/* Cards por sucursal */}
      <View style={styles.sucursalesSection}>
        <View style={styles.sucursalesHeader}>
          <ThemedText type="subtitle" style={styles.sucursalesTitle}>
            🏢 Sucursales ({sucursales.length})
          </ThemedText>
          {sucursales.length > 2 && (
            <ThemedText style={styles.swipeHint}>Desliza para ver más →</ThemedText>
          )}
        </View>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          snapToInterval={CARD_TOTAL_WIDTH}
          decelerationRate="fast"
          pagingEnabled={false}
        >
          {sucursales.length > 0 ? (
            sucursales.map((suc, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.cardSucursal}
                onPress={() => navigation.navigate('SucursalDetail', { nombre: suc.nombre })}
              >
                <IconSymbol name="house.fill" size={32} color="#0984e3" />
                <ThemedText type="subtitle">{suc.nombre}</ThemedText>
                <ThemedText style={{fontSize:18, fontWeight:'bold', color:'#218c5c'}}>{suc.ventas} ventas</ThemedText>
                <ThemedText style={{color:'#227093', fontWeight:'bold'}}>
                  Total: ${suc.monto.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </ThemedText>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <ThemedText>No hay ventas registradas hoy</ThemedText>
            </View>
          )}
        </ScrollView>
        {/* Indicadores de paginación */}
        {sucursales.length > 2 && (
          <View style={styles.paginationDots}>
            {sucursales.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  idx === currentIndex && styles.dotActive
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Accesos rápidos */}
      <View style={styles.quickAccessSection}>
        <ThemedText type="subtitle" style={styles.quickAccessTitle}>
          Accesos Rápidos
        </ThemedText>
        <View style={[styles.cardsContainer, { marginTop:12}]}>     
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Sales')}>
            <IconSymbol name="paperplane.fill" size={38} color="#26de81" />
            <ThemedText type="subtitle">Ver ventas</ThemedText>
            <ThemedText>Accede al listado y detalle de ventas.</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Stats')}>
            <IconSymbol name="chevron.left.forwardslash.chevron.right" size={38} color="#fc5c65" />
            <ThemedText type="subtitle">Estadísticas</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.card} onPress={() => router.push('/copies')}>
            <IconSymbol name="printer.fill" size={38} color="#DC143C" />
            <ThemedText type="subtitle">Copias</ThemedText>
            <ThemedText>Imprimir, fotocopiar y escanear documentos.</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  topSection: {
    paddingBottom: 8,
    paddingHorizontal: 24,
    marginTop: 10,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 8,
    gap: 12,
  },
  generalCard: {
    backgroundColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderRadius: 20,
    width: 320,
    padding: 24,
    alignItems: 'center',
    marginBottom: 10,
    marginHorizontal: 4,
  },
  sucursalesSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  sucursalesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sucursalesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  swipeHint: {
    fontSize: 12,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  scrollView: {
    marginTop: 8,
  },
  scrollContent: {
    paddingLeft: 20,
    paddingRight: 20,
    gap: CARD_GAP,
  },
  cardSucursal: {
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.11,
    shadowRadius: 7,
    borderRadius: 16,
    width: CARD_WIDTH,
    padding: 16,
    alignItems: 'center',
    marginVertical: 4,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d0d0d0',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#0984e3',
  },
  card: {
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.11,
    shadowRadius: 7,
    borderRadius: 18,
    width: 155,
    padding: 20,
    alignItems: 'center',
    marginBottom: 10,
    marginHorizontal: 2,
  },
  ventasTxt: {
    fontSize: 30, fontWeight: 'bold', color: '#218c5c', marginVertical: 4
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAccessSection: {
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  quickAccessTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
});
