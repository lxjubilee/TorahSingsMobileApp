import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { HeroStatic } from '../components/HeroStatic';
import { CatalogRails } from '../components/CatalogRail';

/**
 * Torah Sings section body — the ported catalog hero + the six division rails.
 * Presentational only: the shared header lives in the container, so this is just
 * the scrolling content. `HeroStatic` supplies its own top offset to clear the
 * fixed header (as on the original Home). Memoized so switching to another
 * section never re-renders it.
 */
export const TorahSingsSection: React.FC = React.memo(() => (
  <ScrollView style={styles.flex} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
    <HeroStatic />
    <CatalogRails />
  </ScrollView>
));

TorahSingsSection.displayName = 'TorahSingsSection';

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: 24 },
});
