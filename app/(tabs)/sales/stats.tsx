import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, TextInput, Dimensions } from "react-native";
import api from "../../api/api.js";
import { IconSymbol } from "@/components/ui/icon-symbol";

// Removed unused SCREEN_WIDTH

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

interface StatsData {
  totalSales: number;
  totalAmount: number;
  averageSale: number;
  byBranch: { branch: string; count: number; total: number }[];
  byPaymentMethod: { paymentMethod: string; count: number; total: number }[];
  byDay: { date: string; count: number; total: number }[];
}

export default function Stats() {
  const todayDate = getTodayDateMexico();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [startDate, setStartDate] = useState(todayDate);
  const [endDate, setEndDate] = useState(todayDate);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [branches, setBranches] = useState<string[]>([]);

  useEffect(() => {
    loadStats();
    loadBranches();
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

  const loadStats = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (selectedBranch) params.branch = selectedBranch;

      const res = await api.get("/sales/stats", { params });
      setStats(res.data);
    } catch (err) {
      console.error("Error cargando estadísticas:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    loadStats();
    setShowFilter(false);
  };

  const clearFilters = () => {
    const today = getTodayDateMexico();
    setStartDate(today);
    setEndDate(today);
    setSelectedBranch("");
    loadStats();
    setShowFilter(false);
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

  // getTodayDate removed - using getTodayDateMexico directly

  // Función para calcular el porcentaje y ancho de barra
  const getBarWidth = (value: number, maxValue: number) => {
    if (maxValue === 0) return 0;
    return (value / maxValue) * 100;
  };

  // Función para obtener el color según el índice
  const getColor = (index: number) => {
    const colors = ["#26de81", "#34ace0", "#fc5c65", "#feca57", "#48dbfb", "#ff9ff3", "#a55eea"];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Cargando estadísticas...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>No se pudieron cargar las estadísticas</Text>
      </View>
    );
  }

  const hasActiveFilters = startDate || endDate || selectedBranch;

  // Calcular valores máximos para las barras
  const maxBranchTotal = stats.byBranch.length > 0 
    ? Math.max(...stats.byBranch.map(b => b.total)) 
    : 0;
  const maxPaymentTotal = stats.byPaymentMethod.length > 0
    ? Math.max(...stats.byPaymentMethod.map(p => p.total))
    : 0;
  const maxDailyTotal = stats.byDay.length > 0
    ? Math.max(...stats.byDay.map(d => d.total))
    : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Reportes y Estadísticas</Text>
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

      {/* Resumen General */}
      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Resumen General</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <IconSymbol name="number.circle.fill" size={32} color="#26de81" />
            <Text style={styles.summaryValue}>{stats.totalSales}</Text>
            <Text style={styles.summaryLabel}>Total Ventas</Text>
          </View>
          <View style={styles.summaryItem}>
            <IconSymbol name="dollarsign.circle.fill" size={32} color="#34ace0" />
            <Text style={styles.summaryValue}>
              ${stats.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={styles.summaryLabel}>Monto Total</Text>
          </View>
          <View style={styles.summaryItem}>
            <IconSymbol name="chart.bar.fill" size={32} color="#fc5c65" />
            <Text style={styles.summaryValue}>
              ${stats.averageSale.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={styles.summaryLabel}>Promedio</Text>
          </View>
        </View>
      </View>

      {/* Gráfico de Ventas por Día */}
      {stats.byDay.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Ventas por Día (Últimos 7 días)</Text>
          <View style={styles.barChartContainer}>
            {stats.byDay.slice(0, 7).reverse().map((item, index) => {
              const date = new Date(item.date);
              const dayLabel = date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
              const barWidth = getBarWidth(item.total, maxDailyTotal);
              
              return (
                <View key={index} style={styles.barChartItem}>
                  <View style={styles.barChartLabels}>
                    <Text style={styles.barChartLabel}>{dayLabel}</Text>
                    <Text style={styles.barChartValue}>${item.total.toFixed(0)}</Text>
                  </View>
                  <View style={styles.barContainer}>
                    <View 
                      style={[
                        styles.bar, 
                        { 
                          width: `${barWidth}%`,
                          backgroundColor: '#34ace0'
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.barChartCount}>{item.count} ventas</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Ventas por Sucursal */}
      {stats.byBranch.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Ventas por Sucursal</Text>
          <View style={styles.listContainer}>
            {stats.byBranch.map((item, index) => {
              const barWidth = getBarWidth(item.total, maxBranchTotal);
              const color = getColor(index);
              
              return (
                <View key={index} style={styles.listItem}>
                  <View style={styles.listItemHeader}>
                    <View style={styles.listItemLeft}>
                      <View style={[styles.colorDot, { backgroundColor: color }]} />
                      <Text style={styles.listItemText}>{item.branch || 'Sin sucursal'}</Text>
                    </View>
                    <View style={styles.listItemRight}>
                      <Text style={styles.listItemValue}>{item.count} ventas</Text>
                      <Text style={styles.listItemAmount}>
                        ${item.total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.barContainer}>
                    <View 
                      style={[
                        styles.bar, 
                        { 
                          width: `${barWidth}%`,
                          backgroundColor: color
                        }
                      ]} 
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Ventas por Método de Pago */}
      {stats.byPaymentMethod.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Ventas por Método de Pago</Text>
          <View style={styles.listContainer}>
            {stats.byPaymentMethod.map((item, index) => {
              const barWidth = getBarWidth(item.total, maxPaymentTotal);
              
              return (
                <View key={index} style={styles.listItem}>
                  <View style={styles.listItemHeader}>
                    <View style={styles.listItemLeft}>
                      <IconSymbol name="creditcard.fill" size={20} color="#666" />
                      <Text style={styles.listItemText}>{item.paymentMethod || 'Sin método'}</Text>
                    </View>
                    <View style={styles.listItemRight}>
                      <Text style={styles.listItemValue}>{item.count} ventas</Text>
                      <Text style={styles.listItemAmount}>
                        ${item.total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.barContainer}>
                    <View 
                      style={[
                        styles.bar, 
                        { 
                          width: `${barWidth}%`,
                          backgroundColor: '#26de81'
                        }
                      ]} 
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

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
              <Text style={styles.modalTitle}>Filtros</Text>
              <TouchableOpacity onPress={() => setShowFilter(false)}>
                <IconSymbol name="xmark.circle.fill" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.quickFilters}>
              <Text style={styles.label}>Filtros Rápidos:</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#fc5c65',
  },
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
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  barChartContainer: {
    marginTop: 10,
  },
  barChartItem: {
    marginBottom: 16,
  },
  barChartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  barChartLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  barChartValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
  },
  barChartCount: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  barContainer: {
    height: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  bar: {
    height: '100%',
    borderRadius: 12,
    minWidth: 4,
  },
  listContainer: {
    marginTop: 16,
  },
  listItem: {
    marginBottom: 16,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  listItemText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    fontWeight: '600',
  },
  listItemRight: {
    alignItems: 'flex-end',
  },
  listItemValue: {
    fontSize: 12,
    color: '#666',
  },
  listItemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#26de81',
    marginTop: 2,
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
  quickFilterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
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
