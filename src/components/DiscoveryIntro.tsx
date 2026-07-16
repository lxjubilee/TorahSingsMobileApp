import React, { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { storage, STORAGE_KEYS } from '@/services/storage';

// Web intro-modal palette (TorahSings.com), consistent with the catalog port.
const ACCENT_SOFT = '#ffd877'; // eyebrow / gold accents
const GOLD_BTN = '#f7ca57'; // primary button fill
const CARD_BG = '#161d33'; // dark navy dialog
const INK = '#f0ebe3'; // title (warm white)
const INK_BODY = '#b8bcd4'; // body copy

const MONO = Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' });

/**
 * "A secret hidden in the text" intro dialog, ported from the web app's
 * first-open modal: eyebrow → headline → lede → gold aside, with BEGIN THE
 * DISCOVERY / SKIP FOR NOW / × — all of which reveal the app (web parity).
 * Shows on the FIRST launch only, right after the splash finishes; dismissing
 * it persists a flag so it never comes back (clear app data to see it again).
 */
export const DiscoveryIntro: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  // null = still reading the persisted flag; render nothing until it resolves.
  const [seen, setSeen] = useState<boolean | null>(null);

  useEffect(() => {
    void storage
      .getItem<boolean>(STORAGE_KEYS.DISCOVERY_INTRO_SEEN)
      .then((done) => setSeen(Boolean(done)));
  }, []);

  if (!enabled || seen !== false) return null;
  const close = () => {
    setSeen(true);
    void storage.setItem(STORAGE_KEYS.DISCOVERY_INTRO_SEEN, true);
  };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Pressable
            onPress={close}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={({ pressed }) => [styles.close, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={styles.closeGlyph}>×</Text>
          </Pressable>

          <Text style={styles.eyebrow}>● A SECRET HIDDEN IN THE TEXT</Text>

          <Text style={styles.title}>There are songs inside the Scriptures. Almost no one knows.</Text>

          <Text style={styles.body}>
            Not songs about the Scriptures. Songs <Text style={styles.italic}>in</Text> them —
            surfaced from the Paleo-Hebrew itself, read symbol by symbol, sung from the perspective
            of the ones who were already singing when the foundations went down. We have been
            quietly working on this for a long time. It is not theory. The songs exist.
          </Text>

          <Text style={styles.aside}>Please don&rsquo;t share this. (You will.)</Text>

          <View style={styles.buttons}>
            <Pressable
              onPress={close}
              style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={styles.primaryLabel}>BEGIN THE DISCOVERY</Text>
            </Pressable>
            <Pressable
              onPress={close}
              style={({ pressed }) => [styles.ghostBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={styles.ghostLabel}>SKIP FOR NOW</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    alignSelf: 'stretch',
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 24,
    paddingTop: 28,
  },
  close: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,216,119,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeGlyph: { color: INK, fontSize: 18, lineHeight: 20, includeFontPadding: false },
  eyebrow: {
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '700',
    color: ACCENT_SOFT,
    marginBottom: 14,
    paddingRight: 40, // keep clear of the close button
  },
  title: { fontSize: 25, lineHeight: 32, fontWeight: '800', color: INK, marginBottom: 14 },
  body: { fontSize: 14, lineHeight: 22, color: INK_BODY },
  italic: { fontStyle: 'italic' },
  aside: { fontStyle: 'italic', fontSize: 14, color: ACCENT_SOFT, marginTop: 14 },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 22 },
  primaryBtn: {
    backgroundColor: GOLD_BTN,
    borderRadius: 999,
    paddingVertical: 13,
    paddingHorizontal: 22,
  },
  primaryLabel: {
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: 1.4,
    fontWeight: '700',
    color: '#1a1405',
  },
  ghostBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 999,
    paddingVertical: 13,
    paddingHorizontal: 22,
  },
  ghostLabel: {
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: 1.4,
    fontWeight: '700',
    color: INK,
  },
});
