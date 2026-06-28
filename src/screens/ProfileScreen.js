import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  Linking,
  Image,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS } from '../theme';
import { useApp } from '../context/AppContext';
import { LanguageModal } from '../components/LanguageModal';
import { PrimaryButton, SecondaryButton } from '../components/BrandedButtons';
import { saveManualCity, getManualCity, clearLocation } from '../services/locationService';

const LOGO = require('../../assets/branding/naero-logo.png');

const menuItems = [
  { id: 'settings', icon: 'settings-outline', color: COLORS.textSecondary, screen: 'Settings' },
  { id: 'saved', icon: 'heart-outline', color: COLORS.error },
  { id: 'savedJobs', icon: 'briefcase-outline', color: COLORS.primary },
  { id: 'language', icon: 'language-outline', color: COLORS.purple },
  { id: 'about', icon: 'information-circle-outline', color: COLORS.info, screen: 'About' },
  { id: 'shareApp', icon: 'share-outline', color: COLORS.secondary },
  { id: 'rateApp', icon: 'star-outline', color: COLORS.warning },
];

export default function ProfileScreen({ navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { favorites, savedJobs, savedPlaces, userLocation, userCity, hasLocationPermission, requestLocationPermission, refreshLocation, locationLoading } = useApp();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [manualCity, setManualCity] = useState('');
  const [showPrivacyNote, setShowPrivacyNote] = useState(false);

  const handleMenuPress = useCallback(
    (itemId) => {
      switch (itemId) {
        case 'language':
          setShowLanguageModal(true);
          break;
        case 'shareApp':
          Share.share({
            message: 'Download Naero - Not a stranger anymore! https://naero.me',
          });
          break;
        case 'rateApp':
          Linking.openURL('https://apps.apple.com/app/naero');
          break;
        case 'settings':
          navigation.navigate('Settings');
          break;
        case 'about':
          navigation.navigate('About');
          break;
      }
    },
    [navigation]
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}>
        <LinearGradient
          colors={['rgba(6,182,212,0.06)', COLORS.bg]}
          style={[styles.header, { paddingTop: insets.top + SPACING.xl }]}
        >
          <View style={styles.profileInfo}>
            <View style={styles.avatarLarge}>
              <Image source={LOGO} style={{ width: 64, height: 64 }} resizeMode="contain" />
              <TouchableOpacity style={styles.editBadge}>
                <Ionicons name="pencil" size={12} color={COLORS.white} />
              </TouchableOpacity>
            </View>
            <Text style={styles.profileName}>{t('profile.guest')}</Text>
            <Text style={styles.profileEmail}>guest@naero.app</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{savedPlaces.length + favorites.length}</Text>
              <Text style={styles.statLabel}>{t('profile.savedItems')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{savedJobs.length}</Text>
              <Text style={styles.statLabel}>{t('profile.savedJobs')}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.menuSection}>
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, idx < menuItems.length - 1 && styles.menuItemBorder]}
              onPress={() => handleMenuPress(item.id)}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{t(`profile.${item.id}`)}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.locationSection}>
          <Text style={styles.locationSectionTitle}>Location</Text>
          <View style={styles.locationCard}>
            {hasLocationPermission && userCity ? (
              <View style={styles.locationStatusRow}>
                <Ionicons name="location" size={18} color={COLORS.success} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.locationLabel}>{userCity}</Text>
                  <Text style={styles.locationStatusText}>Location active</Text>
                </View>
                <TouchableOpacity
                  style={styles.locationAction}
                  onPress={refreshLocation}
                  disabled={locationLoading}
                >
                  <Ionicons name="refresh" size={18} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.locationStatusRow}>
                <Ionicons name="location-outline" size={18} color={COLORS.textTertiary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.locationLabel}>Location off</Text>
                  <Text style={styles.locationStatusText}>
                    {userCity ? `Using: ${userCity}` : 'Enable for nearby recommendations'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.locationAction}
                  onPress={requestLocationPermission}
                >
                  <Ionicons name="settings-outline" size={18} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.locationDivider} />
            <TouchableOpacity
              style={styles.locationManualRow}
              onPress={() => {
                getManualCity().then((c) => setManualCity(c || ''));
                setShowCityModal(true);
              }}
            >
              <Ionicons name="create-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.locationManualText}>Set city manually</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.privacyCard}>
          <TouchableOpacity
            style={styles.privacyHeader}
            onPress={() => setShowPrivacyNote(!showPrivacyNote)}
          >
            <View style={styles.privacyIconBox}>
              <Ionicons name="shield-checkmark" size={18} color={COLORS.secondary} />
            </View>
            <Text style={styles.privacyTitle}>Location & Privacy</Text>
            <Ionicons
              name={showPrivacyNote ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={COLORS.textTertiary}
            />
          </TouchableOpacity>
          {showPrivacyNote && (
            <View style={styles.privacyContent}>
              <Text style={styles.privacyText}>
                • Location is used only to show nearby services, places, and community help.{'\n'}
                • Your location never leaves your device unless you search for nearby places.{'\n'}
                • You can disable location access anytime in your device Settings.{'\n'}
                • Saved location can be cleared or refreshed at any time.{'\n'}
                • If location is off, you can manually set your city.
              </Text>
              <TouchableOpacity
                style={styles.clearLocationBtn}
                onPress={() => {
                  Alert.alert(
                    'Clear Saved Location',
                    'This will remove your saved location data. You can set it again anytime.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Clear',
                        style: 'destructive',
                        onPress: async () => {
                          await clearLocation();
                          refreshLocation();
                        },
                      },
                    ]
                  );
                }}
              >
                <Text style={styles.clearLocationText}>Clear Saved Location</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.logoutBtn}>
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>

        <Text style={styles.version}>{t('profile.version')} 1.0.0</Text>
      </ScrollView>

      <LanguageModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />

      <Modal
        visible={showCityModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="location-outline" size={24} color={COLORS.primary} />
              <Text style={styles.modalTitle}>Set Your City</Text>
            </View>
            <Text style={styles.modalDesc}>
              Enter the city you are currently in so Naero can show relevant information.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={manualCity}
              onChangeText={setManualCity}
              placeholder="e.g. Budapest, Debrecen, Szeged"
              placeholderTextColor={COLORS.textTertiary}
              autoCapitalize="words"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowCityModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSave}
                onPress={async () => {
                  if (manualCity.trim()) {
                    await saveManualCity(manualCity.trim());
                    refreshLocation();
                    setShowCityModal(false);
                  }
                }}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: RADIUS.xxxl,
    borderBottomRightRadius: RADIUS.xxxl,
  },
  profileInfo: {
    alignItems: 'center',
    paddingTop: SPACING.lg,
  },
  avatarLarge: {
    width: 84,
    height: 84,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
    overflow: 'hidden',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.purple,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
  profileName: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
  },
  profileEmail: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
    gap: SPACING.xl,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    ...FONTS.h1,
    color: COLORS.textPrimary,
  },
  statLabel: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.cardBorder,
  },
  menuSection: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuLabel: {
    ...FONTS.body,
    color: COLORS.textPrimary,
    flex: 1,
  },
  logoutBtn: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.error + '10',
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  logoutText: {
    ...FONTS.bodyBold,
    color: COLORS.error,
  },
  version: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
  locationSection: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
  },
  locationSectionTitle: {
    ...FONTS.captionBold,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  locationCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  locationStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  locationLabel: {
    ...FONTS.bodyBold,
    color: COLORS.textPrimary,
  },
  locationStatusText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  locationAction: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationDivider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginHorizontal: SPACING.lg,
  },
  locationManualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  locationManualText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    flex: 1,
  },
  privacyCard: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.secondary + '20',
    overflow: 'hidden',
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  privacyIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.secondary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  privacyTitle: {
    ...FONTS.body,
    color: COLORS.textPrimary,
    flex: 1,
  },
  privacyContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  privacyText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  clearLocationBtn: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.error + '10',
    borderRadius: RADIUS.md,
    alignSelf: 'flex-start',
  },
  clearLocationText: {
    ...FONTS.smallBold,
    color: COLORS.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xxl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  modalTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
  },
  modalDesc: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  modalInput: {
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...FONTS.body,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.xl,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  modalCancelText: {
    ...FONTS.bodyBold,
    color: COLORS.textSecondary,
  },
  modalSave: {
    flex: 1,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
  },
  modalSaveText: {
    ...FONTS.bodyBold,
    color: COLORS.white,
  },
});
