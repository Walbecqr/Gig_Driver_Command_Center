export function captureException(error: unknown, context?: Record<string, unknown>): void {
  console.error('[crash] captured exception:', error, context);
  // TODO: wire to Sentry / Honeybadger / Bugsnag
}
