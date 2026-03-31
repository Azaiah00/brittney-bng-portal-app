// Google Calendar OAuth — redirect URI must match Google Cloud Console EXACTLY (character for character).
//
// In Google Cloud Console: APIs & Services → Credentials → your OAuth 2.0 Client ID
// Application type: "Web application" (use this client’s ID in EXPO_PUBLIC_GOOGLE_CLIENT_ID for web + native, or create separate clients and set env per platform).
//
// Authorized redirect URIs — add every URL you use:
//   Web production:  https://YOUR_DOMAIN/calendar/callback     (no trailing slash)
//   Web dev Expo:    http://localhost:8081/calendar/callback    (port must match “npm run web”)
//   Custom scheme:   brittanybngremodelapp://calendar/callback (iOS/Android standalone; scheme from app.json)
//
import { Platform } from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';

const CALLBACK_PATH = 'calendar/callback';

export function getGoogleCalendarRedirectUri(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const origin = window.location.origin.replace(/\/$/, '');
    return `${origin}/${CALLBACK_PATH}`;
  }
  return makeRedirectUri({
    scheme: 'brittanybngremodelapp',
    path: CALLBACK_PATH,
  });
}
