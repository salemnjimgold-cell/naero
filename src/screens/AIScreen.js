import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  TextInput as RNTextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  Keyboard,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import Text from '../components/Text';
import IconButton from '../components/IconButton';
import { useApp } from '../context/AppContext';
import { naeroAI, trackAIRequest, isAuthenticated as checkAuth } from '../services';

const LOGO = require('../../assets/branding/naero-logo.png');

const QUICK_ACTIONS = [
  { id: 'residency', icon: 'document-text-outline', label: 'Residency' },
  { id: 'housing', icon: 'home-outline', label: 'Housing' },
  { id: 'jobs', icon: 'briefcase-outline', label: 'Jobs' },
  { id: 'translate', icon: 'language-outline', label: 'Translate' },
];

export default function AIScreen({ navigation }) {
  const { t } = useTranslation();
  const { getAIEngine, refreshAIProfile, language, userLocation, userCity, hasLocationPermission, isAuthenticated } = useApp();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [aiReady, setAiReady] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState({ source: '', provider: '', model: 'gpt-4o', ragEnabled: false, method: '', url: '', statusCode: '', responseBody: '' });
  const [ragEnabled, setRagEnabled] = useState(false);
  const flatListRef = useRef(null);
  const thinkingDots = useRef(new Animated.Value(0)).current;
  const scrollTimeout = useRef(null);
  const conversationIdRef = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      initChat();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
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

  const initChat = useCallback(async () => {
    setAiReady(true);

    if (!checkAuth()) {
      setMessages([{ id: 'welcome', role: 'assistant', content: 'Welcome to Naero AI! Sign in to access the full AI experience with knowledge retrieval and tool calling.' }]);
      return;
    }

    const conv = await naeroAI.ensureConversation();
    if (conv) {
      const dbg = conv._debug || {};
      setDebugInfo((p) => ({ ...p, method: dbg.method, url: dbg.url, statusCode: dbg.status, responseBody: dbg.response ? JSON.stringify(dbg.response).slice(0, 300) : null, time: new Date().toLocaleTimeString() }));
      if (conv.error) {
        setDebugInfo((p) => ({ ...p, error: `Conversation init failed (${conv.status || '?'}): ${conv.error.message || conv.error}`, time: new Date().toLocaleTimeString() }));
        return;
      }
      conversationIdRef.current = conv.id;
    }
    setMessages([{ id: 'welcome', role: 'assistant', content: 'Hi! I\'m Naero AI. How can I help you with your journey?' }]);
  }, []);

  const scheduleScroll = useCallback(() => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 80);
  }, []);

  const handleSend = useCallback(
    async (text) => {
      const msg = text || input.trim();
      if (!msg || isThinking || !aiReady) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const userMsg = { id: Date.now().toString(), role: 'user', content: msg };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsThinking(true);
      scheduleScroll();

      trackAIRequest('gpt-4o', 'naero', null);

      try {
        const result = await naeroAI.sendMessage(msg, {
          conversationId: conversationIdRef.current,
          ragEnabled,
          topic: null,
        });

        const dbg = result._debug || {};
        setDebugInfo({
          source: result.data ? 'backend' : 'error',
          provider: result.ragMetrics ? 'naero-rag' : 'naero',
          model: 'gpt-4o',
          ragEnabled,
          time: new Date().toLocaleTimeString(),
          method: dbg.method,
          url: dbg.url,
          statusCode: dbg.status,
          responseBody: dbg.response ? JSON.stringify(dbg.response).slice(0, 300) : null,
          error: result.error ? `[${result.error.code || 'ERR'}] ${result.error.message || JSON.stringify(result.error)}` : null,
        });

        if (result.data) {
          const content = result.data.message?.content || result.data.content || '';
          const aiMsg = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content,
            sourceType: result.ragMetrics ? 'knowledge' : null,
            provider: result.ragMetrics ? 'Naero Knowledge' : 'Naero AI',
          };
          setMessages((prev) => [...prev, aiMsg]);
          conversationIdRef.current = result.conversationId;
        } else {
          const errMsg = { id: (Date.now() + 1).toString(), role: 'assistant', content: result.error?.message || 'Sorry, something went wrong. Try again.' };
          setMessages((prev) => [...prev, errMsg]);
        }
      } catch (err) {
        const errMsg = { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Sorry, I couldn\'t reach the server. Please check your connection.' };
        setMessages((prev) => [...prev, errMsg]);
      }

      setIsThinking(false);
      scheduleScroll();
    },
    [input, isThinking, aiReady, scheduleScroll, ragEnabled]
  );

  const handleQuickAction = useCallback(
    (actionId) => {
      Haptics.selectionAsync().catch(() => {});
      const action = QUICK_ACTIONS.find((a) => a.id === actionId);
      if (!action) return;
      setInput('');
      handleSend('Tell me about ' + action.label);
    },
    [handleSend]
  );

  const handleSuggestedPrompt = useCallback(
    (prompt) => {
      Haptics.selectionAsync().catch(() => {});
      setInput('');
      handleSend(prompt);
    },
    [handleSend]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    conversationIdRef.current = null;
    naeroAI.reset();
    initChat();
  }, [initChat]);

  const showWelcome = messages.length <= 1 && !isThinking;

  const dotOpacity = thinkingDots.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 1],
  });

  const inputPaddingBottom = Math.max(SPACING.lg, insets.bottom + 6);

  const getStatusText = () => {
    if (isThinking) return t('ai.thinking');
    if (!isAuthenticated) return 'Guest Mode';
    return 'Ready';
  };

  const renderSourceBadge = (sourceType) => {
    if (!sourceType) return null;
    return (
      <View style={styles.sourceBadge}>
        <Ionicons name="book-outline" size={10} color={COLORS.primary} />
        <Text variant="small" color="tertiary" style={styles.sourceBadgeText}>
          {sourceType === 'knowledge' ? 'Knowledge' : 'AI'}
        </Text>
      </View>
    );
  };

  const renderMessage = ({ item }) => {
    if (item.id === 'welcome' && showWelcome) return null;
    return (
      <View style={[styles.messageRow, item.role === 'user' ? styles.userRow : styles.aiRow]}>
        {item.role === 'assistant' && (
          <View style={styles.aiAvatarSm}>
            <Image source={LOGO} style={{ width: 20, height: 20 }} resizeMode="contain" />
          </View>
        )}
        <View style={styles.messageContent}>
          <View
            style={[
              styles.messageBubble,
              item.role === 'user' ? styles.userBubble : styles.aiBubble,
            ]}
          >
            <Text variant="body" color={item.role === 'user' ? 'primary' : 'primary'}>
              {item.content}
            </Text>
          </View>
          {item.role === 'assistant' && renderSourceBadge(item.sourceType)}
        </View>
      </View>
    );
  };

  const renderWelcome = () => {
    const examples = t('ai.examples', { returnObjects: true }) || [];
    return (
      <View style={styles.welcomeWrap}>
        <View style={styles.welcomeLogoWrap}>
          <Image source={LOGO} style={{ width: 48, height: 48 }} resizeMode="contain" />
        </View>
        <Text variant="h2" color="primary" align="center" style={styles.welcomeTitle}>
          {t('ai.title')}
        </Text>
        <Text variant="body" color="secondary" align="center" style={styles.welcomeSub}>
          {t('ai.subtitle')}
        </Text>

        {Array.isArray(examples) && examples.length > 0 && (
          <View style={styles.suggestedSection}>
            <Text variant="smallBold" color="tertiary" style={styles.suggestedLabel}>
              Try asking
            </Text>
            <View style={styles.suggestedGrid}>
              {examples.slice(0, 4).map((prompt, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.suggestedChip}
                  onPress={() => handleSuggestedPrompt(prompt)}
                  activeOpacity={0.7}
                >
                  <View style={styles.suggestedChipIcon}>
                    <Ionicons
                      name={['document-text-outline', 'home-outline', 'briefcase-outline', 'language-outline'][idx % 4]}
                      size={14}
                      color={COLORS.primary}
                    />
                  </View>
                  <Text variant="caption" color="secondary" style={styles.suggestedChipText} numberOfLines={2}>
                    {prompt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text variant="smallBold" color="tertiary">
            Quick Topics
          </Text>
          <View style={styles.dividerLine} />
        </View>

        {isAuthenticated && (
          <View style={styles.ragToggleRow}>
            <View style={styles.ragToggleInfo}>
              <Ionicons name="search-outline" size={16} color={COLORS.textSecondary} />
              <Text variant="caption" color="secondary" style={{ marginLeft: SPACING.sm }}>
                Knowledge Search
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.ragToggleSwitch, ragEnabled && styles.ragToggleSwitchActive]}
              onPress={() => setRagEnabled((p) => !p)}
              activeOpacity={0.7}
            >
              <View style={[styles.ragToggleThumb, ragEnabled && styles.ragToggleThumbActive]} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickChip}
              onPress={() => handleQuickAction(action.id)}
              activeOpacity={0.7}
            >
              <Ionicons name={action.icon} size={18} color={COLORS.textSecondary} />
              <Text variant="caption" color="secondary" style={styles.quickChipLabel}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <View style={styles.headerRow}>
          <IconButton
            icon="chevron-back"
            size={20}
            color={COLORS.textPrimary}
            containerSize={36}
            onPress={() => navigation.canGoBack() && navigation.goBack()}
          />
          <View style={styles.headerAvatar}>
            <Image source={LOGO} style={{ width: 24, height: 24 }} resizeMode="contain" />
            <View style={styles.onlineDot} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="h3" color="primary">
              {t('ai.title')}
            </Text>
            <Text variant="small" color={isThinking ? 'brand' : 'tertiary'} style={{ marginTop: 1 }}>
              {getStatusText()}
            </Text>
          </View>
          <IconButton
            icon="refresh-outline"
            size={18}
            color={COLORS.textTertiary}
            containerSize={36}
            onPress={clearChat}
          />
        </View>
      </View>

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
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListHeaderComponent={showWelcome ? renderWelcome : null}
        ListFooterComponent={
          isThinking && !showWelcome ? (
            <View style={[styles.messageRow, styles.aiRow]}>
              <View style={styles.aiAvatarSm}>
                <Image source={LOGO} style={{ width: 20, height: 20 }} resizeMode="contain" />
              </View>
              <View style={[styles.messageBubble, styles.aiBubble]}>
                <View style={styles.thinkingRow}>
                  <Animated.View style={[styles.thinkDot, { opacity: dotOpacity }]} />
                  <Animated.View style={[styles.thinkDot, { opacity: dotOpacity, marginLeft: 5 }]} />
                  <Animated.View style={[styles.thinkDot, { opacity: dotOpacity, marginLeft: 5 }]} />
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
          <RNTextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={t('ai.placeholder')}
            placeholderTextColor={COLORS.textTertiary}
            multiline
            maxLength={500}
            onSubmitEditing={() => handleSend()}
            blurOnSubmit
            selectionColor={COLORS.primary}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isThinking) && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!input.trim() || isThinking}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-up" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <Text variant="small" color="muted" align="center" style={styles.disclaimer}>
          Naero AI can make mistakes. Verify important information.
        </Text>
      </View>

      {__DEV__ && showDebug && (
        <View style={styles.debugOverlay}>
          <Text variant="smallBold" color="brand" style={styles.debugTitle}>
            Naero AI Debug
          </Text>
          <Text variant="small" color="secondary">Source: {debugInfo.source || 'idle'}</Text>
          <Text variant="small" color="secondary">Provider: {debugInfo.provider || '-'}</Text>
          <Text variant="small" color="secondary">Model: {debugInfo.model}</Text>
          <Text variant="small" color="secondary">RAG: {debugInfo.ragEnabled ? 'ON' : 'OFF'}</Text>
          <Text variant="small" color="secondary">Time: {debugInfo.time || '-'}</Text>
          <Text variant="small" color="secondary">Messages: {messages.length}</Text>
          {debugInfo.method && <Text variant="small" color="secondary">Req: {debugInfo.method} {debugInfo.url}</Text>}
          {debugInfo.statusCode && <Text variant="small" color="secondary">Status: {debugInfo.statusCode}</Text>}
          {debugInfo.responseBody && <Text variant="small" color="warning">Response: {debugInfo.responseBody}</Text>}
          {debugInfo.error && <Text variant="small" color="error">Error: {debugInfo.error}</Text>}
          <TouchableOpacity onPress={() => setShowDebug(false)} style={styles.debugClose}>
            <Text variant="captionBold" color="primary">Close</Text>
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
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    backgroundColor: COLORS.bg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerAvatar: {
    position: 'relative',
    marginRight: SPACING.xs,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    borderWidth: 1.5,
    borderColor: COLORS.bg,
  },

  welcomeList: {
    flexGrow: 1,
  },
  welcomeWrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl,
  },
  welcomeLogoWrap: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  welcomeTitle: {
    marginBottom: 4,
  },
  welcomeSub: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xxl,
  },

  suggestedSection: {
    width: '100%',
    marginBottom: SPACING.xl,
  },
  suggestedLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  suggestedGrid: {
    gap: SPACING.sm,
  },
  suggestedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.card,
    gap: SPACING.md,
  },
  suggestedChipIcon: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestedChipText: {
    flex: 1,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    width: '100%',
    gap: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.cardBorder,
  },

  ragToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.lg,
    width: '100%',
  },
  ragToggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ragToggleSwitch: {
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  ragToggleSwitchActive: {
    backgroundColor: COLORS.primary + '40',
  },
  ragToggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.textTertiary,
  },
  ragToggleThumbActive: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-end',
  },

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'center',
    paddingBottom: SPACING.xxl,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.card,
    minWidth: 140,
    justifyContent: 'center',
  },
  quickChipLabel: {
    fontWeight: '500',
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
  messageContent: {
    flex: 1,
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
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  messageBubble: {
    borderRadius: RADIUS.md,
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
    backgroundColor: COLORS.primary + '10',
    borderTopRightRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    marginLeft: 2,
    gap: 4,
  },
  sourceBadgeText: {
    fontSize: 10,
    letterSpacing: 0.3,
  },

  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  thinkDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
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
    borderRadius: RADIUS.md,
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
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  disclaimer: {
    marginTop: SPACING.sm,
    marginBottom: 2,
  },
  debugOverlay: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.92)',
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
    zIndex: 1000,
    elevation: 20,
    gap: 3,
  },
  debugTitle: {
    marginBottom: 6,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
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
