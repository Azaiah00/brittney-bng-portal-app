# Supabase Migration - point BNG Hub at a new project

We are moving the app's backend to a fresh Supabase project under
`hello@realestateadvancement.com`. No data migration is needed (the old project
had no production data). We reuse the repo's schema as the blueprint, but apply
the SECURE version of it. Do the steps in order.

## 1. Create the new project
- Supabase dashboard (signed in as hello@realestateadvancement.com) -> New project.
- Save the database password.
- Settings -> API: copy the **Project URL** and the **anon public key**.

## 2. Apply the schema (SECURE version)
In the new project's **SQL Editor**, run **`supabase/NEW_DB_setup_secure.sql`**
(in this repo). Run it once.

> IMPORTANT: Do NOT run the old `supabase/APPLY_ALL_SCHEMA_UPDATES.sql` or
> `supabase/seed_mock_data_test.sql` as-is. They create `bng_anon_*` policies
> that expose every table (including Google OAuth tokens) to the public anon key
> - the critical issue from the security audit. `NEW_DB_setup_secure.sql` is the
> same schema with authenticated-only RLS and no anon policies.

This creates all tables, the lead-source picklist, storage buckets
(`log-images`, `contact-media`), and the secure RLS policies.

## 3. Auth configuration
Authentication -> URL Configuration, add redirect URLs:
```
brittanybngremodelapp://
brittanybngremodelapp://auth/callback
http://localhost:8081
```
Plus the production web URL if/when there is one.

Authentication -> Providers:
- **Google**: enable; paste the Google client ID + secret.
- **Apple** (for Sign in with Apple, required by App Store):
  Team ID, Key ID, private key (.p8), and native **Client ID = `com.bngremodel.portal`**
  (this is the app's real bundle ID - NOT `com.bngremodel.app`).

In Google Cloud Console -> Credentials, add the new redirect URI:
```
https://YOUR-NEW-PROJECT-REF.supabase.co/auth/v1/callback
```

## 4. Edge Functions (calendar + SignNow e-sign)
Deploy the functions from `supabase/functions/` to the new project and set
secrets:
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `SIGNNOW_CLIENT_ID`, `SIGNNOW_CLIENT_SECRET`, `SIGNNOW_BASE_URL` (if using e-sign)

(Can be deferred if calendar/e-sign aren't needed for the first build.)

## 5. Point the app at the new backend
In `.env` (copy from `.env.example`):
```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-NEW-REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key
```
For App Store / EAS builds, set these same values as EAS environment variables
(they are bundled at build time, so the EAS dashboard must have them).

## 6. Smoke test
- Sign in with Google (and Apple on iOS once configured).
- Create a lead, a project, a note, upload a photo.
- Confirm the rows appear in the new project's Table Editor.

## 7. Retire the old project
Once everything works, pause or delete the old Supabase project so it isn't
running (and can't leak anything) anymore.

---

### Restrict sign-ups (recommended)
The app currently lets any Google account sign in. Add an allowlist (e.g. a
Supabase auth hook or a check against an `allowed_emails` table) so only your
team can register into the workspace.
