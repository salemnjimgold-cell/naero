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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme';
import { useApp } from '../context/AppContext';
import { mockCategories } from '../data/providers/mockCategories';
const { categoriesMatch } = require('../services/nearbyClientCore');

const TAB_ICONS = {
  all: 'apps-outline',
  places: 'location-outline',
  services: 'briefcase-outline',
};

function getCategoryColor(categoryId) {
  if (!categoryId) return COLORS.textTertiary;
  const cat = mockCategories.find((c) => c.id === categoryId);
  return cat ? cat.color : COLORS.textTertiary;
}

function getCategoryIcon(categoryId) {
  if (!categoryId) return 'ellipse';
  const cat = mockCategories.find((c) => c.id === categoryId);
  return cat ? cat.icon : 'ellipse';
}

function ResultCard({ item, type, onPress }) {
  const color = type === 'place'
    ? getCategoryColor(item.category)
    : item.category ? getCategoryColor(item.category) : COLORS.primary;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item, type)}
      activeOpacity={0.7}
    >
      <View style={styles.cardRow}>
        <View style={[styles.cardIcon, { backgroundColor: color + '12', borderColor: color + '20' }]}>
          <Ionicons
            name={type === 'place' ? getCategoryIcon(item.category) : (item.icon || 'ellipse')}
            size={20}
            color={color}
          />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardTitleRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.name || ''}</Text>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>
                  {type === 'place' ? 'Place' : 'Service'}
                </Text>
              </View>
            </View>
          </View>
          {item.category && (
            <Text style={styles.cardCategory} numberOfLines={1}>
              {item.category}
            </Text>
          )}
          {item.rating && (
            <View style={styles.cardRating}>
              <Ionicons name="star" size={11} color={COLORS.textTertiary} />
              <Text style={styles.cardRatingText}>{item.rating}</Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
      </View>
    </TouchableOpacity>
  );
}

export default function DiscoverScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const {
    placeService,
    serviceService,
    userLocation,
  } = useApp();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [activeCategory, setActiveCategory] = useState('hospitals');
  const [allPlaces, setAllPlaces] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nearbyError, setNearbyError] = useState(null);
  const [stale, setStale] = useState(false);
  const [attributions, setAttributions] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadData() {
      setLoading(true);
      setNearbyError(null);
      const latitude = userLocation?.latitude;
      const longitude = userLocation?.longitude;
      const servicePromise = serviceService.getAll();
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        setAllPlaces([]);
        setNearbyError({ code: 'LOCATION_REQUIRED', message: 'Choose a device or resolved manual location to find nearby places.' });
      } else {
        const placeRes = await placeService.getNearby(
          latitude, longitude, 10, 20, activeCategory || 'hospital', i18n.language, { signal: controller.signal },
        );
        if (!controller.signal.aborted) {
          setAllPlaces(placeRes.data || []);
          setNearbyError(placeRes.error || null);
          setStale(placeRes.stale);
          setAttributions(placeRes.attribution || []);
        }
      }
      const serviceRes = await servicePromise;
      if (!controller.signal.aborted) {
        if (serviceRes.data) setAllServices(serviceRes.data);
        setLoading(false);
      }
    }
    loadData();
    return () => controller.abort();
  }, [activeCategory, i18n.language, placeService, serviceService, userLocation?.latitude, userLocation?.longitude]);

  const combinedCategories = useMemo(() => {
    if (activeTab === 'places') return mockCategories.filter((c) => c.domain === 'places');
    if (activeTab === 'services') return mockCategories.filter((c) => c.domain === 'services');
    return mockCategories;
  }, [activeTab]);

  const filteredData = useMemo(() => {
    let results = [];

    if (activeTab === 'all' || activeTab === 'places') {
      results = [...results, ...allPlaces.map((p) => ({ ...p, _type: 'place' }))];
    }
    if (activeTab === 'all' || activeTab === 'services') {
      results = [...results, ...allServices.map((s) => ({ ...s, _type: 'service' }))];
    }

    if (activeCategory) {
      results = results.filter((r) => categoriesMatch(r.category, activeCategory));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (r) =>
          (r.name || '').toLowerCase().includes(q) ||
          (r.tags || []).some((tag) => tag.toLowerCase().includes(q)) ||
          (r.description || '').toLowerCase().includes(q),
      );
    }

    return results;
  }, [activeTab, activeCategory, search, allPlaces, allServices]);

  const handleCardPress = useCallback((item, type) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (type === 'place') {
      navigation.navigate('PlaceDetail', { item });
    } else {
      navigation.navigate('ServiceDetail', { item });
    }
  }, [navigation]);

  const handleTabPress = useCallback((tab) => {
    Haptics.selectionAsync().catch(() => {});
    setActiveTab(tab);
    setActiveCategory(tab === 'services' ? null : 'hospitals');
  }, []);

  const handleCategoryPress = useCallback((catId) => {
    Haptics.selectionAsync().catch(() => {});
    setActiveCategory(activeCategory === catId ? null : catId);
  }, [activeCategory]);

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Ionicons name="compass-outline" size={28} color={COLORS.textTertiary} />
        </View>
        <Text style={styles.emptyTitle}>
          {nearbyError ? nearbyError.message : t('discover.noResults')}
        </Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View>
      <View style={[styles.headerArea, { paddingTop: insets.top + SPACING.md }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{t('discover.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('discover.subtitle')}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('discover.searchPlaceholder')}
            placeholderTextColor={COLORS.textTertiary}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={COLORS.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.tabRow}>
        {['all', 'places', 'services'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => handleTabPress(tab)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={TAB_ICONS[tab]}
              size={14}
              color={activeTab === tab ? COLORS.white : COLORS.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {t(`discover.${tab}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScroll}
      >
        {combinedCategories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryPill, isActive && { backgroundColor: cat.color, borderColor: cat.color }]}
              onPress={() => handleCategoryPress(cat.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={cat.icon}
                size={13}
                color={isActive ? COLORS.white : cat.color}
              />
              <Text style={[styles.categoryPillText, isActive && { color: COLORS.white }]}>
                {t(`categories.${cat.id}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {stale && <Text style={styles.providerNotice}>Showing cached nearby results while providers recover.</Text>}
      {attributions.length > 0 && <Text style={styles.attribution}>{attributions.join(' · ')}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredData}
        keyExtractor={(item) => `${item._type || 'unknown'}-${item.id || Math.random()}`}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        renderItem={({ item }) => (
          <ResultCard
            item={item}
            type={item._type}
            onPress={handleCardPress}
          />
        )}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  headerArea: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 42,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  searchInput: {
    flex: 1,
    ...FONTS.body,
    fontSize: 14,
    color: COLORS.textPrimary,
    padding: 0,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm - 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    ...FONTS.smallBold,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  categoriesScroll: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.md - 2,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  categoryPillText: {
    ...FONTS.small,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  providerNotice: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xs,
    ...FONTS.small,
    color: COLORS.textSecondary,
  },
  attribution: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    ...FONTS.small,
    color: COLORS.textTertiary,
  },
  card: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.md,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  cardContent: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    ...FONTS.bodyBold,
    color: COLORS.textPrimary,
  },
  typeBadge: {
    backgroundColor: COLORS.cardBorder,
    borderRadius: RADIUS.sm - 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cardCategory: {
    ...FONTS.small,
    color: COLORS.textTertiary,
    marginTop: 1,
    textTransform: 'capitalize',
  },
  cardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  cardRatingText: {
    ...FONTS.small,
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  centerLoader: {
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: SPACING.xl,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    ...FONTS.body,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
});
