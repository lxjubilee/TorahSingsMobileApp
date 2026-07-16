import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SectionHeader } from '@/components/common';
import { angelsCatalog } from '@/content/angelsCatalog/data';
import type { CatalogCategory } from '@/content/angelsCatalog/types';
import type { RootStackParamList } from '@/navigation/types';
import { CatalogTile } from './CatalogTile';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Preview the first N albums per division; "See all" opens the rest (web parity).
const MAX_PREVIEW = 12;

/** One horizontally-scrolling division rail (title + See all + cover tiles). */
const CatalogRail: React.FC<{
  category: CatalogCategory;
  onSeeAll: () => void;
  onOpenAlbum: (code: string) => void;
}> = ({ category, onSeeAll, onOpenAlbum }) => (
  <View style={styles.railWrap}>
    <SectionHeader title={category.title} onSeeAll={onSeeAll} />
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={category.albums.slice(0, MAX_PREVIEW)}
      keyExtractor={(a) => a.code}
      contentContainerStyle={styles.row}
      ItemSeparatorComponent={() => <View style={styles.sep} />}
      renderItem={({ item }) => (
        <CatalogTile album={item} onPress={() => onOpenAlbum(item.code)} />
      )}
    />
  </View>
);

/** All six Angels' Catalog divisions as Home rails (ported from the web). */
export const CatalogRails: React.FC = () => {
  const navigation = useNavigation<Nav>();
  return (
    <>
      {angelsCatalog.map((cat) => (
        <CatalogRail
          key={cat.id}
          category={cat}
          onSeeAll={() => navigation.navigate('CatalogCategory', { categoryId: cat.id })}
          onOpenAlbum={(code) => navigation.navigate('CatalogAlbum', { code })}
        />
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  railWrap: { marginBottom: 24 },
  row: { paddingHorizontal: 16 },
  sep: { width: 14 },
});
