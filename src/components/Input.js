import React from 'react';
import { View, TextInput as RNTextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER, FONTS, RADIUS, SPACING } from '../theme';
import Text from './Text';

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  error,
  secureTextEntry = false,
  keyboardType,
  autoCapitalize,
  autoCorrect,
  multiline = false,
  numberOfLines,
  disabled = false,
  style,
  inputStyle,
}) {
  const [focused, setFocused] = React.useState(false);
  const [showSecure, setShowSecure] = React.useState(false);

  const isSecure = secureTextEntry && !showSecure;

  return (
    <View style={style}>
      {label && (
        <Text variant="captionBold" color="secondary" style={styles.label}>
          {label}
        </Text>
      )}
      <View style={[
        styles.wrap,
        focused && styles.wrapFocused,
        error && styles.wrapError,
        multiline && styles.wrapMultiline,
      ]}>
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={error ? COLORS.error : focused ? COLORS.primary : COLORS.textTertiary}
            style={styles.icon}
          />
        )}
        <RNTextInput
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textTertiary}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={!disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          selectionColor={COLORS.primary}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowSecure(!showSecure)} style={styles.eye}>
            <Ionicons
              name={showSecure ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={COLORS.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text variant="caption" color="error" style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BORDER.ghost,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  wrapFocused: {
    borderColor: COLORS.primary,
  },
  wrapError: {
    borderColor: COLORS.error,
  },
  wrapMultiline: {
    height: undefined,
    minHeight: 100,
    paddingVertical: SPACING.md,
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: SPACING.md,
  },
  input: {
    flex: 1,
    ...FONTS.body,
    color: COLORS.textPrimary,
    padding: 0,
    height: 52,
  },
  inputMultiline: {
    height: undefined,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  eye: {
    paddingLeft: SPACING.sm,
  },
  errorText: {
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
});
