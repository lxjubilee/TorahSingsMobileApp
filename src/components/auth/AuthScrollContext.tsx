import React, { createContext, useContext } from 'react';
import type { View } from 'react-native';

interface AuthScrollValue {
  /**
   * Report the field that just took focus. The shell measures it against the
   * keyboard and scrolls it clear if it's covered.
   */
  onFieldFocus: (node: View | null) => void;
  /** Report that a field lost focus, so a stale node isn't re-scrolled to. */
  onFieldBlur: (node: View | null) => void;
}

const noop = () => undefined;

const AuthScrollContext = createContext<AuthScrollValue>({
  onFieldFocus: noop,
  onFieldBlur: noop,
});

export const AuthScrollProvider = AuthScrollContext.Provider;

/**
 * Lets any field inside `AuthShell` ask to be scrolled clear of the keyboard.
 * Safe to call outside the shell — it degrades to a no-op.
 */
export const useAuthScroll = (): AuthScrollValue => useContext(AuthScrollContext);

export type { AuthScrollValue };
