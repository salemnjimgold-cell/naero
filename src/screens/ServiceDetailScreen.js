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

export default function ServiceDetailScreen({ route, navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { item } = route.params;

  const handleCall = () => {
    Linking.openURL(`tel:${item.contact.replace(/[^+\d]/g, '')}`);
  };

  const handleDirections = () => {
    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(item.location)}`);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.canGoBack() && navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons
              name={item.category === 'legal' ? 'shield-checkmark' : item.category === 'translation' ? 'language' : item.category === 'housing' ? 'home' : item.category === 'healthcare' ? 'medkit' : item.category === 'education' ? 'school' : item.category === 'transport' ? 'car' : item.category === 'banking' ? 'wallet' : item.category === 'food' ? 'fast-food' : 'help-buoy'}
              size={28}
              color={COLORS.primary}
            />
          </View>
          <Text style={styles.title}>{item.name}</Text>
          <View style={styles.providerRow}>
            <Ionicons name="business-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.providerText}>{item.provider}</Text>
          </View>
          <View style={styles.priceContainer}>
            <Ionicons name="pricetag-outline" size={14} color={COLORS.primary} />
            <Text style={styles.priceValue}>{item.price}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('services.description')}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('services.location')}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={COLORS.primary} />
            <Text style={styles.infoText}>{item.location}</Text>
          </View>
        </View>

        {item.hours && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('services.hours')}</Text>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={18} color={COLORS.primary} />
              <Text style={styles.infoText}>{item.hours}</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('services.contact')}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color={COLORS.primary} />
            <Text style={styles.infoText}>{item.contact}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.actionBar, { paddingBottom: insets.bottom + SPACING.xl }]}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
          <LinearGradient colors={GRADIENTS.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionGradient}>
            <Ionicons name="call-outline" size={20} color={COLORS.white} />
            <Text style={styles.actionBtnText}>{t('services.call')}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtnSecondary}
          onPress={handleDirections}
        >
          <Ionicons name="navigate-outline" size={20} color={COLORS.primary} />
          <Text style={styles.actionBtnTextSecondary}>{t('services.directions')}</Text>
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
  header: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hero: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.md,
  },
  providerText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  priceValue: {
    ...FONTS.bodyBold,
    color: COLORS.primary,
  },
  section: {
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
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
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  infoText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    flex: 1,
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
