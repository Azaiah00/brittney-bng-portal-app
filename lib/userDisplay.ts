// Derive display name / initials from Supabase auth user (Google identity JWT user_metadata).
import type { User } from '@supabase/supabase-js';

/** Best-effort visible name for any logged-in user. */
export function getUserDisplayName(user: User | null | undefined): string {
  if (!user) return 'Guest';
  const m = user.user_metadata as Record<string, string | undefined> | null;
  return (
    m?.full_name?.trim() ||
    m?.name?.trim() ||
    (m?.given_name && m?.family_name ? `${m.given_name} ${m.family_name}`.trim() : '') ||
    m?.given_name?.trim() ||
    user.email?.split('@')[0]?.trim() ||
    'User'
  );
}

/** Two-letter avatar text from display name or email. */
export function getUserInitials(user: User | null | undefined): string {
  const label = getUserDisplayName(user);
  if (label === 'Guest' || label === 'User') {
    const e = user?.email;
    if (e && e.length >= 2) return e.slice(0, 2).toUpperCase();
    return '?';
  }
  const parts = label.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
  }
  return label.slice(0, Math.min(2, label.length)).toUpperCase();
}
