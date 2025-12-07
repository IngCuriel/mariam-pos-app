import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

const dataMock = {
  Central: [
    { tipo: 'Efectivo', ventas: 16, monto: 7250, icon: '💵', color: '#dff8e5' },
    { tipo: 'Tarjeta', ventas: 9, monto: 4420, icon: '💳', color: '#eaf2ff' },
  ],
  Norte: [
    { tipo: 'Efectivo', ventas: 5, monto: 1500, icon: '💵', color: '#dff8e5' },
    { tipo: 'Tarjeta', ventas: 6, monto: 2250, icon: '💳', color: '#eaf2ff' },
  ],
  Sur: [
    { tipo: 'Efectivo', ventas: 11, monto: 4175, icon: '💵', color: '#dff8e5' },
    { tipo: 'Tarjeta', ventas: 14, monto: 5980, icon: '💳', color: '#eaf2ff' },
  ],
  Este: [
    { tipo: 'Efectivo', ventas: 3, monto: 550, icon: '💵', color: '#dff8e5' },
    { tipo: 'Tarjeta', ventas: 8, monto: 2980, icon: '💳', color: '#eaf2ff' },
  ],
};

function getTotal(detalle) {
  let ventas = 0, monto = 0;
  detalle.forEach((x) => {
    ventas += x.ventas;
    monto += x.monto;
  });
  return { ventas, monto };
}

export default function SucursalDetail() {
  const router = useRouter();
  const { nombre } = useLocalSearchParams();
  const detalle = dataMock[nombre as keyof typeof dataMock] || [];
  const total = getTotal(detalle);
  console.log('Sucursal seleccionada:', nombre, 'Detalle:', detalle);

  return (
    <ThemedView style={styles.container}>
      {/* Indicación clara de nombre y datos recibidos */}
      <View style={{marginBottom:16, alignItems:'center'}}>
        <ThemedText style={{fontSize:28, color:'#576574', fontWeight:'bold'}}>DEBUG</ThemedText>
        <ThemedText style={{fontSize:16, color:'#00b894'}}>Sucursal: {String(nombre)}</ThemedText>
        <ThemedText style={{fontSize:14, color:'#636e72'}}>Métodos encontrados: {detalle.length}</ThemedText>
      </View>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.right" size={26} color="#0984e3" style={{transform:[{rotate:'180deg'}]}} />
        </TouchableOpacity>
        <ThemedText type="title">{nombre}</ThemedText>
      </View>
      <View style={styles.resumenCard}>
        <ThemedText style={{fontSize:22, fontWeight:'bold'}}>Resumen</ThemedText>
        <ThemedText>Total ventas: <ThemedText style={{fontWeight:'bold'}}>{total.ventas}</ThemedText></ThemedText>
        <ThemedText>Monto total: <ThemedText style={{fontWeight:'bold', color:'#218c5c'}}>${total.monto.toLocaleString()}</ThemedText></ThemedText>
      </View>
      <ThemedText type="subtitle" style={{marginVertical:12}}>🧾Ventas por tipo de pago</ThemedText>
      <View style={{gap:18, marginTop:8, width:'100%', marginBottom:10}}>
        {detalle.map((item, idx) => (
          <View key={idx} style={[styles.card, { backgroundColor: item.color }]}> 
            <View style={{ flexDirection: 'row', alignItems:'center', gap:12 }}>
              <ThemedText style={{fontSize:28}}>{item.icon}</ThemedText>
              <ThemedText type="subtitle">{item.tipo}</ThemedText>
            </View>
            <ThemedText style={{fontSize:18,marginTop:4}}>Ventas: <ThemedText style={{fontWeight:'bold'}}>{item.ventas}</ThemedText></ThemedText>
            <ThemedText style={{fontSize:18}}>Monto: <ThemedText style={{fontWeight:'bold'}}>${item.monto.toLocaleString()}</ThemedText></ThemedText>
          </View>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    padding: 20,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
    gap: 16,
  },
  backBtn: {
    padding: 6,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#ecf0f1',
  },
  resumenCard: {
    backgroundColor: '#e1e9f7',
    borderRadius: 18,
    padding: 16,
    minWidth: 240,
    marginBottom: 10,
    alignItems:'center',
    elevation: 3,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'flex-start',
    elevation: 2,
    shadowColor: '#999',
    shadowOpacity: 0.09,
    shadowRadius: 5,
    marginBottom: 0,
  }
});
