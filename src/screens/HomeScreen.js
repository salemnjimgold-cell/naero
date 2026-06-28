import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { useApp } from '../context/AppContext';
import { exploreCategories } from '../data/categories';
import { CategoryGrid } from '../components/CategoryGrid';
import { SectionHeader } from '../components/SectionHeader';
import { PlaceCard, CommunityCard } from '../components/ListingCard';
import { AIFloatingButton } from '../components/AIFloatingButton';
import { LoadingState } from '../components/LoadingState';

const LOGO = require('../../assets/branding/naero-logo.png');
const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { favorites, toggleFavorite, toggleSavedPlace, userLocation, userCity, locationPermissionStatus, requestLocationPermission, locationLoading, placeService, communityService, dataLoading } = useApp();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [featuredPlaces, setFeaturedPlaces] = useState([]);
  const [latestPosts, setLatestPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [placesRes, postsRes] = await Promise.all([
      placeService.getAll(),
      communityService.getPosts({ limit: 3 }),
    ]);
    if (placesRes.data) setFeaturedPlaces(placesRes.data.slice(0, 6));
    if (postsRes.data) setLatestPosts(postsRes.data);
    setLoading(false);
  }

  const handleCategoryPress = useCallback((cat) => {
    navigation.navigate(cat.screen || 'Explore');
  }, [navigation]);

  const handlePlacePress = useCallback((item) => {
    navigation.navigate('PlaceDetail', { item });
  }, [navigation]);

  const handlePostPress = useCallback((item) => {
    navigation.navigate('CommunityDetail', { item });
  }, [navigation]);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 180],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.headerFade, { opacity: headerOpacity, paddingTop: insets.top + SPACING.lg }]}>
        <View style={styles.headerFadeRow}>
          <View style={styles.headerFadeLogo}>
            <Image source={LOGO} style={{ width: 28, height: 28 }} resizeMode="contain" />
            <Text style={styles.headerFadeTitle}>Naero</Text>
          </View>
          <TouchableOpacity
            style={styles.profileCircle}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <AnimatedScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        <LinearGradient
          colors={['rgba(6,182,212,0.08)', COLORS.bg]}
          style={[styles.heroSection, { paddingTop: insets.top + SPACING.xxl }]}
        >
          <View style={styles.heroRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroGreeting}>{t('home.greeting')}</Text>
              <Text style={styles.heroTitle}>{t('home.subtitle')}</Text>
            </View>
            <View style={styles.heroLogoWrap}>
              <Image source={LOGO} style={styles.heroLogo} resizeMode="contain" />
            </View>
          </View>

          <View style={styles.quickGrid}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => navigation.navigate('AI')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={GRADIENTS.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickCardGrad}
              >
                <Ionicons name="sparkles" size={22} color={COLORS.white} />
                <Text style={styles.quickCardLabel}>{t('home.aiAssistant')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickCard, styles.quickCardSecondary]}
              onPress={() => navigation.navigate('Safety')}
              activeOpacity={0.7}
            >
              <Ionicons name="shield-checkmark" size={22} color={COLORS.primary} />
              <Text style={[styles.quickCardLabel, { color: COLORS.textPrimary }]}>
                {t('home.safetyTips')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickCard, styles.quickCardSecondary]}
              onPress={() => navigation.navigate('Jobs')}
              activeOpacity={0.7}
            >
              <Ionicons name="briefcase" size={22} color={COLORS.secondary} />
              <Text style={[styles.quickCardLabel, { color: COLORS.textPrimary }]}>
                {t('home.jobs')}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {locationPermissionStatus === 'granted' && userCity ? (
          <View style={styles.locationBanner}>
            <Ionicons name="location" size={16} color={COLORS.primary} />
            <Text style={styles.locationText}>{userCity}</Text>
            <View style={styles.locationDotActive} />
            <Text style={styles.locationStatus}>Live</Text>
          </View>
        ) : locationPermissionStatus === 'denied' || locationPermissionStatus === 'undetermined' ? (
          <TouchableOpacity
            style={styles.locationPrompt}
            onPress={() => {
              if (locationPermissionStatus === 'denied') {
                navigation.navigate('Profile');
              } else {
                requestLocationPermission();
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.locationPromptIcon}>
              <Ionicons name="location-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.locationPromptTitle}>Enable location for nearby help</Text>
              <Text style={styles.locationPromptSub}>Discover services, places, and community near you</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
        ) : locationLoading ? (
          <View style={styles.locationBanner}>
            <Ionicons name="location-outline" size={16} color={COLORS.textTertiary} />
            <Text style={[styles.locationText, { color: COLORS.textTertiary }]}>Detecting location...</Text>
          </View>
        ) : null}

        <SectionHeader
          title={t('home.exploreCategories')}
          actionLabel={t('home.seeAll')}
          icon="grid-outline"
          onAction={() => navigation.navigate('Explore')}
        />
        <View style={styles.categorySection}>
          <CategoryGrid
            categories={exploreCategories.slice(0, 10)}
            onPress={handleCategoryPress}
            columns={5}
          />
        </View>

        <SectionHeader
          title={t('home.featuredPlaces')}
          actionLabel={t('home.seeAll')}
          icon="compass-outline"
          onAction={() => navigation.navigate('Explore')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.placesScroll}
        >
          {featuredPlaces.map((place) => (
            <View key={place.id} style={{ width: 220, marginRight: SPACING.md }}>
              <PlaceCard
                item={place}
                onPress={handlePlacePress}
                onFavorite={toggleFavorite}
                isFavorite={favorites.includes(place.id)}
              />
            </View>
          ))}
        </ScrollView>

        <SectionHeader
          title={t('home.latestCommunity')}
          actionLabel={t('home.seeAll')}
          icon="chatbubbles-outline"
          onAction={() => navigation.navigate('Community')}
        />
        <View style={styles.communitySection}>
          {latestPosts.map((post) => (
            <CommunityCard key={post.id} item={post} onPress={handlePostPress} />
          ))}
        </View>
      </AnimatedScrollView>

      <AIFloatingButton onPress={() => navigation.navigate('AI')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  headerFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: COLORS.bg + 'E0',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  headerFadeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerFadeLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerFadeTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  heroSection: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  heroGreeting: {
    fontSize: 28,
    marginBottom: 4,
    color: COLORS.textPrimary,
  },
  heroTitle: {
    ...FONTS.h0,
    color: COLORS.textPrimary,
  },
  heroLogoWrap: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
    ...SHADOWS.glow,
  },
  heroLogo: {
    width: 60,
    height: 60,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  quickCard: {
    flex: 1,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  quickCardGrad: {
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: 80,
    justifyContent: 'center',
  },
  quickCardSecondary: {
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  quickCardLabel: {
    ...FONTS.captionBold,
    color: COLORS.white,
    textAlign: 'center',
  },
  categorySection: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  placesScroll: {
    paddingLeft: SPACING.xl,
    paddingRight: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  communitySection: {
    paddingHorizontal: SPACING.xl,
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.primary + '0A',
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    gap: SPACING.sm,
  },
  locationText: {
    ...FONTS.captionBold,
    color: COLORS.textPrimary,
  },
  locationDotActive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  locationStatus: {
    ...FONTS.small,
    color: COLORS.success,
  },
  locationPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.primary + '25',
    gap: SPACING.md,
  },
  locationPromptIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationPromptTitle: {
    ...FONTS.bodyBold,
    color: COLORS.textPrimary,
  },
  locationPromptSub: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
