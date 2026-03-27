/**
 * Lightweight toast/alert utility.
 * Currently backed by console.warn for the skeleton.
 * Replace the adapter body to use react-native-toast-message or similar.
 */

type ToastLevel = 'info' | 'success' | 'warning' | 'error';

interface ToastOptions {
  title: string;
  message?: string;
  level?: ToastLevel;
  durationMs?: number;
}

// Adapter — swap this body when a real toast library is wired up.
function _showToast(options: ToastOptions): void {
  const tag = `[toast:${options.level ?? 'info'}]`;
  if (options.message) {
    console.warn(`${tag} ${options.title} — ${options.message}`);
  } else {
    console.warn(`${tag} ${options.title}`);
  }
}

export const toast = {
  info: (title: string, message?: string) => _showToast({ title, message, level: 'info' }),
  success: (title: string, message?: string) => _showToast({ title, message, level: 'success' }),
  warning: (title: string, message?: string) => _showToast({ title, message, level: 'warning' }),
  error: (title: string, message?: string) => _showToast({ title, message, level: 'error' }),
};
