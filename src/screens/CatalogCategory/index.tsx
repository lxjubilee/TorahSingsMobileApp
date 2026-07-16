import React from 'react';
import { Dimensions, FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, AppText, IconButton } from '@/components/common';
import { angelsCatalog } from '@/content/angelsCatalog/data';
import { CatalogTile } from '../Home/components/CatalogTile';
import type { RootStackParamList, RootStackScreenProps } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get('window');
const GAP = 16;
const CARD_W = (width - GAP * 3) / 2;
const HEADER_HEIGHT = 38;

/** Full grid of albums in one Angels' Catalog division — the "See all" target
 *  of a Home catalog rail, and (narrowed to one `book`) the album screen's
 *  "View All" target. */
export const CatalogCategoryScreen: React.FC = () => {
  const { params } = useRoute<RootStackScreenProps<'CatalogCategory'>['route']>();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const category = angelsCatalog.find((c) => c.id === params.categoryId);
  const allAlbums = category?.albums ?? [];
  const albums = params.book ? allAlbums.filter((a) => a.book === params.book) : allAlbums;

  return (
    <Screen safeArea={false}>
      <FlatList
        data={albums}
        keyExtractor={(a) => a.code}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + HEADER_HEIGHT + 8, paddingBottom: 40 + insets.bottom },
        ]}
        ListHeaderComponent={
          <View style={styles.header}>
            <AppText variant="display" numberOfLines={2} style={styles.title}>
              {params.book ?? category?.title ?? 'Catalog'}
            </AppText>
            <AppText variant="body" color="textMuted">
              {albums.length} albums
            </AppText>
          </View>
        }
        renderItem={({ item }) => (
          <CatalogTile
            album={item}
            width={CARD_W}
            onPress={() => navigation.navigate('CatalogAlbum', { code: item.code })}
          />
        )}
      />

      {/* Pinned black header with the back button. */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top, height: insets.top + HEADER_HEIGHT }]}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: GAP },
  header: { alignItems: 'flex-start', paddingBottom: 16 },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  title: { marginTop: 8 },
  column: { gap: GAP, marginBottom: GAP },
});
