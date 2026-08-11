import React, { useMemo, useState } from 'react';
import { I18nManager, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ACCENT, BORDER, DEPTH, FONTS, RADIUS, SPACING, TEXT } from '../theme';
import { useApp } from '../context/AppContext';
import StateView from '../components/contextual/StateView';
import core from '../domain/onboardingContextCore';

const CITIES = Object.freeze([
  { countryCode: 'AT', country: 'Austria', region: 'Vienna Land', municipality: 'Vienna' },
  { countryCode: 'AT', country: 'Austria', region: 'Lower Austria', municipality: 'St. Pölten' },
  { countryCode: 'AT', country: 'Austria', region: 'Styria', municipality: 'Graz' },
  { countryCode: 'HU', country: 'Hungary', region: 'Central Hungary', municipality: 'Budapest' },
  { countryCode: 'FR', country: 'France', region: 'Île-de-France', municipality: 'Paris' },
  { countryCode: 'DE', country: 'Germany', region: 'Berlin', municipality: 'Berlin' },
]);
const LANGUAGES = ['en', 'ar', 'fr', 'hu'];
const INTENTS = core.INTENTS;

function Choice({ icon, title, body, selected, onPress, accessibilityLabel }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel || title} accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, pressed && styles.pressed]}><Ionicons name={icon} size={24} color={selected ? ACCENT.primary : TEXT.secondary} /><View style={styles.choiceCopy}><Text style={styles.choiceTitle}>{title}</Text>{body ? <Text style={styles.choiceBody}>{body}</Text> : null}</View>{selected ? <Ionicons name="checkmark-circle" size={22} color={ACCENT.primary} /> : null}</Pressable>;
}

export default function ContextualOnboardingScreen({ navigation, route }) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { setLanguage, requestLocationPermission, locationLoading, setOnboardingContext } = useApp();
  const [step, setStep] = useState(route?.params?.initialStep || 'welcome');
  const [search, setSearch] = useState('');
  const [place, setPlace] = useState(null);
  const [origin, setOrigin] = useState('unknown');
  const [locationMode, setLocationMode] = useState('unknown');
  const [intents, setIntents] = useState([]);
  const [permissionUnavailable, setPermissionUnavailable] = useState(false);
  const rtl = i18n.language === 'ar' || I18nManager.isRTL;
  const tx = (key, options) => t(`compass3c.${key}`, options);

  const results = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return query ? CITIES.filter((item) => `${item.country} ${item.region} ${item.municipality}`.toLocaleLowerCase().includes(query)) : CITIES;
  }, [search]);

  const chooseLanguage = async (next) => {
    await i18n.changeLanguage(next);
    setLanguage(next);
  };
  const chooseDeviceLocation = async () => {
    setPermissionUnavailable(false);
    const result = await requestLocationPermission();
    const address = result?.snapshot?.address;
    if (result?.permissionStatus === 'granted' && address?.countryCode && address?.city) {
      setPlace({ countryCode: address.countryCode, country: address.country || address.countryCode, region: address.region || null, municipality: address.city });
      setOrigin('permission_derived');
      setLocationMode('device');
      setStep('confirm');
    } else {
      setPermissionUnavailable(true);
    }
  };
  const chooseManual = (item) => {
    setPlace(item);
    setOrigin('user_selected');
    setLocationMode('manual');
    setStep('confirm');
  };
  const toggleIntent = (intent) => setIntents((current) => current.includes(intent) ? current.filter((item) => item !== intent) : current.length < 4 ? [...current, intent] : current);
  const finish = async (selectedIntents = intents) => {
    const context = core.normalizeContext({ completed: true, language: i18n.language, ...place, origin, locationMode, intents: selectedIntents });
    await setOnboardingContext(context);
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };
  const goBack = () => {
    const previous = { language: 'welcome', account: 'language', location: 'account', city: 'location', confirm: locationMode === 'manual' ? 'city' : 'location', intent: 'confirm' };
    setStep(previous[step] || 'welcome');
  };

  const header = step !== 'welcome' ? <Pressable accessibilityRole="button" accessibilityLabel={tx('common.back')} onPress={goBack} style={styles.back}><Ionicons name={rtl ? 'arrow-forward' : 'arrow-back'} size={24} color={TEXT.primary} /><Text style={styles.backText}>{tx('common.back')}</Text></Pressable> : null;
  const title = (key, body) => <View style={styles.heading}><Text accessibilityRole="header" style={[styles.title, rtl && styles.rtl]}>{tx(key)}</Text>{body ? <Text style={[styles.body, rtl && styles.rtl]}>{tx(body)}</Text> : null}</View>;

  let content;
  if (step === 'welcome') content = <View style={styles.center}><View style={styles.mark}><Ionicons name="compass-outline" size={42} color={ACCENT.primary} /></View><Text style={[styles.eyebrow, rtl && styles.rtl]}>{tx('welcome.eyebrow')}</Text><Text accessibilityRole="header" style={[styles.hero, rtl && styles.rtl]}>{tx('welcome.title')}</Text><Text style={[styles.body, rtl && styles.rtl]}>{tx('welcome.body')}</Text><Pressable accessibilityRole="button" onPress={() => setStep('language')} style={styles.primary}><Text style={styles.primaryText}>{tx('welcome.action')}</Text></Pressable></View>;
  else if (step === 'language') content = <>{title('language.title', 'language.body')}<View style={styles.list}>{LANGUAGES.map((code) => <Choice key={code} icon="language-outline" title={tx(`language.${code}`)} selected={i18n.language === code} onPress={() => chooseLanguage(code)} />)}</View><Pressable accessibilityRole="button" onPress={() => setStep('account')} style={styles.primary}><Text style={styles.primaryText}>{tx('common.continue')}</Text></Pressable></>;
  else if (step === 'account') content = <>{title('account.title', 'account.body')}<View style={styles.list}><Choice icon="person-outline" title={tx('account.guest')} onPress={() => setStep('location')} /><Choice icon="log-in-outline" title={tx('account.auth')} onPress={() => navigation.navigate('Auth', { onboarding3c: true })} /></View></>;
  else if (step === 'location') content = <>{title('location.title', 'location.body')}{permissionUnavailable ? <StateView icon="location-outline" title={tx('location.denied')} body={tx('location.manualBody')} primaryAction={{ label: tx('location.manual'), onPress: () => setStep('city') }} /> : <View style={styles.list}><Choice icon="navigate-outline" title={locationLoading ? '…' : tx('location.device')} body={tx('location.deviceBody')} onPress={chooseDeviceLocation} /><Choice icon="map-outline" title={tx('location.manual')} body={tx('location.manualBody')} onPress={() => setStep('city')} /></View>}</>;
  else if (step === 'city') content = <>{title('city.title')}<TextInput accessibilityLabel={tx('city.search')} value={search} onChangeText={setSearch} placeholder={tx('city.search')} placeholderTextColor={TEXT.tertiary} style={[styles.search, rtl && styles.rtl]} />{results.length ? <View style={styles.list}>{results.map((item) => <Choice key={`${item.countryCode}-${item.municipality}`} icon="location-outline" title={`${item.municipality}, ${item.country}`} body={item.region} onPress={() => chooseManual(item)} />)}</View> : <StateView icon="search-outline" title={tx('city.noResults')} />}</>;
  else if (step === 'confirm') content = <>{title('confirm.title', 'confirm.body')}<View style={styles.summary}><Text style={styles.summaryLabel}>{tx('confirm.country')}</Text><Text style={styles.summaryValue}>{place?.country || '—'}</Text>{place?.region ? <><Text style={styles.summaryLabel}>{tx('confirm.region')}</Text><Text style={styles.summaryValue}>{place.region}</Text></> : null}<Text style={styles.summaryLabel}>{tx('confirm.municipality')}</Text><Text style={styles.summaryValue}>{place?.municipality || '—'}</Text><Text style={styles.summaryLabel}>{tx('confirm.origin')}</Text><Text style={styles.summaryValue}>{tx(origin === 'permission_derived' ? 'confirm.device' : 'confirm.manual')}</Text></View><Pressable accessibilityRole="button" onPress={() => setStep('intent')} style={styles.primary}><Text style={styles.primaryText}>{tx('common.continue')}</Text></Pressable><Pressable accessibilityRole="button" onPress={() => setStep('location')} style={styles.secondary}><Text style={styles.secondaryText}>{tx('confirm.change')}</Text></Pressable></>;
  else content = <>{title('intent.title', 'intent.body')}<View style={styles.intentGrid}>{INTENTS.map((intent) => <Pressable key={intent} accessibilityRole="checkbox" accessibilityState={{ checked: intents.includes(intent) }} onPress={() => toggleIntent(intent)} style={[styles.intent, intents.includes(intent) && styles.choiceSelected]}><Text style={[styles.intentText, rtl && styles.rtl]}>{tx(`intent.${intent}`)}</Text>{intents.includes(intent) ? <Ionicons name="checkmark" size={18} color={ACCENT.primary} /> : null}</Pressable>)}</View><Pressable accessibilityRole="button" onPress={() => finish()} style={styles.primary}><Text style={styles.primaryText}>{tx('intent.enter')}</Text></Pressable><Pressable accessibilityRole="button" onPress={() => finish([])} style={styles.secondary}><Text style={styles.secondaryText}>{tx('common.skip')}</Text></Pressable></>;

  return <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>{header}<ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>{content}</ScrollView></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: DEPTH.canvas }, content: { flexGrow: 1, padding: SPACING.xxl, paddingBottom: SPACING.huge, justifyContent: 'center' }, center: { alignItems: 'center', gap: SPACING.lg }, back: { minHeight: 48, paddingHorizontal: SPACING.xl, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }, backText: { ...FONTS.bodyBold, color: TEXT.primary }, mark: { width: 80, height: 80, borderRadius: 40, backgroundColor: ACCENT.soft, borderWidth: 1, borderColor: ACCENT.border, alignItems: 'center', justifyContent: 'center' }, eyebrow: { ...FONTS.captionBold, color: ACCENT.light, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }, hero: { ...FONTS.h1, color: TEXT.primary, textAlign: 'center', maxWidth: 520 }, heading: { marginBottom: SPACING.xxl }, title: { ...FONTS.h1, color: TEXT.primary, marginBottom: SPACING.sm }, body: { ...FONTS.body, color: TEXT.secondary, textAlign: 'center', maxWidth: 560 }, rtl: { writingDirection: 'rtl', textAlign: 'right' }, list: { gap: SPACING.md, marginBottom: SPACING.xxl }, choice: { minHeight: 64, borderWidth: 1, borderColor: BORDER.default, backgroundColor: DEPTH.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, flexDirection: 'row', alignItems: 'center', gap: SPACING.md }, choiceSelected: { borderColor: ACCENT.primary, backgroundColor: ACCENT.soft }, pressed: { opacity: 0.82 }, choiceCopy: { flex: 1 }, choiceTitle: { ...FONTS.bodyBold, color: TEXT.primary }, choiceBody: { ...FONTS.caption, color: TEXT.secondary, marginTop: 2 }, primary: { minHeight: 52, borderRadius: RADIUS.lg, backgroundColor: ACCENT.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.lg, marginTop: SPACING.lg }, primaryText: { ...FONTS.bodyBold, color: TEXT.primary }, secondary: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.sm }, secondaryText: { ...FONTS.bodyBold, color: ACCENT.light }, search: { minHeight: 52, color: TEXT.primary, backgroundColor: DEPTH.surface, borderWidth: 1, borderColor: BORDER.default, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg, ...FONTS.body }, summary: { backgroundColor: DEPTH.surface, borderWidth: 1, borderColor: BORDER.subtle, borderRadius: RADIUS.lg, padding: SPACING.xl, gap: SPACING.xs }, summaryLabel: { ...FONTS.caption, color: TEXT.tertiary, marginTop: SPACING.sm }, summaryValue: { ...FONTS.bodyBold, color: TEXT.primary }, intentGrid: { gap: SPACING.sm }, intent: { minHeight: 48, borderWidth: 1, borderColor: BORDER.default, backgroundColor: DEPTH.surface, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, intentText: { ...FONTS.body, color: TEXT.primary, flex: 1 },
});
