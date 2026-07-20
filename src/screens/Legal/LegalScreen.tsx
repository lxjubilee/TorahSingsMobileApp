import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import { Screen, AppText, IconButton } from '@/components/common';
import { useTheme } from '@/context';
import type { LegalBlock, LegalDocument } from './content';

// Registered in both the Library and Auth stacks, so type only what we use here.
type Nav = NavigationProp<ParamListBase>;

const Block: React.FC<{ block: LegalBlock }> = ({ block }) => {
  const theme = useTheme();
  if (block.type === 'bullets') {
    return (
      <View style={styles.bulletGroup}>
        {block.items.map((item, i) => (
          <View key={i} style={styles.bulletRow}>
            <AppText variant="body" color="textSecondary" style={styles.bulletDot}>
              {'•'}
            </AppText>
            <AppText variant="body" color="textSecondary" style={[styles.bulletText, { lineHeight: 22 }]}>
              {item}
            </AppText>
          </View>
        ))}
      </View>
    );
  }
  if (block.type === 'card') {
    return (
      <View style={[styles.card, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        <AppText variant="body" color="text" weight="bold" style={styles.cardTitle}>
          {block.title}
        </AppText>
        {block.lines.map((line, i) => (
          <AppText key={i} variant="body" color="textSecondary" style={[styles.cardLine, { lineHeight: 22 }]}>
            {line}
          </AppText>
        ))}
      </View>
    );
  }
  if (block.type === 'subheading') {
    return (
      <AppText variant="label" color="text" style={styles.subheading}>
        {block.text}
      </AppText>
    );
  }
  return (
    <AppText variant="body" color="textSecondary" style={[styles.paragraph, { lineHeight: 22 }]}>
      {block.text}
    </AppText>
  );
};

/**
 * Shared renderer for the in-app legal documents. Takes a structured
 * {@link LegalDocument} and presents it with a back-navigable header and a
 * scrollable body, so Privacy Policy and Terms of Use share one layout.
 */
export const LegalScreen: React.FC<{ document: LegalDocument }> = ({ document }) => {
  const navigation = useNavigation<Nav>();
  const theme = useTheme();

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} />
        <AppText variant="h1" style={styles.title}>
          {document.title}
        </AppText>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="body" color="textSecondary" style={[styles.lead, { lineHeight: 23 }]}>
          {document.lead}
        </AppText>

        {/* The rule the web draws between the hero and the document body. */}
        <View style={[styles.rule, { backgroundColor: theme.colors.border }]} />

        <AppText variant="bodySm" color="textMuted" style={styles.effectiveDate}>
          EFFECTIVE {document.effectiveDate.toUpperCase()}
        </AppText>

        {document.intro.map((text, i) => (
          <AppText
            key={`intro-${i}`}
            variant="body"
            color="textSecondary"
            style={[styles.paragraph, { lineHeight: 22 }]}
          >
            {text}
          </AppText>
        ))}

        {document.sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <AppText variant="h3" style={styles.sectionHeading}>
              {section.heading}
            </AppText>
            {section.blocks.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8 },
  title: { marginLeft: 8, flexShrink: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 48 },
  lead: { marginTop: 4 },
  rule: { height: StyleSheet.hairlineWidth, marginTop: 20, marginBottom: 20 },
  effectiveDate: { letterSpacing: 1.2, marginBottom: 16 },
  section: { marginTop: 24 },
  sectionHeading: { marginBottom: 8 },
  subheading: { marginTop: 14, marginBottom: 2 },
  paragraph: { marginTop: 8 },
  bulletGroup: { marginTop: 8 },
  bulletRow: { flexDirection: 'row', marginTop: 6 },
  bulletDot: { width: 18, lineHeight: 22 },
  bulletText: { flex: 1 },
  card: { marginTop: 10, paddingVertical: 18, paddingHorizontal: 22, borderWidth: 1, borderRadius: 12 },
  cardTitle: { marginBottom: 4 },
  cardLine: { marginBottom: 4 },
});

export default LegalScreen;
