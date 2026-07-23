import React, { useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText, BrandLogo, ProfileButton } from '@/components/common';
import type { RootStackParamList } from '@/navigation/types';

/** Height the chips row collapses from / expands to. */
export const CHIP_ROW_HEIGHT = 48;

/** Stable identity of a top-level nav chip — never the display label. */
export type NavChip = 'torah' | 'hebraic' | 'learn';

/**
 * The three top-level nav chips. `key` is the identity used for selection and
 * routing; the label is looked up per render so it follows the app language.
 * "Torah Sings" is the brand wordmark and stays untranslated, same as "Inspire"
 * inside the localized category names.
 */
const NAV_CHIPS: { key: NavChip; labelKey?: string; brand?: string }[] = [
  { key: 'torah', brand: 'Torah Sings' },
  { key: 'hebraic', labelKey: 'hebraic.title' },
  { key: 'learn', labelKey: 'learnHebrew.title' },
];

/** Active-chip gold — matches the "Sings" span of the brand wordmark. */
const GOLD = '#ffbd59';

interface HomeHeaderProps {
  /** 1 = chips fully visible, 0 = fully collapsed. Omit for an always-open header. */
  chipsAnim?: Animated.Value;
  /** 0 = transparent/gradient (at top), 1 = solid black (scrolled). Omit → solid. */
  bgAnim?: Animated.Value;
  /** Which nav chip renders as selected (gold). Defaults to Torah Sings. */
  activeChip?: NavChip;
  /**
   * When provided, tapping a nav chip calls this with the chip key instead of
   * navigating — lets a container switch sections in place (header stays fixed).
   * When omitted, chips fall back to route navigation (deep-link / standalone use).
   */
  onSelectChip?: (chip: NavChip) => void;
  /** Opens the profile page. */
  onPressProfile?: () => void;
}

/**
 * Fixed header overlaying the top of the Home hero (Netflix style):
 *  - At the top: a soft dark gradient with the title, actions, and filter chips.
 *  - On scroll down: chips collapse (height + fade) and the background
 *    cross-fades to solid black; scrolling back up restores the chips.
 * The collapse/solid state is driven by `chipsAnim` / `bgAnim` from the screen.
 */
const HomeHeaderBase: React.FC<HomeHeaderProps> = ({
  chipsAnim,
  bgAnim,
  activeChip = 'torah',
  onSelectChip,
  onPressProfile,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  // Static fallbacks so the header renders fully open + solid outside Home
  // (screens that don't drive the collapse-on-scroll animation).
  const openValue = useRef(new Animated.Value(1)).current;
  const chips = chipsAnim ?? openValue;
  const bg = bgAnim ?? openValue;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Solid black header background. */}
      <View style={[StyleSheet.absoluteFill, styles.solidBg]} pointerEvents="none" />
      {/* Solid black layer that fades in once scrolled. */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: bg }]}
      />

      <View style={[styles.inner, { paddingTop: insets.top + 6 }]}>
        <View style={styles.topRow}>
          <BrandLogo size={34} textStyle={[styles.brand, styles.brandText]} />

          <View style={styles.actions}>
            <ProfileButton onPress={onPressProfile} />
          </View>
        </View>

        {/* Collapsible chips row. */}
        <Animated.View
          style={[
            styles.chipsWrap,
            {
              opacity: chips,
              height: chips.interpolate({
                inputRange: [0, 1],
                outputRange: [0, CHIP_ROW_HEIGHT],
              }),
            },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {NAV_CHIPS.map(({ key, labelKey, brand }) => {
              const active = key === activeChip;
              // In-place mode: let the container switch sections. Fallback mode:
              // navigate to the section's route (deep-link / standalone screens).
              const onPress = onSelectChip
                ? () => onSelectChip(key)
                : key === 'hebraic'
                  ? () => navigation.navigate('HebraicChristianity')
                  : key === 'learn'
                    ? () => navigation.navigate('LearnHebrew')
                    : () => navigation.navigate('MainTabs', { screen: 'HomeTab' });
              return (
                <Pressable
                  key={key}
                  onPress={onPress}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <AppText
                    variant="label"
                    style={[styles.chipText, { color: active ? GOLD : '#FFFFFF' }]}
                  >
                    {brand ?? t(labelKey!)}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </View>
  );
};

/**
 * Memoized so a container state change that leaves its props identical (e.g.
 * switching the selected section) does NOT re-render the header or chip row —
 * only the body below updates.
 */
export const HomeHeader = React.memo(HomeHeaderBase);

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 },
  inner: { paddingHorizontal: 16, paddingBottom: 8 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  solidBg: { backgroundColor: '#000' },
  // Gold, matching theme.colors.accent and the GOLD wordmark above.
  brand: { color: '#ffd877' },
  // Bold mixed-case wordmark ("TorahSings").
  brandText: { fontSize: 26, lineHeight: 30, fontWeight: '900', letterSpacing: 0.5 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconWrap: { position: 'relative' },
  countBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { color: '#fff', fontSize: 9, lineHeight: 12, fontWeight: '700' },
  chipsWrap: { overflow: 'hidden', justifyContent: 'center' },
  chipsRow: { paddingRight: 16, gap: 18, alignItems: 'center' },
  chip: {
    height: 34,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 6,
  },
  chipActive: {
    borderWidth: 1.5,
    borderColor: GOLD,
  },
  // Uppercased in CSS rather than in the strings, so translated labels keep the
  // all-caps look (a no-op for scripts without case, e.g. Hebrew/Arabic).
  chipText: { fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
});
