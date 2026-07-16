import React from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, AppText, IconButton, CelestialArt } from '@/components/common';
import { articles } from '@/content/articles/data';
import type { Block } from '@/content/articles/types';
import type { RootStackParamList, RootStackScreenProps } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width: W } = Dimensions.get('window');
const HEADER_HEIGHT = 38;
const H_PAD = 20;
const ART_H = Math.round((W - H_PAD * 2) * (9 / 21)); // 21:9 masthead

const ACCENT_SOFT = '#ffd877';
const INK = '#f0ebe3';
const INK_MUTED = '#7f86a8';
const INK_BODY = '#b8bcd4';

/** Render one article body block: paragraph, sub-heading, or pull-quote. */
const BlockView: React.FC<{ block: Block }> = ({ block }) => {
  if (block.type === 'h') return <AppText style={styles.h}>{block.text}</AppText>;
  if (block.type === 'quote') {
    return (
      <View style={styles.quote}>
        <AppText style={styles.quoteText}>“{block.text}”</AppText>
        <AppText style={styles.quoteCite}>— {block.cite}</AppText>
      </View>
    );
  }
  return <AppText style={styles.p}>{block.text}</AppText>;
};

/** Article reader — category, title, dek, celestial masthead, then the body. */
export const ArticleScreen: React.FC = () => {
  const { params } = useRoute<RootStackScreenProps<'Article'>['route']>();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const article = articles.find((a) => a.slug === params.slug);

  if (!article) {
    return (
      <Screen>
        <View style={styles.center}>
          <AppText style={styles.p}>Article not found.</AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeArea={false}>
      <ScrollView
        style={styles.flex}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + HEADER_HEIGHT + 8, paddingBottom: 48 + insets.bottom }}
      >
        <View style={styles.wrap}>
          <AppText style={styles.category}>{article.category.toUpperCase()}</AppText>
          <AppText style={styles.title}>{article.title}</AppText>
          <AppText style={styles.dek}>{article.dek}</AppText>
        </View>

        <View style={styles.wrap}>
          <CelestialArt
            hue={article.art.hue}
            glyph={article.art.glyph}
            glyphSize={92}
            style={styles.art}
          />
        </View>

        <View style={styles.wrap}>
          {article.blocks.map((b, i) => (
            <BlockView key={i} block={b} />
          ))}

          <View style={styles.footRule}>
            <AppText style={styles.footMeta}>
              Presented by {article.presenter} · {article.readingTime} min
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
  p: { fontSize: 15, lineHeight: 25, color: INK_BODY, marginBottom: 16 },
  h: { fontSize: 19, fontWeight: '800', color: INK, marginTop: 8, marginBottom: 12 },
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
