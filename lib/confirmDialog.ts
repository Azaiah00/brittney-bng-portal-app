// Cross-platform confirmation for destructive / two-choice actions.
// React Native Web's Alert.alert often does not invoke button onPress callbacks reliably
// for multi-button dialogs, so web uses window.confirm instead.

import { Alert, Platform } from 'react-native';
import type { AlertButton } from 'react-native';

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmText: string;
  cancelText?: string;
  destructive?: boolean;
};

export function confirmAsync(options: ConfirmOptions): Promise<boolean> {
  const cancelText = options.cancelText ?? 'Cancel';
  const body = options.message ?? '';

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const line = body ? `${options.title}\n\n${body}` : options.title;
    return Promise.resolve(window.confirm(line));
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const buttons: AlertButton[] = [
      { text: cancelText, style: 'cancel', onPress: () => finish(false) },
      {
        text: options.confirmText,
        style: options.destructive ? 'destructive' : 'default',
        onPress: () => finish(true),
      },
    ];

    const alertOptions =
      Platform.OS === 'android'
        ? { cancelable: true, onDismiss: () => finish(false) }
        : undefined;

    Alert.alert(options.title, body, buttons, alertOptions);
  });
}
