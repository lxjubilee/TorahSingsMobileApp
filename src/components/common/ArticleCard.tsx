import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { CatalogArticle } from '@/services/catalog/manifestTypes';
import { AppText } from './AppText';
import { ArticleHero } from './ArticleHero';

interface ArticleCardProps {
  article: CatalogArticle;
  /** Lead treatment — a taller image and a gold hairline. */
  featured?: boolean;
  onPress: () => void;
}

// Web hero palette (globals.css) for continuity with the rest of the port.
const ACCENT_BORDER = 'rgba(255,216,119,0.35)';
const INK = '#f0ebe3';
const INK_MUTED = '#7f86a8';
const INK_BODY = '#b8bcd4';

const CARD_ART_H = 150;
const FEATURED_ART_H = 200;

/**
 * One published article — CDN hero image, title, excerpt and meta. Shared by
 * every surface that lists articles, so the collections look identical.
 */
export const ArticleCard: React.FC<ArticleCardProps> = React.memo(
  ({ article, featured, onPress }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        featured && styles.cardFeatured,
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <ArticleHero
        slug={article.slug}
        uri={article.heroImage}
        topic={article.author}
        ring={featured}
        style={[styles.art, { height: featured ? FEATURED_ART_H : CARD_ART_H }]}
      />
      <View style={styles.cardBody}>
        <AppText style={styles.title}>{article.title}</AppText>
        <AppText style={styles.dek} numberOfLines={3}>
          {article.excerpt}
        </AppText>
        <AppText style={styles.meta}>
          Read aloud · {article.author} · {article.readingTimeMinutes} min
        </AppText>
      </View>
    </Pressable>
  ),
);

ArticleCard.displayName = 'ArticleCard';

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 18,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  cardFeatured: { borderWidth: 1, borderColor: ACCENT_BORDER },
  art: { width: '100%' },
  cardBody: { padding: 16 },
  title: { fontSize: 20, lineHeight: 26, fontWeight: '800', color: INK, marginBottom: 6 },
  dek: { fontSize: 14, lineHeight: 20, color: INK_BODY, marginBottom: 10 },
  meta: { fontSize: 12, color: INK_MUTED },
});
