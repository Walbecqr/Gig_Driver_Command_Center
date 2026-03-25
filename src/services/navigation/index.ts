export function openExternalNavigation(lat: number, lon: number, label?: string): void {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}${label ? `&destination_place_id=${encodeURIComponent(label)}` : ''}`;
  console.debug('[navigation] deep link', url);
  // TODO: use Linking.openURL(url) or platform-specific deep-link maps provider
}
