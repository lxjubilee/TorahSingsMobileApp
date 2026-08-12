import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FloatingPressable } from './FloatingField';
import { GoldButton } from './GoldButton';
import { authPalette as C } from './authPalette';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const daysInMonth = (year: number, monthIdx: number) => new Date(year, monthIdx + 1, 0).getDate();

/** Youngest permitted account holder — a client-side gate; the API stores no DOB. */
export const MIN_AGE = 13;

/** `yyyy-mm-dd`, the wire format `/api/auth/signin` expects for `date_of_birth`. */
const toIso = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

/** Parses `yyyy-mm-dd` into local date parts; null when absent or malformed. */
const fromIso = (iso: string | null): { y: number; m: number; d: number } | null => {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]) - 1, d: Number(match[3]) };
};

/** Human-readable form for the closed field, e.g. "4 Mar 1990". */
const formatIso = (iso: string): string => {
  const p = fromIso(iso);
  return p ? `${p.d} ${MONTHS[p.m]} ${p.y}` : iso;
};

/** Whole years from a `yyyy-mm-dd` date to today; NaN when unparseable. */
export function ageFromDob(iso: string): number {
  const p = fromIso(iso);
  if (!p) return NaN;
  const now = new Date();
  let age = now.getFullYear() - p.y;
  const m = now.getMonth() - p.m;
  if (m < 0 || (m === 0 && now.getDate() < p.d)) age -= 1;
  return age;
}

interface DobFieldProps {
  /** `yyyy-mm-dd`, or null when unset. */
  value: string | null;
  onChange: (iso: string) => void;
  label: string;
}

/**
 * Date-of-birth field backed by a pure-JS day/month/year picker (no native
 * date-picker dependency). Salvaged from the old SignUpScreen and restyled onto
 * the auth panel's `FloatingPressable`; the value is now the ISO string the API
 * takes rather than a `Date`, so it can be sent straight through.
 */
export const DobField: React.FC<DobFieldProps> = ({ value, onChange, label }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const thisYear = new Date().getFullYear();
  // Reasonable date-of-birth range: 13–100 years old.
  const years = useMemo(
    () => Array.from({ length: 88 }, (_, i) => thisYear - MIN_AGE - i),
    [thisYear],
  );

  const parsed = fromIso(value);
  const [year, setYear] = useState(parsed?.y ?? thisYear - 18);
  const [month, setMonth] = useState(parsed?.m ?? 0);
  const [day, setDay] = useState(parsed?.d ?? 1);

  const maxDay = daysInMonth(year, month);
  const safeDay = Math.min(day, maxDay);
  // Always show 1–31; days that don't exist in the chosen month are disabled
  // (greyed out) rather than vanishing, so it's clear why they can't be picked.
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  /** Re-seed the wheels from the current value each time the sheet opens. */
  const openSheet = () => {
    const p = fromIso(value);
    if (p) {
      setYear(p.y);
      setMonth(p.m);
      setDay(p.d);
    }
    setOpen(true);
  };

  const confirm = () => {
    onChange(toIso(year, month, safeDay));
    setOpen(false);
  };

  return (
    <>
      <FloatingPressable label={label} adornment="calendar-outline" onPress={openSheet}>
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value ? formatIso(value) : t('auth.common.dobPlaceholder')}
        </Text>
      </FloatingPressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <View style={styles.wheels}>
              <Column
                data={days}
                selected={safeDay}
                onSelect={setDay}
                render={(d) => `${d}`}
                isDisabled={(d) => d > maxDay}
              />
              <Column
                data={MONTHS.map((_, i) => i)}
                selected={month}
                onSelect={setMonth}
                render={(i) => MONTHS[i]}
              />
              <Column data={years} selected={year} onSelect={setYear} render={(y) => `${y}`} />
            </View>
            <GoldButton label={t('common.done')} onPress={confirm} />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

/** A scrollable, selectable column used by the date picker. */
function Column<T extends number>({
  data,
  selected,
  onSelect,
  render,
  isDisabled,
}: {
  data: T[];
  selected: T;
  onSelect: (v: T) => void;
  render: (v: T) => string;
  isDisabled?: (v: T) => boolean;
}) {
  return (
    <ScrollView
      style={styles.column}
      contentContainerStyle={styles.columnContent}
      showsVerticalScrollIndicator={false}
    >
      {data.map((v) => {
        const active = v === selected;
        const disabled = isDisabled?.(v) ?? false;
        return (
          <Pressable
            key={`${v}`}
            disabled={disabled}
            onPress={() => onSelect(v)}
            style={styles.columnItem}
          >
            <Text
              style={[
                styles.columnText,
                active ? styles.columnTextActive : null,
                disabled ? styles.columnTextDisabled : null,
              ]}
              numberOfLines={1}
            >
              {render(v)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  value: { flex: 1, color: '#fff', fontSize: 14 },
  placeholder: { color: C.placeholder },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.panel,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  sheetTitle: {
    color: C.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  wheels: { flexDirection: 'row', height: 220, marginBottom: 16 },
  column: { flex: 1 },
  columnContent: { paddingVertical: 8 },
  columnItem: { paddingVertical: 8, alignItems: 'center' },
  columnText: { color: C.textMuted, fontSize: 16 },
  columnTextActive: { color: C.gold, fontSize: 18, fontWeight: '700' },
  columnTextDisabled: { color: C.footer, opacity: 0.4 },
});
