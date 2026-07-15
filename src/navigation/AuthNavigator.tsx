import React from 'react';
import { NavigationContainer, DarkTheme, Theme as NavTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/context';
import { storage, STORAGE_KEYS } from '@/services/storage';
import { Welcome } from '@/screens/Onboarding/Welcome';
import {
  SignInScreen,
  TwoFactorScreen,
  SignUpScreen,
  VerifySignupScreen,
  ForgotPasswordScreen,
} from '@/screens/Auth';
import { PrivacyPolicyScreen, TermsOfUseScreen } from '@/screens/Legal';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

type WelcomeNav = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

/** Wraps the welcome slides: advancing marks onboarding done + goes to Sign In. */
const WelcomeRoute: React.FC = () => {
  const navigation = useNavigation<WelcomeNav>();
  return (
    <Welcome
      onGetStarted={() => {
        void storage.setItem(STORAGE_KEYS.ONBOARDING_DONE, true);
        navigation.navigate('SignIn');
      }}
    />
  );
};

interface AuthNavigatorProps {
  /** First-run starts at Welcome; returning/signed-out users at Sign In. */
  initialRoute: 'Welcome' | 'SignIn';
}

/**
 * Unauthenticated navigation stack. Rendered by App when the user isn't signed
 * in; its own NavigationContainer so it never coexists with the main app stack.
 */
export const AuthNavigator: React.FC<AuthNavigatorProps> = ({ initialRoute }) => {
  const theme = useTheme();
  const navTheme: NavTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: theme.colors.background,
      card: theme.colors.background,
      text: theme.colors.text,
      primary: theme.colors.primary,
      border: theme.colors.border,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeRoute} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="TwoFactor" component={TwoFactorScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="VerifySignup" component={VerifySignupScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        <Stack.Screen name="TermsOfUse" component={TermsOfUseScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
