import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme';

export function ManualCityModal({
  visible,
  initialCity = '',
  loading = false,
  onClose,
  onSave,
}) {
  const { t } = useTranslation();
  const [city, setCity] = useState(initialCity);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setCity(initialCity || '');
      setError(null);
    }
  }, [visible, initialCity]);

  const handleSave = async () => {
    const normalized = city.trim().replace(/\s+/g, ' ');
    if (!normalized) {
      setError(t('gate1.manualCity.required'));
      return;
    }
    const result = await onSave(normalized);
    if (result?.error) {
      setError(t('gate1.manualCity.notFound'));
      return;
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons name="location-outline" size={24} color={COLORS.primary} />
            <Text style={styles.title}>{t('gate1.manualCity.title')}</Text>
          </View>
          <Text style={styles.description}>
            {t('gate1.manualCity.description')}
          </Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={(value) => {
              setCity(value);
              setError(null);
            }}
            placeholder={t('gate1.manualCity.placeholder')}
            placeholderTextColor={COLORS.textTertiary}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!loading}
            returnKeyType="done"
            onSubmitEditing={handleSave}
            accessibilityLabel={t('gate1.manualCity.inputLabel')}
          />
          {error && <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">{error}</Text>}
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancel} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>{t('gate1.manualCity.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.save} onPress={handleSave} disabled={loading} accessibilityRole="button" accessibilityLabel={loading ? t('gate1.manualCity.resolving') : t('gate1.manualCity.submit')} accessibilityState={{ disabled: loading, busy: loading }}>
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.saveText}>{t('gate1.manualCity.submit')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  content: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
  },
  description: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  input: {
    ...FONTS.body,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.bgLight,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  error: {
    ...FONTS.caption,
    color: COLORS.error,
    marginTop: SPACING.sm,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  cancel: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  cancelText: {
    ...FONTS.bodyBold,
    color: COLORS.textSecondary,
  },
  save: {
    minWidth: 128,
    minHeight: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  saveText: {
    ...FONTS.bodyBold,
    color: COLORS.white,
  },
});
