import React, { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useAppSelector } from '@/hooks';
import { AppText } from './AppText';
import { IconButton } from './IconButton';

// Brand yellow/gold (matches the "Lujah" wordmark and the Profile avatar).
const AVATAR_YELLOW = '#ffbd59';

interface ProfileButtonProps {
  onPress?: () => void;
  /** Diameter of the avatar circle. */
  size?: number;
}

/**
 * Header profile control: shows the signed-in user's initials in a circle —
 * first and last name, e.g. "Sandeep Agarwal" -> "SA". Users with only one
 * name get a single letter. Falls back to the generic person icon when no
 * name is available.
 */
export const ProfileButton: React.FC<ProfileButtonProps> = ({ onPress, size = 32 }) => {
  const user = useAppSelector((s) => s.auth.user);

  const initial = useMemo(() => {
    const first = user?.firstName?.trim() ?? '';
    const last = user?.lastName?.trim() ?? '';
    if (first || last) return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

    // No split name on the account: take the first two words of the display
    // name, else fall back to a single letter from whatever is left.
    const fallback = (user?.displayName || user?.email || '').trim();
    const words = fallback.split(/\s+/).filter(Boolean);
    if (words.length > 1) return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
    return fallback.charAt(0).toUpperCase();
  }, [user]);

  if (!initial) {
    return <IconButton name="person-circle-outline" size={size - 2} onPress={onPress} />;
  }

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: AVATAR_YELLOW,
        },
      ]}
    >
      <AppText
        style={[styles.text, { fontSize: Math.round(size * (initial.length > 1 ? 0.4 : 0.47)) }]}
        allowFontScaling={false}
      >
        {initial}
      </AppText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  text: { color: '#0B0B0F', fontWeight: '700' },
});
