import Constants from 'expo-constants';

/**
 * Environment configuration sourced from `app.json` -> `expo.extra`.
 * Keeping this in one typed module means screens/services never reach into
 * `Constants.expoConfig` directly, and swapping environments is a config change.
 */
/** Which data source backs the repositories. See `repositories.ts`. */
export type DataSourceKind = 'mock' | 'manifest';

type AppExtra = {
  cdnBaseUrl: string;
  useMock: boolean;
  /** Explicit source selector; takes precedence over `useMock` when set. */
  dataSource: DataSourceKind;
  /**
   * Identity API host (Bearer-token auth). Owns ALL auth/account flows under
   * `/api/auth/*`; in prod it delegates credential checks to JubileeInspire
   * server-side, so the client never talks to JI directly. See `API docs/API.md`.
   *
   * `torahsings-api` is a replica of the Jubilujah identity API backed by the
   * `torahsings` database, and serves the same `/api/auth/*` contract. Both hosts
   * are live; the app follows the web (`TorahSings.com/next.config.mjs`).
   */
  authBaseUrl: string;
  /**
   * Host for the dynamic-content config endpoint (`/api/mobile/config`) ONLY.
   *
   * This is NOT on `authBaseUrl`, and the split is still load-bearing: verified
   * 2026-08-12, api.jubilujah.com serves the real curated payload (~86 KB of
   * categories) while api.torahsings.com answers the same path with an empty
   * `{"version":2,"generated":null,"categories":[]}`. Pointing this at the
   * identity host would silently blank the curated Home feed, so the mobile CMS
   * host stays tracked separately until that content is migrated.
   */
  mobileConfigBaseUrl?: string;
  /**
   * Dev override for the catalog manifest (`/catalog-manifest.json`) ONLY —
   * the source of albums, artists and categories. Media (audio, covers) keeps
   * flowing through `cdnBaseUrl`, which is the only host that serves it. Point
   * this at a local web server to browse a locally-built catalog. Unset in prod.
   */
  catalogBaseUrl?: string;
  /** Cloudflare Turnstile site key for the sign-in CAPTCHA (empty = CAPTCHA off). */
  turnstileSiteKey: string;
  /** Origin the Turnstile widget runs under (must be allow-listed for the site key). */
  turnstileBaseUrl: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<AppExtra>;

const useMock = extra.useMock ?? true;

export const ENV = {
  CDN_BASE_URL: extra.cdnBaseUrl ?? 'https://cdn.torahsings.com',
  USE_MOCK: useMock,
  // Backward-compatible: fall back to the old boolean when `dataSource` is unset.
  DATA_SOURCE: (extra.dataSource ?? (useMock ? 'mock' : 'manifest')) as DataSourceKind,
  // Identity API — single host for every /api/auth/* call (Bearer).
  API_AUTH_BASE: extra.authBaseUrl ?? 'https://api.torahsings.com',
  // Host for the dynamic-content config ONLY. Deliberately NOT chained to
  // `authBaseUrl` — see mobileConfigBaseUrl above for why.
  MOBILE_CONFIG_BASE: extra.mobileConfigBaseUrl ?? 'https://api.jubilujah.com',
  // Host for the catalog MANIFEST ONLY (albums/artists/categories). Defaults to
  // the CDN so prod is unchanged; override via extra.catalogBaseUrl to browse a
  // locally-built catalog. Media still resolves against CDN_BASE_URL.
  CATALOG_BASE_URL: extra.catalogBaseUrl ?? extra.cdnBaseUrl ?? 'https://cdn.torahsings.com',
  // Cloudflare Turnstile (sign-in CAPTCHA). Empty disables the widget.
  TURNSTILE_SITE_KEY: extra.turnstileSiteKey ?? '',
  TURNSTILE_BASE_URL: extra.turnstileBaseUrl ?? 'https://jubilujah.com',
} as const;
