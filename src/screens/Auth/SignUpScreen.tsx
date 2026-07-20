import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AppText, BrandLogo, IconButton, PasswordInput } from '@/components/common';
import { useAppDispatch } from '@/hooks';
import { requestSignup } from '@/redux';
import type { AuthStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;
const ACCENT = '#007FFF'; // Azure blue accent
const MUTED = '#8A8A99';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const daysInMonth = (year: number, monthIdx: number) => new Date(year, monthIdx + 1, 0).getDate();
const formatDob = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

const MIN_AGE = 13;
/** Whole-year age from a date of birth as of today. */
const ageFrom = (d: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1;
  return age;
};

/**
 * Create-account UI. The backend signup contract isn't available yet, so submit
 * shows a "coming soon" notice rather than calling the API. The form,
 * validation, and layout are production-ready for when the endpoint lands.
 */
export const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emailValid = /^\S+@\S+\.\S+$/.test(email.trim());
  const passwordsMatch = password.length >= 8 && password === confirm;
  const ageOk = dob != null && ageFrom(dob) >= MIN_AGE;
  const canSubmit =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    ageOk &&
    emailValid &&
    passwordsMatch &&
    agreed &&
    !submitting;

  const clearNotice = () => notice && setNotice(null);

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const name = `${firstName.trim()} ${lastName.trim()}`.trim();
      const res = await dispatch(requestSignup({ name, email, password })).unwrap();
      navigation.navigate('VerifySignup', {
        verificationGuid: res.verificationGuid,
        email: res.email,
      });
    } catch (e) {
      setNotice(typeof e === 'string' ? e : t('auth.signup.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const field = (
    placeholder: string,
    value: string,
    set: (v: string) => void,
    opts?: { secure?: boolean; email?: boolean; style?: object },
  ) => (
    <TextInput
      value={value}
      onChangeText={(v) => {
        set(v);
        clearNotice();
      }}
      placeholder={placeholder}
      placeholderTextColor={MUTED}
      secureTextEntry={opts?.secure}
      keyboardType={opts?.email ? 'email-address' : 'default'}
      autoCapitalize={opts?.email ? 'none' : 'words'}
      autoCorrect={false}
      style={[styles.input, opts?.style]}
    />
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <IconButton name="arrow-back" size={26} onPress={() => navigation.goBack()} />
          <BrandLogo textStyle={styles.logo} />
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator
          >
            <AppText style={styles.title}>{t('auth.signup.title')}</AppText>
            <AppText variant="body" color="textSecondary" style={styles.subtitle}>
              {t('auth.signup.subtitle')}
            </AppText>

            <View style={styles.nameRow}>
              {field(t('auth.signup.firstName'), firstName, setFirstName, { style: styles.nameField })}
              {field(t('auth.signup.lastName'), lastName, setLastName, { style: styles.nameField })}
            </View>

            {field(t('auth.signup.email'), email, setEmail, { email: true })}

            <DateField
              value={dob}
              onChange={(d) => {
                setDob(d);
                clearNotice();
              }}
            />

            {dob != null && !ageOk ? (
              <AppText variant="bodySm" style={styles.error}>
                {t('auth.signup.ageError', { age: MIN_AGE })}
              </AppText>
            ) : null}
            <PasswordInput
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                clearNotice();
              }}
              placeholder={t('auth.signup.password')}
              containerStyle={styles.pwField}
            />
            <PasswordInput
              value={confirm}
              onChangeText={(v) => {
                setConfirm(v);
                clearNotice();
              }}
              placeholder={t('auth.signup.confirm')}
              containerStyle={styles.pwField}
            />

            {confirm.length > 0 && password !== confirm ? (
              <AppText variant="bodySm" style={styles.error}>
                {t('auth.signup.mismatch')}
              </AppText>
            ) : null}

            <Pressable style={styles.agreeRow} onPress={() => setAgreed((v) => !v)} hitSlop={6}>
              <Ionicons
                name={agreed ? 'checkbox' : 'square-outline'}
                size={24}
                color={agreed ? ACCENT : MUTED}
              />
              <AppText variant="bodySm" color="textSecondary" style={styles.agreeText}>
                {t('auth.signup.agreePrefix')}
                <AppText
                  variant="bodySm"
                  style={styles.link}
                  onPress={() => navigation.navigate('TermsOfUse')}
                >
                  {t('profile.termsOfUse')}
                </AppText>
                {t('auth.signup.and')}
                <AppText
                  variant="bodySm"
                  style={styles.link}
                  onPress={() => navigation.navigate('PrivacyPolicy')}
                >
                  {t('profile.privacyPolicy')}
                </AppText>
              </AppText>
            </Pressable>

            {notice ? (
              <AppText variant="bodySm" style={styles.notice}>
                {notice}
              </AppText>
            ) : null}

            <Pressable
              onPress={onSubmit}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.cta,
                { opacity: !canSubmit ? 0.6 : pressed ? 0.85 : 1 },
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <AppText variant="h3" style={styles.ctaLabel}>
                  {t('auth.signup.submit')}
                </AppText>
              )}
            </Pressable>

            <View style={styles.signinRow}>
              <AppText variant="body" color="textMuted">
                {t('auth.signup.havePrompt')}
              </AppText>
              <Pressable hitSlop={6} onPress={() => navigation.navigate('SignIn')}>
                <AppText variant="body" style={styles.signinLink}>
                  {t('auth.signup.signIn')}
                </AppText>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

/** Tappable field that opens a pure-JS day/month/year picker (no native dep). */
const DateField: React.FC<{ value: Date | null; onChange: (d: Date) => void }> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const thisYear = new Date().getFullYear();
  // Reasonable date-of-birth range: 13–100 years old.
  const years = useMemo(
    () => Array.from({ length: 88 }, (_, i) => thisYear - 13 - i),
    [thisYear],
  );

  const [year, setYear] = useState(value?.getFullYear() ?? thisYear - 18);
  const [month, setMonth] = useState(value?.getMonth() ?? 0);
  const [day, setDay] = useState(value?.getDate() ?? 1);

  const maxDay = daysInMonth(year, month);
  const safeDay = Math.min(day, maxDay);
  // Always show 1–31; days that don't exist in the chosen month are disabled
  // (greyed out) rather than vanishing, so it's clear why they can't be picked.
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const confirm = () => {
    onChange(new Date(year, month, safeDay));
    setOpen(false);
  };

  return (
    <>
      <Pressable style={styles.input} onPress={() => setOpen(true)}>
        <AppText style={[styles.dateText, !value && styles.datePlaceholder]}>
          {value ? formatDob(value) : t('auth.signup.dateOfBirth')}
        </AppText>
        <Ionicons name="calendar-outline" size={20} color={MUTED} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.modalSheet}>
            <AppText variant="h2" style={styles.modalTitle}>
              {t('auth.signup.dateOfBirth')}
            </AppText>
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
            <Pressable style={styles.doneBtn} onPress={confirm}>
              <AppText variant="h3" style={styles.ctaLabel}>
                {t('common.done')}
              </AppText>
            </Pressable>
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
            <AppText
              style={[
                styles.columnText,
                active ? styles.columnTextActive : null,
                disabled ? styles.columnTextDisabled : null,
              ]}
              numberOfLines={1}
            >
              {render(v)}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B0F' },
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 6,
  },
  logo: { color: ACCENT, fontSize: 20, lineHeight: 26, fontWeight: '900', letterSpacing: 1 },
  content: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 60 },
  title: { color: '#FFFFFF', fontSize: 28, lineHeight: 36, fontWeight: '800' },
  subtitle: { marginTop: 12, fontSize: 16, lineHeight: 22 },
  input: {
    marginTop: 14,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    borderRadius: 6,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameRow: { flexDirection: 'row', gap: 12 },
  nameField: { flex: 1 },
  pwField: { marginTop: 14 },
  dateText: { color: '#FFFFFF', fontSize: 16 },
  datePlaceholder: { color: MUTED },
  error: { marginTop: 10, color: '#FF4D5E' },
  agreeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 18 },
  agreeText: { flex: 1, lineHeight: 20 },
  link: { color: '#FFFFFF', fontWeight: '700', textDecorationLine: 'underline' },
  notice: { marginTop: 16, color: '#F5C518' },
  cta: {
    marginTop: 22,
    backgroundColor: ACCENT,
    height: 52,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: { color: '#FFFFFF', fontWeight: '700' },
  signinRow: { flexDirection: 'row', alignItems: 'center', marginTop: 26 },
  signinLink: { color: '#FFFFFF', fontWeight: '700' },
  // Date picker modal
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: {
    backgroundColor: '#15151C',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  modalTitle: { textAlign: 'center', marginBottom: 12 },
  wheels: { flexDirection: 'row', height: 220 },
  column: { flex: 1 },
  columnContent: { paddingTop: 4, paddingBottom: 28 },
  columnItem: { paddingVertical: 10, alignItems: 'center' },
  columnText: { color: MUTED, fontSize: 18 },
  columnTextActive: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  columnTextDisabled: { color: 'rgba(255,255,255,0.18)' },
  doneBtn: {
    marginTop: 14,
    backgroundColor: ACCENT,
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SignUpScreen;
