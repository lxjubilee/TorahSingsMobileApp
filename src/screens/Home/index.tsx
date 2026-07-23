import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '@/components/common';
import type { RootStackParamList } from '@/navigation/types';
import { HomeHeader, type NavChip } from './components/HomeHeader';
import { TorahSingsSection } from './sections/TorahSingsSection';
import { HebraicChristianitySection } from './sections/HebraicChristianitySection';
import { LearnHebrewSection } from './sections/LearnHebrewSection';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// A section IS a nav chip — the header hands back the chip's stable key, so no
// label→section mapping is needed (and chip labels stay free to be translated).
type Section = NavChip;

/**
 * Home is the container for the three top-level sections (Torah Sings · Hebraic
 * Christianity · Learn Hebrew). The header + chip row are rendered ONCE and stay
 * fixed; tapping a chip only flips local state and reveals that section's body.
 *
 * Keep-alive: a section is mounted the first time it's opened and then kept
 * mounted, toggled with `display`, so switching is instant, preserves each
 * section's scroll position, and never reloads/flickers.
 */
export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();

  const [section, setSection] = useState<Section>('torah');
  const [visited, setVisited] = useState<Set<Section>>(() => new Set<Section>(['torah']));

  const onSelectChip = useCallback((next: NavChip) => {
    setSection(next);
    setVisited((prev) => (prev.has(next) ? prev : new Set(prev).add(next)));
  }, []);

  const openProfile = useCallback(
    () => navigation.navigate('MainTabs', { screen: 'PlaylistsTab', params: { screen: 'Profile' } }),
    [navigation],
  );

  return (
    <Screen safeArea={false}>
      {/* All visited section bodies stay mounted; only the active one is shown. */}
      {visited.has('torah') ? (
        <View style={[StyleSheet.absoluteFill, section === 'torah' ? styles.active : styles.hidden]}>
          <TorahSingsSection />
        </View>
      ) : null}
      {visited.has('hebraic') ? (
        <View style={[StyleSheet.absoluteFill, section === 'hebraic' ? styles.active : styles.hidden]}>
          <HebraicChristianitySection />
        </View>
      ) : null}
      {visited.has('learn') ? (
        <View style={[StyleSheet.absoluteFill, section === 'learn' ? styles.active : styles.hidden]}>
          <LearnHebrewSection />
        </View>
      ) : null}

      {/* Fixed header + chip row — rendered once, never re-renders on section change. */}
      <HomeHeader
        activeChip={section}
        onSelectChip={onSelectChip}
        onPressProfile={openProfile}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  active: { display: 'flex' },
  hidden: { display: 'none' },
});

export default HomeScreen;
