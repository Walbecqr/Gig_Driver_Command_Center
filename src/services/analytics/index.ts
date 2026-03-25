export function logEvent(eventName: string, payload?: Record<string, unknown>): void {
  console.debug('[analytics] event:', eventName, payload);
  // TODO: wire to a real provider (e.g., Segment, Firebase, Amplitude)
}
