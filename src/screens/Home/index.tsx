import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, LanguagePanel } from '@/components/common';
import { useAppSelector } from '@/hooks';
import type { RootStackParamList } from '@/navigation/types';
import { HomeHeader } from './components/HomeHeader';
import { TorahSingsSection } from './sections/TorahSingsSection';
import { HebraicChristianitySection } from './sections/HebraicChristianitySection';
import { LearnHebrewSection } from './sections/LearnHebrewSection';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Section = 'torah' | 'hebraic' | 'learn';

// Maps the header chip labels to sections (both directions).
const CHIP_TO_SECTION: Record<string, Section> = {
  'TORAH SINGS': 'torah',
  'HEBRAIC CHRISTIANITY': 'hebraic',
  'LEARN HEBREW': 'learn',
};
const SECTION_TO_CHIP: Record<Section, string> = {
  torah: 'TORAH SINGS',
  hebraic: 'HEBRAIC CHRISTIANITY',
  learn: 'LEARN HEBREW',
};

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
  const language = useAppSelector((s) => s.settings.language);

  const [section, setSection] = useState<Section>('torah');
  const [visited, setVisited] = useState<Set<Section>>(() => new Set<Section>(['torah']));
  const [langPanelOpen, setLangPanelOpen] = useState(false);

  const onSelectChip = useCallback((chip: string) => {
    const next = CHIP_TO_SECTION[chip];
    if (!next) return;
    setSection(next);
    setVisited((prev) => (prev.has(next) ? prev : new Set(prev).add(next)));
  }, []);

  const openProfile = useCallback(
    () => navigation.navigate('MainTabs', { screen: 'PlaylistsTab', params: { screen: 'Profile' } }),
    [navigation],
  );
  const openLanguage = useCallback(() => setLangPanelOpen(true), []);

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
        activeChip={SECTION_TO_CHIP[section]}
        onSelectChip={onSelectChip}
        onPressProfile={openProfile}
        language={language}
        onPressLanguage={openLanguage}
      />

      {langPanelOpen ? (
        <LanguagePanel selected={language} onClose={() => setLangPanelOpen(false)} />
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  active: { display: 'flex' },
  hidden: { display: 'none' },
});

export default HomeScreen;
