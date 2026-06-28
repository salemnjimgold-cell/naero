import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Image,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { mockCategories } from '../data/providers/mockCategories';
import { EmptyState } from '../components/EmptyState';
import { useApp } from '../context/AppContext';

const LOGO = require('../../assets/branding/naero-logo.png');
const { width } = Dimensions.get('window');
const CARD_W = (width - SPACING.xl * 2 - SPACING.md) / 2;

const palette = [
  { bg: '#06B6D412', icon: '#06B6D4', border: '#06B6D425', grad: ['#06B6D420', '#06B6D406'] },
  { bg: '#10B98112', icon: '#10B981', border: '#10B98125', grad: ['#10B98120', '#10B98106'] },
  { bg: '#8B5CF612', icon: '#8B5CF6', border: '#8B5CF625', grad: ['#8B5CF620', '#8B5CF606'] },
  { bg: '#F59E0B12', icon: '#F59E0B', border: '#F59E0B25', grad: ['#F59E0B20', '#F59E0B06'] },
  { bg: '#EF444412', icon: '#EF4444', border: '#EF444425', grad: ['#EF444420', '#EF444406'] },
  { bg: '#3B82F612', icon: '#3B82F6', border: '#3B82F625', grad: ['#3B82F620', '#3B82F606'] },
];

function ServiceCard({ item, onPress, index }) {
  const colors = palette[index % palette.length];
  const scaleAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
      delay: index * 50,
    }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.serviceCard}
        onPress={() => onPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.serviceIconWrap, { backgroundColor: colors.bg, borderColor: colors.border }]}>
          <Ionicons name={item.icon || 'ellipse'} size={24} color={colors.icon} />
        </View>
        <Text style={styles.serviceName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.serviceMeta}>
          <View style={[styles.serviceBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.serviceBadgeText, { color: colors.icon }]}>{item.category}</Text>
          </View>
        </View>
        <View style={[styles.servicePriceTag, { backgroundColor: colors.bg }]}>
          <Text style={[styles.servicePriceText, { color: colors.icon }]}>{item.price}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const NEARBY_SERVICE_CATEGORIES = ['healthcare', 'transport', 'legal', 'translation', 'banking', 'food', 'housing', 'education'];

export default function ServicesScreen({ navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { hasLocationPermission, userCity, serviceService } = useApp();
  const [activeCategory, setActiveCategory] = useState(null);
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    setLoading(true);
    const result = await serviceService.getAll();
    if (result.data) setAllServices(result.data);
    setLoading(false);
  }

  const filteredServices = useMemo(() => {
    if (!activeCategory) return allServices;
    return allServices.filter((s) => s.category === activeCategory);
  }, [activeCategory, allServices]);

  const nearbyServices = useMemo(() => {
    if (!hasLocationPermission) return [];
    return allServices.filter((s) =>
      NEARBY_SERVICE_CATEGORIES.includes(s.category)
    ).slice(0, 6);
  }, [hasLocationPermission, allServices]);

  const handleServicePress = useCallback((item) => {
    navigation.navigate('ServiceDetail', { item });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(6,182,212,0.06)', COLORS.bg]}
        style={[styles.header, { paddingTop: insets.top + SPACING.md }]}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t('services.title')}</Text>
            <Text style={styles.subtitle}>{t('services.subtitle')}</Text>
          </View>
          <View style={styles.headerLogoWrap}>
            <Image source={LOGO} style={{ width: 36, height: 36 }} resizeMode="contain" />
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={filteredServices}
        keyExtractor={(item) => item.id}
        numColumns={2}
        ListHeaderComponent={
          <>
            {hasLocationPermission && nearbyServices.length > 0 && (
              <View style={styles.nearbySection}>
                <View style={styles.nearbySectionHeader}>
                  <Ionicons name="location" size={16} color={COLORS.primary} />
                  <Text style={styles.nearbySectionTitle}>
                    Nearby Services{userCity ? ` in ${userCity}` : ''}
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.nearbyScroll}
                >
                  {nearbyServices.map((svc) => (
                    <TouchableOpacity
                      key={svc.id}
                      style={styles.nearbyCard}
                      onPress={() => handleServicePress(svc)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="location" size={14} color={COLORS.primary} />
                      <Text style={styles.nearbyCardTitle} numberOfLines={1}>{svc.name}</Text>
                      <Text style={styles.nearbyCardCategory}>{svc.category}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
            overScrollMode="never"
          >
            <TouchableOpacity
              style={[styles.categoryChip, !activeCategory && styles.categoryChipActive]}
              onPress={() => setActiveCategory(null)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={!activeCategory ? ['#06B6D4', '#0891B2'] : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.categoryChipGrad}
              >
                <Ionicons name="grid-outline" size={15} color={!activeCategory ? COLORS.white : COLORS.textSecondary} />
                <Text style={[styles.categoryChipText, !activeCategory && styles.categoryChipTextActive]}>
                  {t('services.all')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            {mockCategories.filter((c) => c.domain === 'services').map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  activeCategory === cat.id && styles.categoryChipActive,
                ]}
                onPress={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={activeCategory === cat.id ? ['#06B6D4', '#0891B2'] : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.05)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.categoryChipGrad}
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
                  >
                    {t(`services.categories.${cat.id}`)}
                  </Text>
                </LinearGradient>
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
            <EmptyState mascotSize={72} />
          )
        }
        renderItem={({ item, index }) => (
          <View style={styles.gridItem}>
            <ServiceCard item={item} onPress={handleServicePress} index={index} />
          </View>
        )}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 100 },
          filteredServices.length === 0 && styles.listEmpty,
        ]}
        columnWrapperStyle={filteredServices.length > 0 ? styles.row : undefined}
        showsVerticalScrollIndicator={false}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  headerLogoWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary + '30',
  },
  title: {
    ...FONTS.h1,
    color: COLORS.textPrimary,
    fontSize: 26,
  },
  subtitle: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  categoriesScroll: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  categoryChip: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  categoryChipGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  },
  categoryChipActive: {
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    ...FONTS.captionBold,
    color: COLORS.textSecondary,
  },
  categoryChipTextActive: {
    color: COLORS.white,
  },
  list: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
  },
  listEmpty: {
    flex: 1,
  },
  row: {
    gap: SPACING.md,
  },
  gridItem: {
    width: CARD_W,
    marginBottom: SPACING.md,
  },
  serviceCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.small,
  },
  serviceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  serviceName: {
    ...FONTS.bodyBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  serviceBadgeText: {
    ...FONTS.smallBold,
    textTransform: 'capitalize',
  },
  servicePriceTag: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  servicePriceText: {
    ...FONTS.smallBold,
  },
  nearbySection: {
    paddingTop: SPACING.sm,
  },
  nearbySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  nearbySectionTitle: {
    ...FONTS.captionBold,
    color: COLORS.textPrimary,
  },
  nearbyScroll: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  nearbyCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
    minWidth: 140,
    maxWidth: 180,
  },
  nearbyCardTitle: {
    ...FONTS.captionBold,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  nearbyCardCategory: {
    ...FONTS.small,
    color: COLORS.textTertiary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
});
