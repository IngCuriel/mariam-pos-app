import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import api from './api/api';
import { LogoColors } from '@/constants/logoColors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Category {
  id: string;
  name: string;
  description: string | null;
  showInPOS: boolean;
  createdAt: string;
}

export default function CategoriesScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setError(null);
      const response = await api.get('/categories/showInPOS');
      setCategories(response.data);
    } catch (err: any) {
      console.error('Error cargando categorías:', err);
      setError(
        err.response?.data?.error || 
        err.message || 
        'Error al cargar las categorías'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCategories();
  };

  const handleCategoryPress = (category: Category) => {
    router.push({
      pathname: '/products' as any,
      params: { categoryId: category.id, categoryName: category.name },
    });
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        isDark && styles.categoryCardDark,
      ]}
      activeOpacity={0.7}
      onPress={() => handleCategoryPress(item)}
    >
      <View style={styles.categoryIconContainer}>
        <View style={[styles.categoryIconCircle, isDark && styles.categoryIconCircleDark]}>
          <IconSymbol
            name="house.fill"
            size={32}
            color={LogoColors.red}
          />
        </View>
      </View>
      <View style={styles.categoryContent}>
        <ThemedText 
          type="subtitle" 
          style={[styles.categoryName, isDark && styles.categoryNameDark]}
        >
          {item.name}
        </ThemedText>
        {item.description && (
          <ThemedText 
            style={[styles.categoryDescription, isDark && styles.categoryDescriptionDark]}
            numberOfLines={2}
          >
            {item.description}
          </ThemedText>
        )}
      </View>
      <View style={styles.categoryArrow}>
        <IconSymbol
          name="chevron.right"
          size={24}
          color={isDark ? '#9BA1A6' : '#687076'}
        />
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <IconSymbol
        name="house.fill"
        size={64}
        color={isDark ? '#9BA1A6' : '#687076'}
      />
      <ThemedText 
        style={[styles.emptyText, isDark && styles.emptyTextDark]}
      >
        No hay categorías disponibles
      </ThemedText>
      <ThemedText 
        style={[styles.emptySubtext, isDark && styles.emptySubtextDark]}
      >
        Las categorías aparecerán aquí cuando estén disponibles
      </ThemedText>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <IconSymbol
        name="paperplane.fill"
        size={64}
        color="#DC2626"
      />
      <ThemedText style={styles.errorText}>
        {error}
      </ThemedText>
      <TouchableOpacity
        style={[styles.retryButton, isDark && styles.retryButtonDark]}
        onPress={loadCategories}
      >
        <ThemedText style={styles.retryButtonText}>
          Reintentar
        </ThemedText>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={LogoColors.red} />
          <ThemedText style={[styles.loadingText, isDark && styles.loadingTextDark]}>
            Cargando categorías...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error && !refreshing) {
    return (
      <ThemedView style={styles.container}>
        {renderError()}
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          categories.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={LogoColors.red}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#687076',
  },
  loadingTextDark: {
    color: '#9BA1A6',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryCardDark: {
    backgroundColor: '#1E1E1E',
  },
  categoryIconContainer: {
    marginRight: 16,
  },
  categoryIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(220, 20, 60, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: LogoColors.yellow,
  },
  categoryIconCircleDark: {
    backgroundColor: 'rgba(220, 20, 60, 0.15)',
    borderColor: LogoColors.yellow,
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#11181C',
  },
  categoryNameDark: {
    color: '#ECEDEE',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#687076',
    lineHeight: 20,
  },
  categoryDescriptionDark: {
    color: '#9BA1A6',
  },
  categoryArrow: {
    marginLeft: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 24,
    color: '#11181C',
  },
  emptyTextDark: {
    color: '#ECEDEE',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    color: '#687076',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  emptySubtextDark: {
    color: '#9BA1A6',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    marginTop: 24,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: LogoColors.red,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonDark: {
    backgroundColor: LogoColors.red,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

