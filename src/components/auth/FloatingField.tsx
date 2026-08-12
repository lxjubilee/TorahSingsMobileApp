import React, { useRef, useState } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authPalette as C } from './authPalette';
import { useAuthScroll } from './AuthScrollContext';

/**
 * Switches off every platform's autofill for a field. Each piece is load-bearing:
 *  - `autoComplete: 'off'`        — Android's autofill service and the keyboard's
 *                                   saved-value strip.
 *  - `textContentType: 'none'`    — iOS keychain suggestions and the QuickType
 *                                   password bar, which `secureTextEntry` alone
 *                                   still triggers.
 *  - `importantForAutofill: 'no'` — tells Android's framework not to even offer
 *                                   the field to an autofill provider.
 * Spread it last so it wins over anything set earlier on the same field.
 */
export const autofillOff = {
  autoComplete: 'off',
  textContentType: 'none',
  importantForAutofill: 'no',
  autoCorrect: false,
  spellCheck: false,
} as const satisfies Partial<TextInputProps>;

interface FloatingFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  /** Ionicon shown at the right edge; tapping it fires `onAdornmentPress`. */
  adornment?: React.ComponentProps<typeof Ionicons>['name'];
  onAdornmentPress?: () => void;
  adornmentLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * The web's `.field`: a bordered input whose label sits *on* the top border,
 * notched out with a panel-coloured background. Focus swaps the border to the
 * brighter gold. The right adornment slot holds the password eye or the date
 * picker's calendar glyph — both 18px `#e0b766` on the web.
 */
export const FloatingField: React.FC<FloatingFieldProps> = ({
  label,
  adornment,
  onAdornmentPress,
  adornmentLabel,
  style,
  onFocus,
  onBlur,
  editable = true,
  ...inputProps
}) => {
  const [focused, setFocused] = useState(false);
  // Measured by AuthShell so a focused field can be scrolled clear of the keyboard.
  const wrapRef = useRef<View>(null);
  const { onFieldFocus, onFieldBlur } = useAuthScroll();

  return (
    // collapsable={false} keeps Android from optimising this View out of the
    // native tree — a collapsed view can't be measured, so the scroll-clear-of-
    // the-keyboard logic in AuthShell would silently do nothing.
    <View ref={wrapRef} collapsable={false} style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...inputProps}
        editable={editable}
        placeholderTextColor={C.placeholder}
        onFocus={(e) => {
          setFocused(true);
          onFieldFocus(wrapRef.current);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onFieldBlur(wrapRef.current);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          focused && styles.inputFocused,
          !editable && styles.inputReadOnly,
          !!adornment && styles.inputWithAdornment,
        ]}
      />
      {adornment ? (
        <Pressable
          style={styles.adornment}
          onPress={onAdornmentPress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={adornmentLabel}
        >
          <Ionicons name={adornment} size={18} color={C.adornment} />
        </Pressable>
      ) : null}
    </View>
  );
};

/**
 * Same chrome as `FloatingField` but wrapping arbitrary content instead of a
 * `TextInput` — used by the date-of-birth field, which opens a picker rather
 * than accepting keystrokes.
 */
export const FloatingPressable: React.FC<{
  label: string;
  adornment?: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}> = ({ label, adornment, onPress, children, style }) => (
  <View style={[styles.field, style]}>
    <Text style={styles.label}>{label}</Text>
    <Pressable style={[styles.input, styles.inputRow]} onPress={onPress}>
      {children}
      {adornment ? <Ionicons name={adornment} size={18} color={C.adornment} /> : null}
    </Pressable>
  </View>
);

export const floatingFieldStyles = StyleSheet.create({
  /** Row wrapper for the side-by-side First/Last name pair (`.nameRow`). */
  nameRow: { flexDirection: 'row', gap: 14 },
  nameCol: { flex: 1 },
});

const styles = StyleSheet.create({
  field: { marginBottom: 18 },
  // Sits ON the border line, with the panel colour behind it punching a gap.
  label: {
    position: 'absolute',
    top: -8,
    left: 12,
    zIndex: 1,
    paddingHorizontal: 6,
    backgroundColor: C.panel,
    fontSize: 12,
    color: C.label,
  },
  input: {
    width: '100%',
    paddingTop: 15,
    paddingBottom: 14,
    paddingLeft: 14,
    paddingRight: 14,
    borderWidth: 1.5,
    borderColor: C.fieldBorder,
    borderRadius: 8,
    backgroundColor: 'transparent',
    color: '#fff',
    fontSize: 14,
  },
  inputWithAdornment: { paddingRight: 44 },
  inputFocused: { borderColor: C.fieldBorderFocus },
  inputReadOnly: { opacity: 0.7 },
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  adornment: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
});
