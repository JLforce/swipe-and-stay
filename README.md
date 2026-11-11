# Swipe & Stay

A mobile app that helps students in Cebu find housing near their campus. Students swipe through dorms, boarding houses, apartments and condos, save the ones they like, get an AI explanation of why a listing matches them, and review lease terms before signing. Owners post their own listings, and an admin reviews them before they go live.

Built for SD3 by Nestify Innovations.

## Features

**Students**
- Sign up with email or Google, then set campus, budget, housing type, roommate preference, amenities and course.
- Swipe deck ranked by a rules-based score that adapts to each swipe.
- Search, saved listings with a map, and chat with owners.
- "Why this match" explanation written by AI (with a template fallback).
- Lease review: paste a lease and get a plain-language summary (informational only, not legal advice).

**Owners**
- Sign up as an owner and post listings with photos.
- Every new listing, and every edit to its details, is reviewed by an admin before students can see it.
- Dashboard with interested students and inquiries.

**Admin**
- Overview with live stats, a students list, an owners list, and listing review.
- Reached by long-pressing the logo on the login screen.

## Tech stack

- Expo SDK 58, React Native, Expo Router (routes in `src/app`)
- NativeWind (Tailwind) for styling, TypeScript
- Supabase: Postgres with row-level security, Auth, Storage, Edge Functions (Deno)
- Cerebras API for the AI features

## Getting started

1. Install dependencies

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root (it is git-ignored). Copy `.env.example` and fill in the project values:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ```

3. Start the app

   ```bash
   npx expo start --tunnel
   ```

   Scan the QR code with Expo Go. Use `--clear` to reset the cache.

Useful commands:

```bash
npx tsc --noEmit        # typecheck
npx expo lint           # lint
npx expo install <pkg>  # add a dependency (resolves a compatible version)
```

## Project structure

```
src/app/          Screens and navigation, grouped by role: (auth), (student), (owner), (admin)
src/components/   Shared UI (kit.tsx), swipe deck, forms, admin and owner components
src/lib/          App logic: auth, store, matching, search, listings, chat, API calls
src/constants/    Brand tokens, housing types, campuses
src/types/        Generated database types
supabase/
  migrations/     Database schema, policies and triggers (apply in date order)
  functions/      Edge functions
  seed.sql        Demo data for a fresh database
```

## Backend

Edge functions (in `supabase/functions`):

| Function | Purpose |
|---|---|
| `explain-match` | Writes the "why this matches you" text. Saved once per student and listing; limited to 30 AI calls per student per day, then falls back to a template. |
| `submit-lease-review` | Summarizes a pasted lease. Limited to 5 per day and cached. |
| `admin-get-stats` | Returns dashboard stats and the students list. Admin only. |

The AI functions need a `CEREBRAS_API_KEY` secret set in Supabase. Without it they return the template or sample result instead of failing.

Deploy a function:

```bash
npx supabase functions deploy <name> --project-ref <project-ref>
```

### Database changes

- Always add a new file in `supabase/migrations` instead of editing the database by hand, so the repo and the live project stay in sync.
- Apply migrations with `npx supabase db push`, and check them with `npx supabase migration list --linked`.
- Run `supabase/seed.sql` only on a fresh development database.

## Roles and approval flow

- `student`, `owner` and `admin` are stored in `profiles.role`. Users can never change their own role.
- New owners start as `pending`. An admin controls owner account status.
- Owners cannot publish: new or edited listings become `pending` and hidden until an admin verifies them.

## Notes

- Scam analysis was dropped from the project because of free-tier AI limits.
- Match scores are rules-based. AI is used only to write the explanation and the lease summary.
- Never commit `.env` or any API keys.
