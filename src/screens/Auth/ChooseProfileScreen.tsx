import React, { useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppText } from '@/components/common';
import { MUSIC_PROFILE_HERO } from '@/screens/Onboarding/musicImages';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const HERO_H = Math.round(SCREEN_H * 0.58);
const TILE = Math.min((SCREEN_W - 48 - 20) / 2, 88);
const GRID_GAP = 18;
const GRID_W = TILE * 2 + GRID_GAP; // exactly two columns → 2×2
// Gold, matching theme.colors.accent (see theme/colors).
const ACCENT = '#ffd877';
// Gold is light — white on it is ~1.4:1 and unreadable, so filled
// accent surfaces use this instead.
const ON_ACCENT = '#0B0B0F';

interface Profile {
  key: string;
  name: string;
  color: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  kids?: boolean;
}

const PROFILES: Profile[] = [
  { key: 'me', name: 'Sandeep Ag…', color: '#2F6BEA', icon: 'happy' },
  { key: 'kids', name: 'Kids', color: '#F4C20D', icon: 'happy', kids: true },
];

interface ChooseProfileScreenProps {
  /** Called when a profile (or Add) is chosen → enter the app. */
  onSelect: () => void;
}

/**
 * "Choose your profile" gate for an authenticated session (Netflix-style),
 * shown on every launch before the app. Selecting a profile (or Add) enters the
 * app; Edit toggles a manage mode.
 */
export const ChooseProfileScreen: React.FC<ChooseProfileScreenProps> = ({ onSelect }) => {
  const [editing, setEditing] = useState(false);

  const goSignIn = onSelect;

  const renderTile = (
    key: string,
    avatar: React.ReactNode,
    label: string,
    onPress: () => void,
    labelMuted?: boolean,
  ) => (
    <Pressable key={key} style={styles.tile} onPress={onPress}>
      <View style={[styles.avatar, { width: TILE, height: TILE }]}>{avatar}</View>
      <AppText
        variant="h3"
        color={labelMuted ? 'textMuted' : 'text'}
        numberOfLines={1}
        style={styles.tileLabel}
      >
        {label}
      </AppText>
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Featured hero. */}
      <View style={[styles.hero, { height: HERO_H }]}>
        <Image
          source={{ uri: MUSIC_PROFILE_HERO }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(11,11,15,0.6)', '#0B0B0F']}
          locations={[0, 0.7, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </View>

      <SafeAreaView style={styles.body} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.badge}>
            <View style={styles.topBox}>
              <AppText variant="caption" style={styles.topBoxText}>
                TOP
              </AppText>
            </View>
            <AppText variant="label" style={styles.badgeText}>
              #1 in Music Today
            </AppText>
          </View>

          <AppText variant="h1" style={styles.heading}>
            Choose your profile
          </AppText>

          <View style={styles.grid}>
            {PROFILES.map((p) =>
              renderTile(
                p.key,
                <View style={[styles.avatarFill, { backgroundColor: p.color }]}>
                  {p.kids ? (
                    <AppText style={styles.kidsText}>kids</AppText>
                  ) : (
                    <Ionicons name={p.icon} size={Math.round(TILE * 0.5)} color="#0B0B0F" />
                  )}
                  {editing ? (
                    <View style={styles.editOverlay}>
                      <Ionicons name="pencil" size={26} color="#fff" />
                    </View>
                  ) : null}
                </View>,
                p.name,
                goSignIn,
              ),
            )}

            {renderTile(
              'add',
              <View style={[styles.avatarFill, styles.addTile]}>
                <Ionicons name="add" size={Math.round(TILE * 0.45)} color="#FFFFFF" />
              </View>,
              'Add',
              goSignIn,
              true,
            )}

            {renderTile(
              'edit',
              <View style={[styles.avatarFill, styles.addTile]}>
                <Ionicons name="pencil" size={Math.round(TILE * 0.36)} color="#FFFFFF" />
              </View>,
              'Edit',
              () => setEditing((v) => !v),
              true,
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B0F' },
  hero: { width: '100%' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center', marginBottom: 16 },
  topBox: { backgroundColor: ACCENT, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 },
  topBoxText: { color: ON_ACCENT, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  badgeText: { color: '#fff' },
  body: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40 },
  heading: { textAlign: 'center', marginBottom: 22 },
  grid: {
    width: GRID_W,
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: GRID_GAP,
  },
  tile: { width: TILE, alignItems: 'center' },
  avatar: { borderRadius: 16, overflow: 'hidden' },
  avatarFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  addTile: { backgroundColor: '#1C1C26' },
  kidsText: { color: '#0B0B0F', fontSize: Math.round(TILE * 0.34), fontWeight: '900' },
  editOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: { marginTop: 10, maxWidth: TILE, textAlign: 'center' },
});

export default ChooseProfileScreen;
