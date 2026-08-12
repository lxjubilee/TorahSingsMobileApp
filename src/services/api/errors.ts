/**
 * The app's normalized API error shape.
 *
 * Every HTTP client rejects with this rather than a raw AxiosError, so callers
 * (redux slices, hooks, screens) read one contract regardless of which host the
 * request went to. `services/auth/authClient` is the producer — see its
 * `toApiError`.
 */
export interface ApiError {
  status: number;
  message: string;
  raw?: unknown;
}
