import React, { useState } from 'react';
import { Welcome } from './Welcome';
import { GetStarted } from './GetStarted';

interface OnboardingProps {
  /** Called when onboarding is finished and the main app should be shown. */
  onComplete: () => void;
}

type Step = 'welcome' | 'signin';

/**
 * First-launch onboarding flow:
 *  1. `welcome` — swipeable welcome slides (Get Started / Sign In).
 *  2. `signin`  — the "Ready to listen?" sign-in / get-started screen.
 * Finishing the sign-in step completes onboarding and reveals the app.
 */
export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState<Step>('welcome');

  if (step === 'signin') {
    return <GetStarted onBack={() => setStep('welcome')} onContinue={onComplete} />;
  }
  return <Welcome onGetStarted={() => setStep('signin')} />;
};

export default Onboarding;
