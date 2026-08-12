import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText, ArticleCard } from '@/components/common';
import { useArticles } from '@/hooks';
import type { CatalogArticle } from '@/services/catalog/manifestTypes';
import type { RootStackParamList } from '@/navigation/types';
import { CHIP_ROW_HEIGHT } from '../components/HomeHeader';
import { useTranslation } from 'react-i18next';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const ACCENT_SOFT = '#ffd877';
const INK_MUTED = '#7f86a8';

/**
 * A published article collection, read live from the CDN catalog manifest.
 *
 * Articles only: the surface carries no hero or standfirst of its own, so the
 * collection speaks for itself. Shared by every article tab, which keeps the
 * collections looking and behaving identically.
 *
 * The lists run to a few hundred articles, so this is virtualized; an outer
 * ScrollView would mount every row (and every hero image) at once.
 */
export const ArticleLibrarySection: React.FC<{ collection: string }> = React.memo(
  ({ collection }) => {
    const { t } = useTranslation();
    const navigation = useNavigation<Nav>();
    const insets = useSafeAreaInsets();
    const { articles, loading, failed } = useArticles(collection);

    const open = useCallback(
      (a: CatalogArticle) => navigation.navigate('Article', { slug: a.slug }),
      [navigation],
    );

    // The lead article takes the larger card; the rest form the library below it.
    const featured = articles[0];
    const rest = featured ? articles.slice(1) : articles;

    const header = featured ? (
      <ArticleCard article={featured} featured onPress={() => open(featured)} />
    ) : null;

    const empty = loading ? (
      <ActivityIndicator color={ACCENT_SOFT} style={styles.loader} />
    ) : (
      <AppText style={styles.empty}>{failed ? t('errors.generic') : t('articles.empty')}</AppText>
    );

    return (
      <FlatList
        style={styles.flex}
        data={rest}
        keyExtractor={(a) => a.slug}
        renderItem={({ item }) => <ArticleCard article={item} onPress={() => open(item)} />}
        ListHeaderComponent={header}
        ListEmptyComponent={featured ? null : empty}
        showsVerticalScrollIndicator={false}
        initialNumToRender={4}
        windowSize={7}
        removeClippedSubviews
        contentContainerStyle={{
          // +16 stands in for the padding the removed section hero contributed,
          // so the first card doesn't sit flush against the header.
          paddingTop: insets.top + 64 + CHIP_ROW_HEIGHT + 16,
          paddingBottom: 40 + insets.bottom,
        }}
      />
    );
  },
);

ArticleLibrarySection.displayName = 'ArticleLibrarySection';

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loader: { marginTop: 40 },
  empty: { textAlign: 'center', color: INK_MUTED, paddingHorizontal: 32, paddingTop: 40 },
});
