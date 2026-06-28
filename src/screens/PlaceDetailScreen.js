import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS } from '../theme';
import { useApp } from '../context/AppContext';

export default function PlaceDetailScreen({ route, navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { item } = route.params;
  const { favorites, toggleFavorite } = useApp();
  const isFavorite = favorites.includes(item.id);

  const handleCall = () => {
    if (item.phone) {
      Linking.openURL(`tel:${item.phone.replace(/[^+\d]/g, '')}`);
    }
  };

  const handleDirections = () => {
    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(item.address)}`);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.imageSection, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[COLORS.primary + '40', COLORS.primary + '10', COLORS.bg]}
          locations={[0, 0.5, 1]}
          style={styles.imagePlaceholder}
        >
          <View style={styles.imageContent}>
            <Ionicons name="image-outline" size={48} color="rgba(255,255,255,0.5)" />
            <Text style={styles.imageHint}>No image available</Text>
          </View>
        </LinearGradient>
        <View style={[styles.imageOverlay, { paddingTop: insets.top + SPACING.md }]}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => navigation.canGoBack() && navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.circleBtn, isFavorite && { backgroundColor: COLORS.error + '40' }]}
            onPress={() => toggleFavorite(item.id)}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={COLORS.white}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.gradientOverlay}>
          <LinearGradient
            colors={['transparent', COLORS.bg]}
            style={StyleSheet.absoluteFill}
          />
        </View>
        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeText}>{item.priceLevel}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        <View style={styles.contentSection}>
          <Text style={styles.title}>{item.name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color={COLORS.warning} />
            <Text style={styles.ratingText}>{item.rating}</Text>
            <Text style={styles.reviewText}>({item.reviews} {t('places.reviews')})</Text>
          </View>
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={16} color={COLORS.primary} />
            <Text style={styles.addressText}>{item.address}</Text>
          </View>
          <View style={styles.tagRow}>
            {item.tags?.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('places.description')}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>

        {item.hours && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('places.hours')}</Text>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={18} color={COLORS.primary} />
              <Text style={styles.infoText}>{item.hours}</Text>
            </View>
          </View>
        )}

        {item.phone && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('places.contact')}</Text>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={18} color={COLORS.primary} />
              <Text style={styles.infoText}>{item.phone}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.actionBar, { paddingBottom: insets.bottom + SPACING.xl }]}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
          <LinearGradient colors={GRADIENTS.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionGradient}>
            <Ionicons name="call-outline" size={20} color={COLORS.white} />
            <Text style={styles.actionBtnText}>{t('places.call')}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtnSecondary]}
          onPress={handleDirections}
        >
          <Ionicons name="navigate-outline" size={20} color={COLORS.primary} />
          <Text style={styles.actionBtnTextSecondary}>{t('places.directions')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  imageSection: {
    position: 'relative',
  },
  imagePlaceholder: {
    height: 280,
  },
  imageContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageHint: {
    ...FONTS.caption,
    color: 'rgba(255,255,255,0.4)',
    marginTop: SPACING.sm,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.lg,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceBadge: {
    position: 'absolute',
    bottom: SPACING.lg + 20,
    right: SPACING.lg,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  priceBadgeText: {
    ...FONTS.bodyBold,
    color: COLORS.textPrimary,
  },
  contentSection: {
    padding: SPACING.xl,
    paddingBottom: 0,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: 4,
  },
  ratingText: {
    ...FONTS.bodyBold,
    color: COLORS.textPrimary,
  },
  reviewText: {
    ...FONTS.body,
    color: COLORS.textTertiary,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: 6,
  },
  addressText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  tagText: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
  },
  section: {
    padding: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  description: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.bg,
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  actionBtn: {
    flex: 1,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  actionGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(6,182,212,0.1)',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  actionBtnText: {
    ...FONTS.bodyBold,
    color: COLORS.white,
  },
  actionBtnTextSecondary: {
    ...FONTS.bodyBold,
    color: COLORS.primary,
  },
});
