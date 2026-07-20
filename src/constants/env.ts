import Constants from 'expo-constants';

/**
 * Environment configuration sourced from `app.json` -> `expo.extra`.
 * Keeping this in one typed module means screens/services never reach into
 * `Constants.expoConfig` directly, and swapping environments is a config change.
 */
/** Which data source backs the repositories. See `repositories.ts`. */
export type DataSourceKind = 'mock' | 'manifest' | 'api';

type AppExtra = {
  cdnBaseUrl: string;
  apiBaseUrl: string;
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
   * This is NOT on `authBaseUrl`: `/api/mobile/config` is 404 on
   * api.torahsings.com and only served by api.jubilujah.com, so the mobile CMS
   * host is tracked separately from the identity host.
   */
  mobileConfigBaseUrl?: string;
  /**
   * Dev override for the catalog manifest (`/music/catalog-manifest.json`) ONLY —
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
  CDN_BASE_URL: extra.cdnBaseUrl ?? 'https://cdn.jubileeverse.com',
  API_BASE_URL: extra.apiBaseUrl ?? 'https://api.jubileeverse.com/v1',
  USE_MOCK: useMock,
  // Backward-compatible: fall back to the old boolean when `dataSource` is unset.
  DATA_SOURCE: (extra.dataSource ?? (useMock ? 'mock' : 'api')) as DataSourceKind,
  // Identity API — single host for every /api/auth/* call (Bearer).
  API_AUTH_BASE: extra.authBaseUrl ?? 'https://api.torahsings.com',
  // Host for the dynamic-content config ONLY. Deliberately NOT chained to
  // `authBaseUrl`: /api/mobile/config is 404 on api.torahsings.com and lives
  // only on api.jubilujah.com.
  MOBILE_CONFIG_BASE: extra.mobileConfigBaseUrl ?? 'https://api.jubilujah.com',
  // Host for the catalog MANIFEST ONLY (albums/artists/categories). Defaults to
  // the CDN so prod is unchanged; override via extra.catalogBaseUrl to browse a
  // locally-built catalog. Media still resolves against CDN_BASE_URL.
  CATALOG_BASE_URL: extra.catalogBaseUrl ?? extra.cdnBaseUrl ?? 'https://cdn.jubileeverse.com',
  // Cloudflare Turnstile (sign-in CAPTCHA). Empty disables the widget.
  TURNSTILE_SITE_KEY: extra.turnstileSiteKey ?? '',
  TURNSTILE_BASE_URL: extra.turnstileBaseUrl ?? 'https://jubilujah.com',
} as const;
