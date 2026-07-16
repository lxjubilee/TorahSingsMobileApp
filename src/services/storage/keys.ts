/** Namespaced AsyncStorage keys. Keep all persisted keys here to avoid clashes. */
export const STORAGE_KEYS = {
  PERSIST_ROOT: 'jubilujah:root',
  RECENT_SEARCHES: 'jubilujah:recentSearches',
  AUTH_TOKEN: 'jubilujah:authToken',
  /** Set once the user finishes the first-launch onboarding. */
  ONBOARDING_DONE: 'jubilujah:onboardingDone',
  /** Set once the "a secret hidden in the text" intro has been dismissed. */
  DISCOVERY_INTRO_SEEN: 'jubilujah:discoveryIntroSeen',
  /** Catalog manifest is cached chunked (it exceeds Android's ~2 MB row limit). */
  CATALOG_MANIFEST_META: 'jubilujah:catalogManifest:meta',
  CATALOG_MANIFEST_CHUNK: 'jubilujah:catalogManifest:chunk:',
  /** Admin-managed mobile category config (small JSON; stale-while-revalidate). */
  MOBILE_CONFIG: 'jubilujah:mobileConfig',
} as const;
