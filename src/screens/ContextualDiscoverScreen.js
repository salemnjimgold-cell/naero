import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, I18nManager, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/Text';
import StateView, { InlineLoading } from '../components/contextual/StateView';
import SourceSummary from '../components/contextual/SourceSummary';
import { useApp } from '../context/AppContext';
import { useThemeMode } from '../theme/ThemeModeContext';
import discoverCore from '../domain/discoverCore';

function distanceLabel(meters) {
  if (!Number.isFinite(meters)) return null;
  return meters < 1000 ? `${Math.max(10, Math.round(meters / 10) * 10)} m` : `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`;
}

function ResultCard({ item, onPress, theme, t, rtl }) {
  const distance = distanceLabel(item.distanceMeters);
  return <Pressable onPress={() => onPress(item)} accessibilityRole="button" accessibilityLabel={`${item.name}. ${item.address || ''}`} style={({ pressed }) => [styles.card, { backgroundColor: theme.colors.background.surface, borderColor: theme.colors.border.subtle, opacity: pressed ? 0.82 : 1 }]}>
    <View style={[styles.cardTop, rtl && styles.rowReverse]}><View style={[styles.cardIcon, { backgroundColor: theme.colors.action.subtle }]}><Ionicons name="location-outline" size={theme.icons.control} color={theme.colors.action.primary} /></View><View style={styles.flex}><Text variant="bodyBold" style={[{ color: theme.colors.text.primary }, rtl && styles.rtl]}>{item.name}</Text><Text variant="caption" numberOfLines={2} style={[{ color: theme.colors.text.secondary }, rtl && styles.rtl]}>{item.address || t(`compass3d.categories.${item.category}`)}</Text>{distance ? <Text variant="captionBold" style={[{ color: theme.colors.action.primary }, rtl && styles.rtl]}>{t('compass3d.card.distance', { distance })}</Text> : null}</View><Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={theme.icons.inline} color={theme.colors.text.secondary} /></View>
    <SourceSummary provenance={item.provenance} locale={I18nManager.isRTL ? 'ar' : 'en'} />
  </Pressable>;
}

export default function ContextualDiscoverScreen({ navigation }) {
  const { t, i18n } = useTranslation(); const insets = useSafeAreaInsets(); const { theme } = useThemeMode();
  const { onboardingContext, locationState, userLocation, placeService } = useApp();
  const rtl = i18n.language === 'ar';
  const context = useMemo(() => discoverCore.resolveDiscoverContext({ onboardingContext, locationState, userLocation }), [onboardingContext, locationState, userLocation]);
  const [category, setCategory] = useState('pharmacy'); const [query, setQuery] = useState(''); const [submittedQuery, setSubmittedQuery] = useState('');
  const [results, setResults] = useState([]); const [loading, setLoading] = useState(false); const [error, setError] = useState(null); const [stale, setStale] = useState(false); const [attributions, setAttributions] = useState([]); const requestRef = useRef(0);

  const load = useCallback(async (nextCategory = category) => {
    if (!context.coordinates) { setResults([]); setError({ code: 'LOCATION_REQUIRED' }); return; }
    const request = ++requestRef.current; setLoading(true); setError(null);
    const response = await placeService.getNearby(context.coordinates.latitude, context.coordinates.longitude, context.mode === 'manual' ? 15 : 10, 30, nextCategory, i18n.language);
    if (request !== requestRef.current) return;
    const normalized = (response.data || []).map((item) => discoverCore.normalizeDiscoverResult(item, context)).filter(Boolean);
    setResults(normalized); setError(response.error || null); setStale(Boolean(response.stale)); setAttributions(response.attribution || []); setLoading(false);
  }, [category, context, i18n.language, placeService]);

  useEffect(() => { load(category); }, [category, context.mode, context.label, context.coordinates?.latitude, context.coordinates?.longitude, i18n.language]);
  const submitSearch = () => { const next = discoverCore.categoryForSearch(query, category); setSubmittedQuery(query.trim()); if (next === category) load(next); else setCategory(next); };
  const visible = useMemo(() => { const q = submittedQuery.toLocaleLowerCase(); if (!q || discoverCore.recognizedSearchCategory(q)) return results; return results.filter((item) => [item.name, item.address].some((value) => value?.toLocaleLowerCase().includes(q))); }, [results, submittedQuery]);
  const state = discoverCore.stateForFailure(error, stale && results.length > 0);

  const Header = <View style={[styles.header, { paddingTop: insets.top + theme.spacing.md }]}>
    <Text variant="h1" accessibilityRole="header" style={[{ color: theme.colors.text.primary }, rtl && styles.rtl]}>{t('compass3d.title')}</Text><Text variant="body" style={[{ color: theme.colors.text.secondary }, rtl && styles.rtl]}>{t('compass3d.subtitle')}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={t('compass3d.change')} onPress={() => navigation.navigate('ContextualOnboarding', { initialStep: 'location' })} style={[styles.context, rtl && styles.rowReverse, { backgroundColor: theme.colors.background.surface, borderColor: theme.colors.border.default, minHeight: theme.touchTargets.preferred }]}><Ionicons name={context.mode === 'device' ? 'navigate-outline' : 'map-outline'} size={theme.icons.control} color={theme.colors.action.primary} /><View style={styles.flex}><Text variant="captionBold" style={[{ color: theme.colors.text.secondary }, rtl && styles.rtl]}>{context.mode === 'device' ? t('compass3d.current') : context.mode === 'manual' ? t('compass3d.selected') : t('compass3d.unknown')}</Text>{context.label ? <Text variant="bodyBold" style={[{ color: theme.colors.text.primary }, rtl && styles.rtl]}>{context.label}</Text> : null}</View><Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={theme.icons.inline} color={theme.colors.text.secondary} /></Pressable>
    <View style={[styles.search, rtl && styles.rowReverse, { backgroundColor: theme.colors.background.surface, borderColor: theme.colors.border.default, minHeight: theme.touchTargets.preferred }]}><Ionicons name="search-outline" size={theme.icons.inline} color={theme.colors.text.secondary} /><TextInput value={query} onChangeText={setQuery} onSubmitEditing={submitSearch} returnKeyType="search" accessibilityLabel={t('compass3d.search')} placeholder={t('compass3d.search')} placeholderTextColor={theme.colors.text.disabled} style={[styles.searchInput, theme.typography.body, { color: theme.colors.text.primary, textAlign: rtl ? 'right' : 'left' }]} /><Pressable onPress={submitSearch} accessibilityRole="button" accessibilityLabel={t('compass3d.searchAction')} style={[styles.searchAction, { minWidth: theme.touchTargets.minimum, minHeight: theme.touchTargets.minimum }]}><Ionicons name="arrow-forward-circle" size={theme.icons.control} color={theme.colors.action.primary} /></Pressable></View>
    {discoverCore.CATEGORY_GROUPS.map((group) => <View key={group.id} style={styles.group}><Text variant="captionBold" style={[{ color: theme.colors.text.secondary }, rtl && styles.rtl]}>{t(`compass3d.groups.${group.id}`)}</Text><View style={[styles.chips, rtl && styles.rowReverse]}>{group.categories.map((id) => <Pressable key={id} onPress={() => { setSubmittedQuery(''); setQuery(''); setCategory(id); }} accessibilityRole="button" accessibilityState={{ selected: category === id }} style={[styles.chip, { minHeight: theme.touchTargets.minimum, backgroundColor: category === id ? theme.colors.action.primary : theme.colors.background.surface, borderColor: category === id ? theme.colors.action.primary : theme.colors.border.default }]}><Text variant="captionBold" style={{ color: category === id ? theme.colors.text.onAction : theme.colors.text.primary }}>{t(`compass3d.categories.${id}`)}</Text></Pressable>)}</View></View>)}
    <View style={[styles.resultsHead, rtl && styles.rowReverse]}><Text variant="h3" style={{ color: theme.colors.text.primary }}>{t('compass3d.results')}</Text>{stale ? <Text variant="caption" style={{ color: theme.colors.status.warning }}>{t('compass3d.cached')}</Text> : null}</View>{attributions.length ? <Text variant="caption" style={[{ color: theme.colors.text.disabled }, rtl && styles.rtl]}>{attributions.join(' · ')}</Text> : null}
  </View>;

  const Empty = loading ? <InlineLoading label={t('compass3d.states.loading')} /> : <StateView icon={state === 'location' ? 'location-outline' : state === 'offline' ? 'cloud-offline-outline' : 'search-outline'} title={t(`compass3d.states.${state === 'provider' ? 'provider' : state === 'offline' ? 'offline' : state === 'location' ? 'location' : state === 'error' ? 'error' : 'empty'}Title`)} body={t(`compass3d.states.${state === 'provider' ? 'provider' : state === 'offline' ? 'offline' : state === 'location' ? 'location' : state === 'error' ? 'error' : 'empty'}Body`)} primaryAction={state !== 'location' ? { label: t('compass3d.states.retry'), onPress: () => load(category) } : { label: t('compass3d.change'), onPress: () => navigation.navigate('ContextualOnboarding', { initialStep: 'location' }) }} />;
  return <View style={{ flex: 1, backgroundColor: theme.colors.background.canvas }}><FlatList data={visible} keyExtractor={(item) => item.id} ListHeaderComponent={Header} ListEmptyComponent={Empty} renderItem={({ item }) => <ResultCard item={item} onPress={(selected) => navigation.navigate('DiscoverDetail', { item: selected, context: { mode: context.mode, label: context.label, countryCode: context.countryCode, municipality: context.municipality } })} theme={theme} t={t} rtl={rtl} />} contentContainerStyle={{ paddingBottom: insets.bottom + 120 }} keyboardShouldPersistTaps="handled" /></View>;
}

const styles = StyleSheet.create({ header: { paddingHorizontal: 20, gap: 12, paddingBottom: 16 }, flex: { flex: 1 }, rtl: { textAlign: 'right', writingDirection: 'rtl' }, rowReverse: { flexDirection: 'row-reverse' }, context: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 1, borderRadius: 12 }, search: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderWidth: 1, borderRadius: 12 }, searchInput: { flex: 1, paddingVertical: 8 }, searchAction: { alignItems: 'center', justifyContent: 'center' }, group: { gap: 6 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderRadius: 999 }, resultsHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 8 }, card: { marginHorizontal: 20, marginBottom: 12, padding: 16, borderWidth: 1, borderRadius: 12, gap: 12 }, cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 }, cardIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' } });
