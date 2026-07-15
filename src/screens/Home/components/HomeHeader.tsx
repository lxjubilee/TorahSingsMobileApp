import React from 'react';
import { Animated, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context';
import { AppText, BrandLogo, ProfileButton } from '@/components/common';
import { langFlagUrl } from '@/localization';

/** The "show everything" chip, always first in the filter row. */
export const HOME_FILTER_ALL = 'Home';

/** A Home filter is the "Home" sentinel or a catalog category label. */
export type HomeFilter = string;

/** Height the chips row collapses from / expands to. */
export const CHIP_ROW_HEIGHT = 48;

interface HomeHeaderProps {
  /** Chips to render, e.g. ['Home', 'Inspire Family', …] derived from the feed. */
  filters: HomeFilter[];
  selected: HomeFilter;
  onSelect: (filter: HomeFilter) => void;
  /** 1 = chips fully visible, 0 = fully collapsed. */
  chipsAnim: Animated.Value;
  /** 0 = transparent/gradient (at top), 1 = solid black (scrolled). */
  bgAnim: Animated.Value;
  /** Opens the profile page. */
  onPressProfile?: () => void;
  /** Current language code — drives the flag shown on the language button. */
  language?: string;
  /** Opens the language picker. */
  onPressLanguage?: () => void;
  /** Maps a chip's raw value (the filter identity) → its localized display text.
   *  Defaults to identity, so the chip renders its raw value when omitted. */
  getLabel?: (value: HomeFilter) => string;
}

/**
 * Fixed header overlaying the top of the Home hero (Netflix style):
 *  - At the top: a soft dark gradient with the title, actions, and filter chips.
 *  - On scroll down: chips collapse (height + fade) and the background
 *    cross-fades to solid black; scrolling back up restores the chips.
 * The collapse/solid state is driven by `chipsAnim` / `bgAnim` from the screen.
 */
export const HomeHeader: React.FC<HomeHeaderProps> = ({
  filters,
  selected,
  onSelect,
  chipsAnim,
  bgAnim,
  onPressProfile,
  language,
  onPressLanguage,
  getLabel,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Solid black header background. */}
      <View style={[StyleSheet.absoluteFill, styles.solidBg]} pointerEvents="none" />
      {/* Solid black layer that fades in once scrolled. */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: bgAnim }]}
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
              opacity: chipsAnim,
              height: chipsAnim.interpolate({
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
            {filters.map((filter) => {
              const active = filter === selected;
              return (
                <Pressable
                  key={filter}
                  onPress={() => onSelect(filter)}
                  style={[
                    styles.chip,
                    {
                      borderColor: active ? '#FFFFFF' : 'rgba(255,255,255,0.18)',
                      backgroundColor: active ? '#FFFFFF' : 'rgba(255,255,255,0.08)',
                    },
                  ]}
                >
                  <AppText
                    variant="label"
                    style={{ color: active ? '#000' : theme.colors.text }}
                  >
                    {getLabel ? getLabel(filter) : filter}
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
  chipsRow: { paddingRight: 16, gap: 10, alignItems: 'center' },
  chip: {
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
