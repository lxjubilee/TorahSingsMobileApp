import React, { useCallback, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, LanguagePanel } from '@/components/common';
import { useAppSelector } from '@/hooks';
import { HomeHeader } from '../Home/components/HomeHeader';
import { HebraicChristianitySection } from '../Home/sections/HebraicChristianitySection';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Standalone Hebraic Christianity route — kept for direct/deep-link entry and the
 * back stack. The in-app UX is the tabbed Home container; here the header chips
 * navigate (no `onSelectChip`). Body is the shared section component.
 */
export const HebraicChristianityScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const language = useAppSelector((s) => s.settings.language);
  const [langPanelOpen, setLangPanelOpen] = useState(false);

  const openProfile = useCallback(
    () => navigation.navigate('MainTabs', { screen: 'PlaylistsTab', params: { screen: 'Profile' } }),
    [navigation],
  );

  return (
    <Screen safeArea={false}>
      <HebraicChristianitySection />

      <HomeHeader
        activeChip="HEBRAIC CHRISTIANITY"
        onPressProfile={openProfile}
        language={language}
        onPressLanguage={() => setLangPanelOpen(true)}
      />

      {langPanelOpen ? (
        <LanguagePanel selected={language} onClose={() => setLangPanelOpen(false)} />
      ) : null}
    </Screen>
  );
};

export default HebraicChristianityScreen;
