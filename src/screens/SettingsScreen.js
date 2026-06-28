import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme';
import { useApp } from '../context/AppContext';
import { LanguageModal } from '../components/LanguageModal';
import { clearLocation } from '../services/locationService';

export default function SettingsScreen({ navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { hasLocationPermission, userCity, refreshLocation } = useApp();
  const [showLanguage, setShowLanguage] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const settings = [
    {
      section: null,
      items: [
        { id: 'language', icon: 'language-outline', color: COLORS.primary },
        { id: 'notifications', icon: 'notifications-outline', color: COLORS.warning },
      ],
    },
    {
      section: null,
      items: [
        { id: 'privacy', icon: 'shield-outline', color: COLORS.purple },
        { id: 'terms', icon: 'document-text-outline', color: COLORS.textSecondary },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.canGoBack() && navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('profile.settings')}</Text>
          <View style={styles.backBtn} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}>
        {settings.map((section, idx) => (
          <View key={idx} style={styles.section}>
            {section.section && (
              <Text style={styles.sectionTitle}>{section.section}</Text>
            )}
            <View style={styles.card}>
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.row, i < section.items.length - 1 && styles.rowBorder]}
                  onPress={() => {
                    if (item.id === 'language') setShowLanguage(true);
                    if (item.id === 'privacy') setShowPrivacy(!showPrivacy);
                  }}
                >
                  <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                    <Ionicons name={item.icon} size={18} color={item.color} />
                  </View>
                  <Text style={styles.label}>{t(`profile.${item.id}`)}</Text>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {showPrivacy && (
        <View style={styles.privacyCard}>
          <View style={styles.privacyHeader}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.secondary} />
            <Text style={styles.privacyTitle}>Privacy & Location</Text>
          </View>
          <View style={styles.privacyRow}>
            <Ionicons name="location-outline" size={18} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.privacyLabel}>Location Status</Text>
              <Text style={styles.privacyValue}>
                {hasLocationPermission ? 'Active' : 'Disabled'}
                {userCity ? ` - ${userCity}` : ''}
              </Text>
            </View>
          </View>
          <View style={styles.privacyDivider} />
          <Text style={styles.privacyDesc}>
            Location is only used to show nearby services, places, and community
            help. Your location never leaves your device unless you explicitly
            search for nearby places. You can disable access anytime in device
            Settings.
          </Text>
          <View style={styles.privacyDivider} />
          <TouchableOpacity
            style={styles.privacyAction}
            onPress={() => {
              Alert.alert(
                'Clear Saved Location',
                'This removes your saved location from this device.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                      await clearLocation();
                      refreshLocation();
                      setShowPrivacy(false);
                    },
                  },
                ]
              );
            }}
          >
            <Ionicons name="trash-outline" size={16} color={COLORS.error} />
            <Text style={styles.privacyActionText}>Clear Location Data</Text>
          </TouchableOpacity>
        </View>
      )}

      <LanguageModal visible={showLanguage} onClose={() => setShowLanguage(false)} />
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
    backgroundColor: COLORS.bg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
  },
  section: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...FONTS.captionBold,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  label: {
    ...FONTS.body,
    color: COLORS.textPrimary,
    flex: 1,
  },
  privacyCard: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.secondary + '20',
    overflow: 'hidden',
    padding: SPACING.lg,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  privacyTitle: {
    ...FONTS.bodyBold,
    color: COLORS.textPrimary,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  privacyLabel: {
    ...FONTS.captionBold,
    color: COLORS.textPrimary,
  },
  privacyValue: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  privacyDivider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: SPACING.md,
  },
  privacyDesc: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  privacyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  privacyActionText: {
    ...FONTS.captionBold,
    color: COLORS.error,
  },
});
