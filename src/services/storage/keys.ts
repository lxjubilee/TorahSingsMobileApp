/** Namespaced AsyncStorage keys. Keep all persisted keys here to avoid clashes. */
export const STORAGE_KEYS = {
  PERSIST_ROOT: 'jubilujah:root',
  RECENT_SEARCHES: 'jubilujah:recentSearches',
  AUTH_TOKEN: 'jubilujah:authToken',
  /** Set once the user finishes the first-launch onboarding. */
  ONBOARDING_DONE: 'jubilujah:onboardingDone',
  /** Set once the "a secret hidden in the text" intro has been dismissed. */
  DISCOVERY_INTRO_SEEN: 'jubilujah:discoveryIntroSeen',
  /**
   * Catalog manifest is cached chunked (it exceeds Android's ~2 MB row limit).
   *
   * `:v2` because the cached shape changed with the move to the Torah Sings CDN:
   * a v1 snapshot holds JubileeVerse paths that 404 on the new host, so it must
   * never be served. v1 keys are purged on first load — see `manifestClient`.
   */
  CATALOG_MANIFEST_META: 'jubilujah:catalogManifest:v2:meta',
  CATALOG_MANIFEST_CHUNK: 'jubilujah:catalogManifest:v2:chunk:',
  /** Retired v1 catalog cache; retained only so it can be deleted. */
  LEGACY_CATALOG_MANIFEST_META: 'jubilujah:catalogManifest:meta',
  LEGACY_CATALOG_MANIFEST_CHUNK: 'jubilujah:catalogManifest:chunk:',
  /** Admin-managed mobile category config (small JSON; stale-while-revalidate). */
  MOBILE_CONFIG: 'jubilujah:mobileConfig',
} as const;
