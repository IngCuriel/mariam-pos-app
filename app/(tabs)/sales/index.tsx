import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View, StyleSheet, Modal, TextInput } from "react-native";
import api from "../../api/api.js";
import { IconSymbol } from "@/components/ui/icon-symbol";

// Función para obtener la fecha actual en zona horaria de México
const getTodayDateMexico = () => {
  const now = new Date();
  // Convertir a zona horaria de México
  const mexicoDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
  const year = mexicoDate.getFullYear();
  const month = String(mexicoDate.getMonth() + 1).padStart(2, '0');
  const day = String(mexicoDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function SalesList() {
  const todayDate = getTodayDateMexico();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [startDate, setStartDate] = useState(todayDate);
  const [endDate, setEndDate] = useState(todayDate);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [branches, setBranches] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadBranches();
    loadSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBranches = async () => {
    try {
      const res = await api.get("/sales");
      const uniqueBranches = [...new Set(res.data.map((sale: any) => sale.branch).filter(Boolean))];
      setBranches(uniqueBranches as string[]);
    } catch (err) {
      console.error("Error cargando sucursales:", err);
    }
  };

  const loadSales = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (selectedBranch) params.branch = selectedBranch;
      
      const res = await api.get("/sales", { params });
      setSales(res.data);
    } catch (err) {
      console.error("Error cargando ventas:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    loadSales();
    setShowFilter(false);
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedBranch("");
    loadSales();
    setShowFilter(false);
  };

  const getTodayDate = () => {
    return getTodayDateMexico();
  };

  const getWeekAgoDate = () => {
    const today = new Date();
    const mexicoDate = new Date(today.toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
    mexicoDate.setDate(mexicoDate.getDate() - 7);
    const year = mexicoDate.getFullYear();
    const month = String(mexicoDate.getMonth() + 1).padStart(2, '0');
    const day = String(mexicoDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const setQuickFilter = (days: number) => {
    const today = new Date();
    const mexicoDate = new Date(today.toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
    const end = new Date(mexicoDate);
    const start = new Date(mexicoDate);
    start.setDate(start.getDate() - days);
    
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  };

  const dateFormat = (date:string)=> {
    const fecha = new Date(date);
    // Ejemplo: "28/10/2025 11:19 p.m."
    const fechaFormateada = fecha.toLocaleString("es-MX", {
      timeZone: "America/Mexico_City",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return fechaFormateada;
  }

  if (loading && sales.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const hasActiveFilters = startDate || endDate || selectedBranch;

  return (
    <View style={{ flex: 1, backgroundColor: "#f7f7f7" }}>
      <View style={styles.header}>
        <Text style={styles.title}>📋 Ventas</Text>
        <TouchableOpacity 
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
          onPress={() => setShowFilter(true)}
        >
          <IconSymbol name="slider.horizontal.3" size={20} color={hasActiveFilters ? "#fff" : "#333"} />
          <Text style={[styles.filterButtonText, hasActiveFilters && styles.filterButtonTextActive]}>
            Filtros
          </Text>
        </TouchableOpacity>
      </View>

      {hasActiveFilters && (
        <View style={styles.activeFilters}>
          <Text style={styles.activeFiltersText}>Filtros activos:</Text>
          {startDate && <Text style={styles.filterTag}>Desde: {startDate}</Text>}
          {endDate && <Text style={styles.filterTag}>Hasta: {endDate}</Text>}
          {selectedBranch && <Text style={styles.filterTag}>Sucursal: {selectedBranch}</Text>}
        </View>
      )}

      <FlatList
        data={sales}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        refreshing={loading}
        onRefresh={loadSales}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No se encontraron ventas</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.saleCard}
            onPress={() => router.push(`/sales/${item.id}`)}
          >
            <View style={styles.saleHeader}>
              <Text style={styles.folio}>Folio: {item.folio || "Sin folio"}</Text>
              <Text style={styles.total}>${item.total.toFixed(2)}</Text>
            </View>
            <Text style={styles.saleInfo}>📍 {item.branch || "Sin sucursal"}</Text>
            <Text style={styles.saleInfo}>👤 {item.clientName || "Público general"}</Text>
            <Text style={styles.saleInfo}>💳 {item.paymentMethod || "N/A"}</Text>
            <Text style={styles.saleDate}>{dateFormat(item.createdAt)}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Modal de Filtros */}
      <Modal
        visible={showFilter}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilter(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros de Búsqueda</Text>
              <TouchableOpacity onPress={() => setShowFilter(false)}>
                <IconSymbol name="xmark.circle.fill" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.quickFilters}>
              <Text style={styles.sectionTitle}>Filtros Rápidos:</Text>
              <View style={styles.quickFilterButtons}>
                <TouchableOpacity 
                  style={styles.quickFilterBtn}
                  onPress={() => setQuickFilter(7)}
                >
                  <Text style={styles.quickFilterText}>Últimos 7 días</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickFilterBtn}
                  onPress={() => setQuickFilter(30)}
                >
                  <Text style={styles.quickFilterText}>Últimos 30 días</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickFilterBtn}
                  onPress={() => {
                    const today = getTodayDateMexico();
                    setStartDate(today);
                    setEndDate(today);
                  }}
                >
                  <Text style={styles.quickFilterText}>Hoy</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.label}>Fecha Inicio:</Text>
              <TextInput
                style={styles.input}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.label}>Fecha Fin:</Text>
              <TextInput
                style={styles.input}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.label}>Sucursal:</Text>
              <View style={styles.branchButtons}>
                <TouchableOpacity
                  style={[styles.branchButton, !selectedBranch && styles.branchButtonActive]}
                  onPress={() => setSelectedBranch("")}
                >
                  <Text style={[styles.branchButtonText, !selectedBranch && styles.branchButtonTextActive]}>
                    Todas
                  </Text>
                </TouchableOpacity>
                {branches.map((branch) => (
                  <TouchableOpacity
                    key={branch}
                    style={[styles.branchButton, selectedBranch === branch && styles.branchButtonActive]}
                    onPress={() => setSelectedBranch(branch)}
                  >
                    <Text style={[styles.branchButtonText, selectedBranch === branch && styles.branchButtonTextActive]}>
                      {branch}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                <Text style={styles.applyButtonText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#34ace0',
    borderColor: '#34ace0',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#333',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    backgroundColor: '#e8f4f8',
    gap: 8,
    alignItems: 'center',
  },
  activeFiltersText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  filterTag: {
    fontSize: 12,
    backgroundColor: '#34ace0',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  saleCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  folio: {
    fontWeight: "bold",
    fontSize: 16,
    color: '#333',
  },
  total: {
    fontWeight: "bold",
    fontSize: 18,
    color: '#26de81',
  },
  saleInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  saleDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  quickFilters: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  quickFilterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickFilterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  quickFilterText: {
    fontSize: 14,
    color: '#333',
  },
  filterSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  branchButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  branchButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  branchButtonActive: {
    backgroundColor: '#34ace0',
    borderColor: '#34ace0',
  },
  branchButtonText: {
    fontSize: 14,
    color: '#333',
  },
  branchButtonTextActive: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    color: '#666',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#34ace0',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});