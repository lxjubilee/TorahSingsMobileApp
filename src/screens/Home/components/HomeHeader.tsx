import React, { useRef } from 'react';
import { Animated, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText, BrandLogo, ProfileButton } from '@/components/common';
import { langFlagUrl } from '@/localization';
import type { RootStackParamList } from '@/navigation/types';

/** The "show everything" chip, always first in the filter row. */
export const HOME_FILTER_ALL = 'Home';

/** A Home filter is the "Home" sentinel or a catalog category label. */
export type HomeFilter = string;

/** Height the chips row collapses from / expands to. */
export const CHIP_ROW_HEIGHT = 48;

/**
 * Hardcoded nav chips (visual only for now — no press action). The first one
 * renders as the active tab: gold text in a gold-bordered rounded rectangle.
 */
const NAV_CHIPS = ['TORAH SINGS', 'HEBRAIC CHRISTIANITY', 'LEARN HEBREW'];

/** Active-chip gold — matches the "Sings" span of the brand wordmark. */
const GOLD = '#ffbd59';

interface HomeHeaderProps {
  /** 1 = chips fully visible, 0 = fully collapsed. Omit for an always-open header. */
  chipsAnim?: Animated.Value;
  /** 0 = transparent/gradient (at top), 1 = solid black (scrolled). Omit → solid. */
  bgAnim?: Animated.Value;
  /** Which nav chip renders as selected (gold). Defaults to "TORAH SINGS". */
  activeChip?: string;
  /** Opens the profile page. */
  onPressProfile?: () => void;
  /** Current language code — drives the flag shown on the language button. */
  language?: string;
  /** Opens the language picker. */
  onPressLanguage?: () => void;
}

/**
 * Fixed header overlaying the top of the Home hero (Netflix style):
 *  - At the top: a soft dark gradient with the title, actions, and filter chips.
 *  - On scroll down: chips collapse (height + fade) and the background
 *    cross-fades to solid black; scrolling back up restores the chips.
 * The collapse/solid state is driven by `chipsAnim` / `bgAnim` from the screen.
 */
export const HomeHeader: React.FC<HomeHeaderProps> = ({
  chipsAnim,
  bgAnim,
  activeChip = 'TORAH SINGS',
  onPressProfile,
  language,
  onPressLanguage,
}) => {
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
            {onPressLanguage ? (
              <Pressable
                onPress={onPressLanguage}
                hitSlop={8}
                style={styles.langButton}
                accessibilityRole="button"
                accessibilityLabel="Change language"
              >
                <Image
                  source={{ uri: langFlagUrl(language ?? 'en', 80) }}
                  style={styles.langFlag}
                  resizeMode="cover"
                />
              </Pressable>
            ) : null}
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
            {NAV_CHIPS.map((label) => {
              const active = label === activeChip;
              const onPress =
                label === 'HEBRAIC CHRISTIANITY'
                  ? () => navigation.navigate('HebraicChristianity')
                  : label === 'LEARN HEBREW'
                    ? () => navigation.navigate('LearnHebrew')
                    : label === 'TORAH SINGS'
                      ? () => navigation.navigate('MainTabs', { screen: 'HomeTab' })
                      : undefined;
              return (
                <Pressable
                  key={label}
                  onPress={onPress}
                  disabled={!onPress}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <AppText
                    variant="label"
                    style={[styles.chipText, { color: active ? GOLD : '#FFFFFF' }]}
                  >
                    {label}
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
  brand: { color: '#007FFF' },
  // Bold mixed-case wordmark ("TorahSings").
  brandText: { fontSize: 26, lineHeight: 30, fontWeight: '900', letterSpacing: 0.5 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  langButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: '#222',
  },
  // Square + cover so the rectangular flag is cropped into the round button.
  langFlag: { width: '100%', height: '100%' },
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
  chipText: { fontWeight: '700', letterSpacing: 0.6 },
});
