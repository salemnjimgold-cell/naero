import React, { useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import i18n from '../i18n';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'hu', name: 'Magyar', flag: '🇭🇺' },
];

export function LanguageModal({ visible, onClose }) {
  const { t } = useTranslation();
  const { language, setLanguage } = useApp();

  const handleSelect = useCallback(
    (code) => {
      setLanguage(code);
      i18n.changeLanguage(code);
      onClose?.();
    },
    [setLanguage, onClose]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modal}>
              <View style={styles.header}>
                <Text style={styles.title}>{t('language.title')}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.option,
                    language === lang.code && styles.optionActive,
                  ]}
                  onPress={() => handleSelect(lang.code)}
                >
                  <Text style={styles.flag}>{lang.flag}</Text>
                  <Text
                    style={[
                      styles.optionText,
                      language === lang.code && styles.optionTextActive,
                    ]}
                  >
                    {lang.name}
                  </Text>
                  {language === lang.code && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADIUS.xxxl,
    borderTopRightRadius: RADIUS.xxxl,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionActive: {
    backgroundColor: COLORS.primary + '12',
    borderColor: COLORS.primary + '30',
  },
  flag: {
    fontSize: 26,
    marginRight: SPACING.md,
  },
  optionText: {
    ...FONTS.body,
    color: COLORS.textPrimary,
    flex: 1,
  },
  optionTextActive: {
    ...FONTS.bodyBold,
    color: COLORS.primary,
  },
});
