import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme';
import { useApp } from '../context/AppContext';
import { mockCategories } from '../data/providers/mockCategories';
import { PlaceCard } from '../components/ListingCard';
import { EmptyState } from '../components/EmptyState';

export default function ExploreScreen({ navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { favorites, toggleFavorite, toggleSavedPlace, userLocation, hasLocationPermission, placeService } = useApp();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [showNearby, setShowNearby] = useState(false);
  const [allPlaces, setAllPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlaces();
  }, []);

  async function loadPlaces() {
    setLoading(true);
    const result = await placeService.getAll();
    if (result.data) setAllPlaces(result.data);
    setLoading(false);
  }

  const filteredPlaces = useMemo(() => {
    let result = allPlaces;
    if (activeCategory) {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.tags || []).some((t) => t.includes(q)) ||
          p.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeCategory, search, allPlaces]);

  const nearbyPlaces = useMemo(() => {
    if (!hasLocationPermission || !userLocation) return [];
    const sorted = [...allPlaces].sort((a, b) => {
      if (!a.latitude || !b.latitude) return 0;
      const dA = Math.abs(a.latitude - userLocation.latitude) + Math.abs(a.longitude - userLocation.longitude);
      const dB = Math.abs(b.latitude - userLocation.latitude) + Math.abs(b.longitude - userLocation.longitude);
      return dA - dB;
    });
    return sorted.slice(0, 4);
  }, [hasLocationPermission, userLocation, allPlaces]);

  const handleCategoryPress = useCallback((cat) => {
    setActiveCategory(activeCategory === cat.id ? null : cat.id);
  }, [activeCategory]);

  const handlePlacePress = useCallback((item) => {
    navigation.navigate('PlaceDetail', { item });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(6,182,212,0.06)', COLORS.bg]}
        style={[styles.header, { paddingTop: insets.top + SPACING.md }]}
      >
        <Text style={styles.title}>{t('explore.title')}</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('explore.searchPlaceholder')}
            placeholderTextColor={COLORS.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <FlatList
        data={filteredPlaces}
        keyExtractor={(item) => item.id}
        numColumns={2}
        ListHeaderComponent={
          <>
            {hasLocationPermission && nearbyPlaces.length > 0 && (
              <TouchableOpacity
                style={[styles.nearbyToggle, showNearby && styles.nearbyToggleActive]}
                onPress={() => setShowNearby(!showNearby)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showNearby ? 'location' : 'location-outline'}
                  size={18}
                  color={showNearby ? COLORS.white : COLORS.primary}
                />
                <Text style={[styles.nearbyToggleText, showNearby && styles.nearbyToggleTextActive]}>
                  {showNearby ? 'Showing nearby places' : 'Show places near me'}
                </Text>
                <Ionicons
                  name={showNearby ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={showNearby ? COLORS.white : COLORS.textTertiary}
                />
              </TouchableOpacity>
            )}
            {showNearby && nearbyPlaces.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.nearbyScroll}
              >
                {nearbyPlaces.map((place) => (
                  <TouchableOpacity
                    key={place.id}
                    style={styles.nearbyChip}
                    onPress={() => handlePlacePress(place)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="location" size={14} color={COLORS.primary} />
                    <Text style={styles.nearbyChipText}>{place.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {mockCategories.filter((c) => c.domain === 'places').map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    activeCategory === cat.id && styles.categoryChipActive,
                  ]}
                  onPress={() => handleCategoryPress(cat)}
                >
                  <Ionicons
                    name={cat.icon}
                    size={15}
                    color={activeCategory === cat.id ? COLORS.white : cat.color}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      activeCategory === cat.id && styles.categoryChipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {t(`categories.${cat.id}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ paddingTop: 60, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <EmptyState message={t('explore.noResults')} mascotSize={72} />
          )
        }
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <PlaceCard
              item={item}
              onPress={handlePlacePress}
              onFavorite={toggleFavorite}
              isFavorite={favorites.includes(item.id)}
            />
          </View>
        )}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 100 },
          filteredPlaces.length === 0 && styles.listEmpty,
        ]}
        columnWrapperStyle={filteredPlaces.length > 0 ? styles.row : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    height: 46,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  searchInput: {
    flex: 1,
    ...FONTS.body,
    color: COLORS.textPrimary,
    padding: 0,
  },
  categoriesScroll: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
  categoryChipTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: SPACING.xl,
  },
  listEmpty: {
    flex: 1,
  },
  row: {
    gap: SPACING.md,
  },
  gridItem: {
    flex: 1,
    maxWidth: '50%',
  },
  nearbyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginLeft: SPACING.xl,
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary + '12',
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
    gap: SPACING.sm,
  },
  nearbyToggleActive: {
    backgroundColor: COLORS.primary,
  },
  nearbyToggleText: {
    ...FONTS.captionBold,
    color: COLORS.primary,
  },
  nearbyToggleTextActive: {
    color: COLORS.white,
  },
  nearbyScroll: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  nearbyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  nearbyChipText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
});
