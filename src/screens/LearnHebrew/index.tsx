import React, { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '@/components/common';
import { HomeHeader } from '../Home/components/HomeHeader';
import { LearnHebrewSection } from '../Home/sections/LearnHebrewSection';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Standalone Learn Hebrew route — kept for the `learn-hebrew` deep link and the
 * back stack. The in-app UX is the tabbed Home container; here the header chips
 * navigate (no `onSelectChip`). Body is the shared section component.
 */
export const LearnHebrewScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();

  const openProfile = useCallback(
    () => navigation.navigate('MainTabs', { screen: 'PlaylistsTab', params: { screen: 'Profile' } }),
    [navigation],
  );

  return (
    <Screen safeArea={false}>
      <LearnHebrewSection />

      <HomeHeader activeChip="learn" onPressProfile={openProfile} />
    </Screen>
  );
};

export default LearnHebrewScreen;
