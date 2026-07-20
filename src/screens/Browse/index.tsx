import React, { useMemo, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context';
import { Screen, AppText, IconButton } from '@/components/common';
import { allCatalogAlbums } from '@/content/angelsCatalog/player';
import { CatalogTile } from '../Home/components/CatalogTile';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get('window');
const GAP = 16;
const CARD_W = (width - GAP * 3) / 2;

export const BrowseScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const theme = useTheme();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  // Local, offline filtering over the bundled catalog — matches album title or
  // source book, updating on every keystroke.
  const term = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!term) return allCatalogAlbums;
    return allCatalogAlbums.filter(
      (a) => a.title.toLowerCase().includes(term) || a.book.toLowerCase().includes(term),
    );
  }, [term]);

  return (
    <Screen>
      {/* Pinned outside the FlatList so the title and search box stay put while
          the album grid scrolls underneath. */}
      <View style={styles.header}>
        <AppText variant="display">{t('tabs.browse')}</AppText>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md },
          ]}
        >
          <Ionicons name="search" size={20} color={theme.colors.iconMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('browse.searchPlaceholder')}
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.input, { color: theme.colors.text }]}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length ? (
            <IconButton
              name="close-circle"
              size={20}
              color={theme.colors.iconMuted}
              onPress={() => setQuery('')}
            />
          ) : null}
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(a) => a.code}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          term ? (
            <AppText variant="body" color="textMuted" style={styles.noResults}>
              {t('search.noResults', { query: query.trim() })}
            </AppText>
          ) : null
        }
        renderItem={({ item }) => (
          <CatalogTile
            album={item}
            width={CARD_W}
            onPress={() => navigation.navigate('CatalogAlbum', { code: item.code })}
          />
        )}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: GAP, paddingBottom: 24 },
  header: { paddingHorizontal: GAP, paddingTop: 8, paddingBottom: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 46, marginTop: 16 },
  input: { flex: 1, marginLeft: 8, fontSize: 15 },
  noResults: { paddingTop: 24 },
  column: { gap: GAP, marginBottom: GAP, alignItems: 'flex-start' },
});

export default BrowseScreen;
