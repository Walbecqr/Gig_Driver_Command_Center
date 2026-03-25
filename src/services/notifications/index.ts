interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export function scheduleNotification(payload: NotificationPayload): void {
  console.debug('[notifications] schedule', payload);
  // TODO: integrate with Expo Notifications / platform native execution
}

export function cancelAllNotifications(): void {
  console.debug('[notifications] cancel all');
}
