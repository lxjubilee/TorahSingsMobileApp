import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { AUTH_CONTENT_WIDTH, authPalette as C } from './authPalette';
import { AuthScrollProvider } from './AuthScrollContext';

/** Breathing room left between a focused field and the top of the keyboard. */
const KEYBOARD_GAP = 16;

interface AuthShellProps {
  /** Green notice banner above the form (`.info`). */
  info?: string | null;
  /** Red alert banner above the form (`.error`). */
  error?: string | null;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  children: React.ReactNode;
}

/**
 * The chrome every phase of the one-door flow sits inside: the gold hairline at
 * the top, the warm panel, the circular brand mark, the info/error banners and
 * the legal footer. Ports `.topbar` / `.panel` / `.inner` / `.brandLink` /
 * `.avatar` / `.brand` / `.info` / `.error` / `.foot`.
 *
 * The web's right-hand scripture slideshow (`AuthHero`) is intentionally absent:
 * the stylesheet hides it under 820px, so a phone only ever sees this panel.
 */
export const AuthShell: React.FC<AuthShellProps> = ({
  info,
  error,
  onOpenTerms,
  onOpenPrivacy,
  children,
}) => {
  const { t } = useTranslation();

  const scrollRef = useRef<ScrollView>(null);
  /** Wraps the ScrollView so its on-screen frame can be measured. */
  const viewportRef = useRef<View>(null);
  /** Current scroll offset — `scrollTo` needs an absolute position. */
  const offsetRef = useRef(0);
  const focusedRef = useRef<View | null>(null);
  const keyboardRef = useRef(0);
  // iOS overlays the keyboard, so the scroll needs matching bottom padding.
  // Android resizes the window instead, so it stays 0 there.
  const [keyboardPad, setKeyboardPad] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  /**
   * Scroll the focused field clear of the keyboard, if it's covered.
   *
   * Neither platform does this on its own: Android's `adjustResize` shrinks the
   * window but leaves the scroll position alone, and iOS just overlays.
   *
   * Both the viewport and the field are measured with `measureInWindow`, so they
   * share a coordinate space and no assumption is needed about status bars or
   * whether `Dimensions` tracked the resize. That matters: on Android
   * `Dimensions.get('window')` ALREADY reports the shrunken height, so
   * subtracting the keyboard from it double-counts and over-scrolls the form.
   */
  const ensureVisible = useCallback(() => {
    const node = focusedRef.current;
    const viewport = viewportRef.current;
    if (!node || !viewport || keyboardRef.current <= 0) return;

    viewport.measureInWindow((_vx, vy, _vw, vh) => {
      if (!Number.isFinite(vy) || !Number.isFinite(vh) || vh <= 0) return;
      // Android's adjustResize already shrank the viewport past the keyboard;
      // iOS's sits underneath it, so take the keyboard off there.
      const visibleBottom = vy + vh - (Platform.OS === 'ios' ? keyboardRef.current : 0);

      node.measureInWindow((_x, y, _w, h) => {
        if (!Number.isFinite(y) || !Number.isFinite(h)) return;
        const overlap = y + h + KEYBOARD_GAP - visibleBottom;
        if (overlap > 0) {
          scrollRef.current?.scrollTo({ y: offsetRef.current + overlap, animated: true });
        }
      });
    });
  }, []);

  useEffect(() => {
    // `will*` on iOS fires before the animation so the scroll rides along with
    // it; Android only emits `did*`.
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const show = Keyboard.addListener(showEvent, (e) => {
      keyboardRef.current = e.endCoordinates.height;
      setKeyboardOpen(true);
      // Android resizes the window instead of overlaying, so the scroll view has
      // already shrunk and needs no extra padding.
      if (Platform.OS === 'ios') setKeyboardPad(e.endCoordinates.height);
      ensureVisible();
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      keyboardRef.current = 0;
      setKeyboardOpen(false);
      setKeyboardPad(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [ensureVisible]);

  /**
   * Android finishes its `adjustResize` relayout *after* `keyboardDidShow`, so
   * the measurement taken there is of the pre-resize viewport. This fires once
   * the new frame lands, which is the reliable moment to correct the scroll.
   */
  const onViewportLayout = useCallback(() => {
    if (keyboardRef.current > 0) ensureVisible();
  }, [ensureVisible]);

  const onFieldFocus = useCallback(
    (node: View | null) => {
      focusedRef.current = node;
      // On the first tap the keyboard isn't up yet — the show listener handles
      // that. On a tap between fields it already is, so scroll now.
      if (keyboardRef.current > 0) requestAnimationFrame(ensureVisible);
    },
    [ensureVisible],
  );

  const onFieldBlur = useCallback((node: View | null) => {
    if (focusedRef.current === node) focusedRef.current = null;
  }, []);

  // Stable identity so every field doesn't re-render on each shell render.
  const scrollValue = useMemo(
    () => ({ onFieldFocus, onFieldBlur }),
    [onFieldFocus, onFieldBlur],
  );

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offsetRef.current = e.nativeEvent.contentOffset.y;
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={C.topbarGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topbar}
      />
      {/* No KeyboardAvoidingView: on iOS its padding would double up with the
          bottom padding below, and on Android `adjustResize` already shrinks the
          window. The scroll padding plus `ensureVisible` covers both. */}
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* collapsable={false} keeps Android from optimising this View out of the
            native tree, which would make measureInWindow return nothing. */}
        <View
          ref={viewportRef}
          collapsable={false}
          style={styles.safe}
          onLayout={onViewportLayout}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[
              styles.scroll,
              // With the keyboard up the form is taller than the space left, so
              // stop centring — otherwise the top of a long form is pushed off.
              keyboardOpen && styles.scrollKeyboardOpen,
              { paddingBottom: 24 + keyboardPad },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            // Long forms (the create-account phase especially) run well past the
            // fold once the keyboard is up — show the bar so that's discoverable.
            showsVerticalScrollIndicator={keyboardOpen}
            indicatorStyle="white"
            onScroll={onScroll}
            scrollEventThrottle={16}
          >
            <View style={styles.inner}>
              {/* The brand mark is a lot of vertical real estate on a long form —
                  shrink it while the keyboard is up so the fields get the space. */}
              <Image
                source={require('../../../assets/zev-logo.png')}
                style={[styles.avatar, keyboardOpen && styles.avatarCompact]}
                resizeMode="cover"
              />
              <Text
                allowFontScaling={false}
                style={[styles.brand, keyboardOpen && styles.brandCompact]}
              >
                <Text style={styles.brandWhite}>Torah</Text>
                <Text style={styles.brandGold}>Sings</Text>
                <Text style={styles.brandWhite}>.com</Text>
              </Text>

              {info ? <Text style={styles.info}>{info}</Text> : null}
              {error ? (
                <Text style={styles.error} accessibilityRole="alert">
                  {error}
                </Text>
              ) : null}

              <AuthScrollProvider value={scrollValue}>{children}</AuthScrollProvider>

              <Text style={styles.foot}>
                {t('auth.foot', { year: new Date().getFullYear() })}
                {'  |  '}
                <Text style={styles.footLink} onPress={onOpenTerms}>
                  {t('auth.terms')}
                </Text>
                {'  |  '}
                <Text style={styles.footLink} onPress={onOpenPrivacy}>
                  {t('auth.privacy')}
                </Text>
              </Text>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
};

/** Shared heading styles — the web sets these inline as `hStyle` / `subStyle`. */
export const authTextStyles = StyleSheet.create({
  title: {
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 8,
    color: '#fff',
    lineHeight: 27,
  },
  subtitle: {
    fontSize: 13.5,
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.72)',
  },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.panel },
  // Above the safe area so it reads as a hairline on the very edge, like the web's
  // `position: fixed; top: 0`.
  topbar: { height: 4, width: '100%' },
  safe: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 22, paddingTop: 24 },
  scrollKeyboardOpen: { justifyContent: 'flex-start' },
  inner: { width: '100%', maxWidth: AUTH_CONTENT_WIDTH, alignSelf: 'center' },

  avatar: { width: 100, height: 100, borderRadius: 50, alignSelf: 'center', marginBottom: 14 },
  avatarCompact: { width: 56, height: 56, borderRadius: 28, marginBottom: 8 },
  // Orbitron_600SemiBold encodes its own weight — setting fontWeight makes
  // Android drop the custom font (see BrandLogo).
  brand: {
    fontFamily: 'Orbitron_600SemiBold',
    fontSize: 26,
    letterSpacing: 0.5,
    textAlign: 'center',
    // The heading below adds another 2px of its own top margin.
    marginBottom: 10,
  },
  brandCompact: { fontSize: 18, marginBottom: 8 },
  brandWhite: { color: '#fff' },
  brandGold: { color: C.gold },

  info: {
    marginBottom: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: C.infoBorder,
    borderRadius: 8,
    backgroundColor: C.infoBg,
    color: C.infoText,
    fontSize: 13,
    lineHeight: 20,
  },
  error: {
    marginBottom: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: C.errorBorder,
    borderRadius: 8,
    backgroundColor: C.errorBg,
    color: C.errorText,
    fontSize: 13,
    lineHeight: 20,
  },

  foot: { paddingTop: 20, textAlign: 'center', fontSize: 12, color: C.footer },
  footLink: { color: C.gold },
});
