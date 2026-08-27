import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import StateView, { InlineLoading } from '../components/contextual/StateView';
import { ACCENT, BORDER, DEPTH, FONTS, RADIUS, SPACING, TEXT } from '../theme';

const { getHomeState } = require('../domain/coreShell');

function ActionCard({ icon, title, body, onPress, rtl }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [styles.action, rtl && styles.rowReverse, pressed && styles.pressed]}>
    <Ionicons name={icon} size={24} color={ACCENT.light} accessible={false} />
    <View style={styles.actionCopy}><Text style={styles.actionTitle}>{title}</Text><Text style={styles.actionBody}>{body}</Text></View>
    <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={20} color={TEXT.tertiary} accessible={false} />
  </Pressable>;
}

export default function HomeScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const app = useApp();
  const view = useMemo(() => getHomeState({ auth: app.auth, userCity: app.userCity, userLocation: app.userLocation, nearbyPlaces: app.nearbyPlaces, loading: app.dataLoading, error: app.dataError }), [app.auth, app.userCity, app.userLocation, app.nearbyPlaces, app.dataLoading, app.dataError]);
  const rtl = i18n.language === 'ar';
  const openDiscover = () => navigation.navigate('World');
  const openLocation = () => navigation.navigate('Settings');

  return <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.xxl, paddingBottom: insets.bottom + 96 }]} showsVerticalScrollIndicator={false}>
    <Text accessibilityRole="header" style={[styles.title, rtl && styles.rtl]}>{view.displayName ? t('truthfulHome.welcomeNamed', { name: view.displayName }) : t('truthfulHome.welcome')}</Text>
    <Text style={[styles.subtitle, rtl && styles.rtl]}>{view.isGuest ? t('truthfulHome.guest') : t('truthfulHome.signedIn')}</Text>

    <View style={[styles.locationCard, rtl && styles.rowReverse]}>
      <Ionicons name={view.hasResolvedLocation ? 'location' : 'location-outline'} size={24} color={ACCENT.light} accessible={false} />
      <View style={styles.locationCopy}>
        <Text style={[styles.label, rtl && styles.rtl]}>{t('truthfulHome.location')}</Text>
        <Text style={[styles.value, rtl && styles.rtl]}>{view.locationLabel || t('truthfulHome.locationMissing')}</Text>
        {!view.hasResolvedLocation && <Text style={[styles.note, rtl && styles.rtl]}>{t('truthfulHome.locationRequired')}</Text>}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={t('truthfulHome.manageLocation')} onPress={openLocation} style={styles.smallButton}><Text style={styles.smallButtonText}>{t('truthfulHome.manage')}</Text></Pressable>
    </View>

    <View style={styles.actions}>
      <ActionCard rtl={rtl} icon="compass-outline" title={t('truthfulHome.discover')} body={t('truthfulHome.discoverBody')} onPress={openDiscover} />
      <ActionCard rtl={rtl} icon="sparkles-outline" title={t('truthfulHome.ask')} body={t('truthfulHome.askBody')} onPress={() => navigation.navigate('AI')} />
    </View>

    <Text style={[styles.sectionTitle, rtl && styles.rtl]}>{t('truthfulHome.nearby')}</Text>
    {!view.hasResolvedLocation ? <StateView icon="navigate-outline" title={t('truthfulHome.noLocationTitle')} body={t('truthfulHome.noLocationBody')} primaryAction={{ label: t('truthfulHome.manageLocation'), onPress: openLocation }} />
      : view.loading ? <InlineLoading label={t('truthfulHome.loading')} />
        : view.error ? <StateView icon="cloud-offline-outline" tone="warning" title={t('truthfulHome.errorTitle')} body={t('truthfulHome.errorBody')} primaryAction={{ label: t('truthfulHome.openDiscover'), onPress: openDiscover }} />
          : view.places.length === 0 ? <StateView icon="search-outline" title={t('truthfulHome.emptyTitle')} body={t('truthfulHome.emptyBody')} primaryAction={{ label: t('truthfulHome.openDiscover'), onPress: openDiscover }} />
            : <View style={styles.placeList}>{view.places.map((place) => <Pressable key={place.id} accessibilityRole="button" accessibilityLabel={`${place.name}, ${place.category || t('truthfulHome.place')}`} onPress={() => navigation.navigate('PlaceDetail', { item: place })} style={({ pressed }) => [styles.place, rtl && styles.rowReverse, pressed && styles.pressed]}>
              <Ionicons name="location-outline" size={22} color={ACCENT.light} accessible={false} />
              <View style={styles.placeCopy}><Text style={[styles.placeName, rtl && styles.rtl]} numberOfLines={1}>{place.name}</Text><Text style={[styles.placeMeta, rtl && styles.rtl]} numberOfLines={1}>{place.category || t('truthfulHome.place')}</Text></View>
              <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={18} color={TEXT.tertiary} accessible={false} />
            </Pressable>)}<Pressable accessibilityRole="button" accessibilityLabel={t('truthfulHome.openDiscover')} onPress={openDiscover} style={styles.allButton}><Text style={styles.allButtonText}>{t('truthfulHome.openDiscover')}</Text></Pressable></View>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: DEPTH.canvas }, content: { paddingHorizontal: SPACING.xl }, title: { ...FONTS.h1, color: TEXT.primary }, subtitle: { ...FONTS.body, color: TEXT.secondary, marginTop: SPACING.xs, marginBottom: SPACING.xxl }, rtl: { writingDirection: 'rtl', textAlign: 'right' }, rowReverse: { flexDirection: 'row-reverse' },
  locationCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.lg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: BORDER.subtle, backgroundColor: DEPTH.surface }, locationCopy: { flex: 1 }, label: { ...FONTS.caption, color: TEXT.secondary }, value: { ...FONTS.bodyBold, color: TEXT.primary }, note: { ...FONTS.small, color: TEXT.tertiary, marginTop: SPACING.xs }, smallButton: { minHeight: 44, minWidth: 60, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.md }, smallButtonText: { ...FONTS.captionBold, color: ACCENT.light },
  actions: { gap: SPACING.md, marginVertical: SPACING.xxl }, action: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.lg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: BORDER.subtle, backgroundColor: DEPTH.surface }, actionCopy: { flex: 1 }, actionTitle: { ...FONTS.bodyBold, color: TEXT.primary }, actionBody: { ...FONTS.caption, color: TEXT.secondary, marginTop: 2 }, sectionTitle: { ...FONTS.h3, color: TEXT.primary, marginBottom: SPACING.sm },
  placeList: { gap: SPACING.sm }, place: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingHorizontal: SPACING.lg, borderRadius: RADIUS.md, borderWidth: 1, borderColor: BORDER.subtle, backgroundColor: DEPTH.surface }, placeCopy: { flex: 1 }, placeName: { ...FONTS.bodyBold, color: TEXT.primary }, placeMeta: { ...FONTS.caption, color: TEXT.secondary, textTransform: 'capitalize' }, allButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center' }, allButtonText: { ...FONTS.bodyBold, color: ACCENT.light }, pressed: { opacity: 0.78 },
});
