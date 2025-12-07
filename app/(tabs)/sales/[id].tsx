import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import api from "../../api/api.js";

export default function SaleDetail() {
  const { id } = useLocalSearchParams();
  const [sale, setSale] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSale();
  }, []);

  const loadSale = async () => {
    try {
      const res = await api.get(`/sales/${id}`);
      setSale(res.data);
    } catch (err) {
      console.error("Error al obtener venta:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>🧾 Detalle de Venta</Text>
      <Text style={{ marginTop: 10 }}>Cliente: {sale.clientName}</Text>
      <Text>Folio: {sale.folio}</Text>
      <Text>Total: ${sale.total.toFixed(2)}</Text>

      <Text style={{ marginTop: 20, fontWeight: "bold", fontSize: 18 }}>Productos:</Text>

      <FlatList
        data={sale.details}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: "#eee" }}>
            <Text>{item.productName}</Text>
            <Text>Cantidad: {item.quantity}</Text>
            <Text>Precio: ${item.price.toFixed(2)}</Text>
            <Text>Subtotal: ${item.subTotal.toFixed(2)}</Text>
          </View>
        )}
      />
    </View>
  );
}