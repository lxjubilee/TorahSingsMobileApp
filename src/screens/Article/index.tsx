import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, AppText, IconButton, ArticleHero } from '@/components/common';
import { articles as bundledArticles } from '@/content/articles/data';
import type { Block } from '@/content/articles/types';
import { Image } from 'expo-image';
import { getArticle, getArticleBlocks } from '@/services/articles';
import type { CatalogArticle } from '@/services/catalog/manifestTypes';
import { cdnUrl, logger } from '@/utils';
import type { RootStackParamList, RootStackScreenProps } from '@/navigation/types';
import { ReadAloudButton } from './ReadAloudButton';
import { useTranslation } from 'react-i18next';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width: W } = Dimensions.get('window');
const HEADER_HEIGHT = 38;
const H_PAD = 20;
const ART_H = Math.round((W - H_PAD * 2) * (9 / 21)); // 21:9 masthead

const ACCENT_SOFT = '#ffd877';
const INK = '#f0ebe3';
const INK_MUTED = '#7f86a8';
const INK_BODY = '#b8bcd4';

/** What the reader renders, whichever source the article came from. */
interface Readable {
  slug: string;
  title: string;
  dek: string;
  eyebrow: string;
  presenter: string;
  minutes: number;
  heroImage?: string;
  blocks: Block[];
  audioUrl: string | null;
}

/** Render one article body block: paragraph, sub-heading, pull-quote, or figure. */
const BlockView: React.FC<{ block: Block }> = ({ block }) => {
  if (block.type === 'h') return <AppText style={styles.h}>{block.text}</AppText>;
  if (block.type === 'img') {
    return (
      <View style={styles.figure}>
        <Image source={{ uri: cdnUrl(block.src) }} style={styles.figureImage} contentFit="cover" transition={200} />
        {block.alt ? <AppText style={styles.figureCaption}>{block.alt}</AppText> : null}
      </View>
    );
  }
  if (block.type === 'quote') {
    return (
      <View style={styles.quote}>
        <AppText style={styles.quoteText}>“{block.text}”</AppText>
        {/* Published bodies cite scripture inline; a quote without one renders bare. */}
        {block.cite ? <AppText style={styles.quoteCite}>— {block.cite}</AppText> : null}
      </View>
    );
  }
  return <AppText style={styles.p}>{block.text}</AppText>;
};

/** Adapt a CDN article + its fetched body to the reader's shape. */
const fromCatalog = (a: CatalogArticle, blocks: Block[]): Readable => ({
  slug: a.slug,
  title: a.title,
  dek: a.excerpt,
  eyebrow: a.office ?? '',
  presenter: a.author,
  minutes: a.readingTimeMinutes,
  heroImage: a.heroImage,
  blocks,
  // Read-aloud audio is not published for these yet; the button falls back to
  // the device voice, exactly as it did for the bundled articles.
  audioUrl: null,
});

/**
 * Article reader.
 *
 * Articles come from the CDN catalog manifest and their bodies are Markdown
 * fetched on open. The bundled articles remain a fallback purely so links to
 * pre-CDN slugs (a saved deep link, an old share) still open something.
 */
export const ArticleScreen: React.FC = () => {
  const { t } = useTranslation();
  const { params } = useRoute<RootStackScreenProps<'Article'>['route']>();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const [article, setArticle] = useState<Readable | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const meta = await getArticle(params.slug);
        if (meta) {
          const blocks = await getArticleBlocks(meta);
          if (mounted) setArticle(fromCatalog(meta, blocks));
          return;
        }
        // Not in the published collection — fall back to a bundled article.
        const legacy = bundledArticles.find((a) => a.slug === params.slug);
        if (mounted) {
          setArticle(
            legacy
              ? {
                  slug: legacy.slug,
                  title: legacy.title,
                  dek: legacy.dek,
                  eyebrow: legacy.category,
                  presenter: legacy.presenter,
                  minutes: legacy.readingTime,
                  blocks: legacy.blocks,
                  audioUrl: legacy.audioUrl,
                }
              : null,
          );
        }
      } catch (err) {
        logger.warn(`article ${params.slug} failed to load`, err);
        if (mounted) setArticle(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [params.slug]);

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={ACCENT_SOFT} />
        </View>
      </Screen>
    );
  }

  if (!article) {
    return (
      <Screen>
        <View style={styles.center}>
          <AppText style={styles.p}>{t('errors.articleNotFound')}</AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeArea={false}>
      <ScrollView
        style={styles.flex}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + HEADER_HEIGHT + 8,
          paddingBottom: 48 + insets.bottom,
        }}
      >
        <View style={styles.wrap}>
          {article.eyebrow ? (
            <AppText style={styles.category}>{article.eyebrow.toUpperCase()}</AppText>
          ) : null}
          <AppText style={styles.title}>{article.title}</AppText>
          <AppText style={styles.dek}>{article.dek}</AppText>
        </View>

        <View style={styles.wrap}>
          <ArticleHero
            slug={article.slug}
            uri={article.heroImage}
            topic={article.presenter}
            ring
            style={styles.art}
          />
        </View>

        <View style={styles.wrap}>
          <ReadAloudButton
            id={`article:${article.slug}`}
            blocks={article.blocks}
            presenter={article.presenter}
            audioUrl={article.audioUrl}
            minutes={article.minutes}
          />

          {article.blocks.map((b, i) => (
            <BlockView key={i} block={b} />
          ))}

          <View style={styles.footRule}>
            <AppText style={styles.footMeta}>
              Presented by {article.presenter} · {article.minutes} min
            </AppText>
            <AppText style={styles.footMeta}>Not canon · Something to consider</AppText>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.fixedHeader, { paddingTop: insets.top, height: insets.top + HEADER_HEIGHT }]}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrap: { paddingHorizontal: H_PAD },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  category: { fontSize: 11, letterSpacing: 1.4, fontWeight: '700', color: ACCENT_SOFT, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', lineHeight: 34, color: INK, marginBottom: 10 },
  dek: { fontSize: 15, lineHeight: 22, fontStyle: 'italic', color: INK_MUTED, marginBottom: 18 },
  art: { width: '100%', height: ART_H, borderRadius: 12, marginBottom: 20 },
  // Justified body copy. Android honours this from API 26 (8.0) and falls back
  // to left-aligned below that, which is a clean degradation.
  p: { fontSize: 15, lineHeight: 25, color: INK_BODY, marginBottom: 16, textAlign: 'justify' },
  h: { fontSize: 19, fontWeight: '800', color: INK, marginTop: 8, marginBottom: 12 },
  figure: { marginBottom: 20 },
  // 16:9 — the aspect every published figure is rendered at.
  figureImage: { width: '100%', aspectRatio: 16 / 9, borderRadius: 10 },
  figureCaption: { fontSize: 12, lineHeight: 18, color: INK_MUTED, marginTop: 8, fontStyle: 'italic' },
  quote: {
    borderLeftWidth: 3,
    borderLeftColor: ACCENT_SOFT,
    paddingLeft: 14,
    marginBottom: 18,
  },
  quoteText: { fontSize: 16, lineHeight: 24, fontStyle: 'italic', color: INK, marginBottom: 6 },
  quoteCite: { fontSize: 12, fontWeight: '700', color: INK_MUTED },
  footRule: {
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.14)',
  },
  footMeta: { fontSize: 12, color: INK_MUTED, marginBottom: 4 },
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
});
