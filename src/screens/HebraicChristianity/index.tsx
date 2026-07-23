import React, { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '@/components/common';
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

  const openProfile = useCallback(
    () => navigation.navigate('MainTabs', { screen: 'PlaylistsTab', params: { screen: 'Profile' } }),
    [navigation],
  );

  return (
    <Screen safeArea={false}>
      <HebraicChristianitySection />

      <HomeHeader activeChip="hebraic" onPressProfile={openProfile} />
    </Screen>
  );
};

export default HebraicChristianityScreen;
