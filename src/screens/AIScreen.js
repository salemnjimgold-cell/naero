import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  Keyboard,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS } from '../theme';
import { useApp } from '../context/AppContext';

const LOGO = require('../../assets/branding/naero-logo.png');

const { width } = Dimensions.get('window');

const DAILY_TIPS = [
  { icon: 'sunny-outline', text: 'Register for a tax ID online at ugyfelkapu.hu - it unlocks everything.' },
  { icon: 'bulb-outline', text: 'Always carry your residence permit. Police may ask for ID anytime.' },
  { icon: 'happy-outline', text: 'Budapest has free walking tours every morning from Vorosmarty ter.' },
  { icon: 'shield-checkmark-outline', text: 'Emergency number 112 works across all EU countries.' },
  { icon: 'restaurant-outline', text: 'Try langos - fried dough with sour cream and cheese. A must!' },
];

const QUICK_ACTIONS = [
  { id: 'residency', icon: 'document-text-outline', label: 'Residency', color: COLORS.primary },
  { id: 'housing', icon: 'home-outline', label: 'Housing', color: COLORS.secondary },
  { id: 'jobs', icon: 'briefcase-outline', label: 'Jobs', color: COLORS.accent },
  { id: 'translate', icon: 'language-outline', label: 'Translate', color: COLORS.purple },
  { id: 'healthcare', icon: 'medkit-outline', label: 'Healthcare', color: COLORS.error },
  { id: 'safety', icon: 'shield-checkmark-outline', label: 'Safety', color: COLORS.warning },
  { id: 'transport', icon: 'bus-outline', label: 'Transport', color: COLORS.info },
  { id: 'food', icon: 'restaurant-outline', label: 'Food', color: COLORS.secondary },
];

export default function AIScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const { getAIEngine, refreshAIProfile, language, userLocation, userCity, hasLocationPermission } = useApp();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [aiReady, setAiReady] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState({ source: '', gemini: false, model: 'gemini-2.0-flash' });
  const flatListRef = useRef(null);
  const thinkingDots = useRef(new Animated.Value(0)).current;
  const scrollTimeout = useRef(null);

  const initChat = useCallback(async () => {
    const engine = getAIEngine();
    if (!engine.isReady()) await engine.init();
    engine.setLocation(userLocation, userCity);
    setAiReady(true);
    const geminiActive = engine.isGeminiActive ? engine.isGeminiActive() : false;
    setDebugInfo((p) => ({ ...p, gemini: geminiActive }));
    const greeting = await engine.processMessage('hello', language);
    setDebugInfo((p) => ({ ...p, source: greeting.source || 'local', time: new Date().toLocaleTimeString() }));
    setMessages([
      { id: 'welcome', role: 'assistant', content: greeting.response },
    ]);
  }, [getAIEngine, language, userLocation, userCity]);

  useEffect(() => {
    initChat();
  }, [initChat]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % DAILY_TIPS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      scheduleScroll();
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!isThinking) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(thinkingDots, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(thinkingDots, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isThinking]);

  const scheduleScroll = useCallback(() => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 80);
  }, []);

  const scrollToEndImmediate = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: false });
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);
  }, []);

  const handleSend = useCallback(
    async (text) => {
      const msg = text || input.trim();
      if (!msg || isThinking || !aiReady) return;

      const userMsg = { id: Date.now().toString(), role: 'user', content: msg };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsThinking(true);
      scheduleScroll();

      const engine = getAIEngine();
      engine.setLocation(userLocation, userCity);
      const result = await engine.processMessage(msg, language);
      refreshAIProfile();

      setDebugInfo({
        source: result.source || 'unknown',
        gemini: engine.isGeminiActive ? engine.isGeminiActive() : false,
        model: 'gemini-2.0-flash',
        time: new Date().toLocaleTimeString(),
      });

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.response,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsThinking(false);
      scheduleScroll();
    },
    [input, isThinking, aiReady, getAIEngine, refreshAIProfile, language, scheduleScroll, userLocation, userCity]
  );

  const handleQuickAction = useCallback(
    (actionId) => {
      const action = QUICK_ACTIONS.find((a) => a.id === actionId);
      if (!action) return;
      setInput('');
      handleSend('Tell me about ' + action.label);
    },
    [handleSend]
  );

  const clearChat = useCallback(() => {
    getAIEngine().reset();
    setDebugInfo({ source: '', gemini: false, model: 'gemini-2.0-flash' });
    initChat();
  }, [getAIEngine, initChat]);

  const showWelcome = messages.length <= 1 && !isThinking;

  const dotOpacity = thinkingDots.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 1],
  });

  const inputPaddingBottom = Math.max(SPACING.lg, insets.bottom + 6);

  const renderMessage = ({ item }) => (
    <View style={[styles.messageRow, item.role === 'user' ? styles.userRow : styles.aiRow]}>
      {item.role === 'assistant' && (
        <View style={styles.aiAvatarSm}>
          <Image source={LOGO} style={{ width: 22, height: 22 }} resizeMode="contain" />
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          item.role === 'user' ? styles.userBubble : styles.aiBubble,
        ]}
      >
        <Text style={[styles.messageText, item.role === 'user' && styles.userText]}>
          {item.content}
        </Text>
      </View>
    </View>
  );

  const renderWelcome = () => (
    <View style={styles.welcomeWrap}>
      <View style={styles.tipBanner}>
        <Ionicons name={DAILY_TIPS[tipIndex].icon} size={15} color={COLORS.warning} />
        <Text style={styles.tipText}>{DAILY_TIPS[tipIndex].text}</Text>
      </View>

      <View style={styles.mascotSection}>
        <Image source={LOGO} style={{ width: 96, height: 96 }} resizeMode="contain" />
      </View>
      <Text style={styles.welcomeTitle}>Naero AI</Text>
      <Text style={styles.welcomeSub}>{t('ai.subtitle')}</Text>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>How can I help?</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.quickGrid}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.quickChip}
            onPress={() => handleQuickAction(action.id)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[action.color + '18', action.color + '06']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.quickChipInner}
            >
              <Ionicons name={action.icon} size={18} color={action.color} />
              <Text style={[styles.quickChipLabel, { color: action.color }]}>
                {action.label}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(6,182,212,0.06)', COLORS.bg]}
        style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.canGoBack() && navigation.goBack()}
            style={styles.headerBtn}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerAvatar}>
            <Image source={LOGO} style={{ width: 28, height: 28 }} resizeMode="contain" />
            <View style={[styles.onlineDot, { backgroundColor: debugInfo.gemini ? COLORS.success : COLORS.warning }]} />
          </View>
          <TouchableOpacity
            style={{ flex: 1 }}
            onLongPress={() => setShowDebug((p) => !p)}
            delayLongPress={2000}
          >
            <Text style={styles.headerTitle}>Naero AI</Text>
            <Text style={styles.headerSub}>
              {isThinking ? 'Thinking...' : (debugInfo.gemini ? 'Gemini AI - Online' : 'AI Assistant')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={clearChat} style={styles.headerBtn}>
            <Ionicons name="refresh-outline" size={20} color={COLORS.textTertiary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={
          showWelcome
            ? [styles.welcomeList, { paddingBottom: keyboardHeight > 0 ? keyboardHeight : 0 }]
            : [styles.chatList, { paddingBottom: keyboardHeight > 0 ? keyboardHeight + SPACING.sm : SPACING.sm }]
        }
        onContentSizeChange={scheduleScroll}
        onLayout={scrollToEndImmediate}
        ListHeaderComponent={showWelcome ? renderWelcome : null}
        ListFooterComponent={
          isThinking && !showWelcome ? (
            <View style={[styles.messageRow, styles.aiRow]}>
              <View style={styles.aiAvatarSm}>
                <Image source={LOGO} style={{ width: 22, height: 22 }} resizeMode="contain" />
              </View>
              <View style={[styles.messageBubble, styles.aiBubble]}>
                <View style={styles.thinkingRow}>
                  <Animated.View style={[styles.thinkDot, { opacity: dotOpacity }]} />
                  <Animated.View
                    style={[styles.thinkDot, { opacity: dotOpacity, marginLeft: 5 }]}
                  />
                  <Animated.View
                    style={[styles.thinkDot, { opacity: dotOpacity, marginLeft: 5 }]}
                  />
                </View>
              </View>
            </View>
          ) : null
        }
      />

      <View
        style={[
          styles.inputContainer,
          { paddingBottom: keyboardHeight > 0 ? keyboardHeight + inputPaddingBottom : inputPaddingBottom },
        ]}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask me anything about your new home..."
            placeholderTextColor={COLORS.textTertiary}
            multiline
            maxLength={500}
            onSubmitEditing={() => handleSend()}
            blurOnSubmit
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isThinking) && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!input.trim() || isThinking}
          >
            <LinearGradient
              colors={GRADIENTS.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendGradient}
            >
              <Ionicons name="arrow-up" size={20} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <Text style={styles.disclaimer}>
          Naero AI can make mistakes. Verify important information.
        </Text>
      </View>
      {showDebug && (
        <View style={styles.debugOverlay}>
          <Text style={styles.debugTitle}>Naero AI Debug</Text>
          <Text style={styles.debugText}>Source: {debugInfo.source || 'idle'}</Text>
          <Text style={styles.debugText}>Gemini: {debugInfo.gemini ? 'ACTIVE' : 'FALLBACK'}</Text>
          <Text style={styles.debugText}>Model: {debugInfo.model}</Text>
          <Text style={styles.debugText}>Time: {debugInfo.time || '-'}</Text>
          <Text style={styles.debugText}>Messages: {messages.length}</Text>
          <TouchableOpacity
            onPress={() => setShowDebug(false)}
            style={styles.debugClose}
          >
            <Text style={{ color: COLORS.textPrimary, fontWeight: '700' }}>Close</Text>
          </TouchableOpacity>
        </View>
      )}
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
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatar: {
    position: 'relative',
    marginRight: SPACING.xs,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
  headerTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
  },
  headerSub: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginTop: 1,
  },

  welcomeList: {
    flexGrow: 1,
  },
  welcomeWrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
    width: '100%',
  },
  tipText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    flex: 1,
  },
  mascotSection: {
    marginBottom: SPACING.md,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  welcomeSub: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xl,
    width: '100%',
    gap: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.cardBorder,
  },
  dividerText: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'center',
    paddingBottom: SPACING.xxl,
  },
  quickChip: {
    width: (width - SPACING.xl * 2 - SPACING.sm) / 2 - SPACING.sm / 2,
  },
  quickChipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  quickChipLabel: {
    ...FONTS.captionBold,
  },

  chatList: {
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    maxWidth: '88%',
  },
  aiRow: {
    alignSelf: 'flex-start',
  },
  userRow: {
    alignSelf: 'flex-end',
  },
  aiAvatarSm: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    marginTop: 2,
    overflow: 'hidden',
  },
  messageBubble: {
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  aiBubble: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  userBubble: {
    backgroundColor: COLORS.primary + '18',
    borderTopRightRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.primary + '25',
  },
  messageText: {
    ...FONTS.body,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  userText: {
    color: COLORS.textPrimary,
  },

  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  thinkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },

  inputContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    maxHeight: 100,
    ...FONTS.body,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendGradient: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disclaimer: {
    ...FONTS.small,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  debugOverlay: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.92)',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + '50',
    zIndex: 1000,
    elevation: 20,
  },
  debugTitle: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  debugText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
    lineHeight: 18,
  },
  debugClose: {
    marginTop: SPACING.sm,
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 20,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
});
