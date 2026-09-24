import { Alert, AlertButton, Platform } from "react-native";

/**
 * Cross-platform replacement for Alert.alert.
 * React Native Web's Alert.alert is a no-op, so on web we fall back to
 * window.alert / window.confirm.
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS !== "web") {
    Alert.alert(title, message, buttons);
    return;
  }

  const text = message ? `${title}\n\n${message}` : title;
  const cancel = buttons?.find((b) => b.style === "cancel");
  const actions = buttons?.filter((b) => b.style !== "cancel") ?? [];

  if (cancel && actions.length > 0) {
    if (window.confirm(text)) actions[0].onPress?.();
    else cancel.onPress?.();
    return;
  }

  window.alert(text);
  actions[0]?.onPress?.();
}
