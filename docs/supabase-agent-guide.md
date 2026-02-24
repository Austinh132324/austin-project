# Supabase Integration Map (Agent-Friendly)

This document explains exactly how `src/lib/utils/supabase.ts` works, where it is used, and how to replicate the same pattern for a different database URL.

## 1) Source of truth files

- `src/lib/utils/supabase.ts`
- `src/pages/Analytics.tsx`
- `.env.example`

## 2) Current `supabase.ts` behavior

File: `src/lib/utils/supabase.ts`

- Reads env vars at module load:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Creates a singleton client only if both values exist.
- Exposes 3 functions:
  - `getSupabase(): SupabaseClient | null`
  - `isSupabaseConfigured(): boolean`
  - `pingSupabase(): Promise<boolean>`

### Logic summary

1. If URL+key are missing, `supabase` stays `null`.
2. Callers must handle `null` and use fallback logic.
3. `pingSupabase()` performs a lightweight table check:
   - `from('analytics_events').select('id', { count: 'exact', head: true })`
   - Returns `true` when no error, else `false`.

## 3) Where it is used

File: `src/pages/Analytics.tsx`

- Imports: `getSupabase`, `isSupabaseConfigured`, `pingSupabase`.
- Connection health:
  - `checkConnection()` calls `isSupabaseConfigured()` then `pingSupabase()`.
- Read path:
  - `fetchSupabaseEvents()` uses `getSupabase()` and queries `analytics_events`.
  - Maps snake_case DB columns to camelCase UI event fields.
- Write path:
  - `insertSupabaseEvent()` inserts into `analytics_events`.
  - Converts camelCase UI fields to snake_case DB columns.
- Fallback strategy:
  - `loadAllEvents()` prefers Supabase data only when configured and non-empty.
  - Falls back to localStorage otherwise.
- Clear path:
  - `clearData()` deletes localStorage data and remote `analytics_events` rows when client exists.

## 4) Data contract used by Analytics

Table expected: `analytics_events`

Columns used:

- `id` (for ping and delete filter)
- `type`
- `page`
- `timestamp`
- `label`
- `visitor_id`
- `ip`
- `device`
- `browser`

UI <-> DB mapping:

- `visitorId` <-> `visitor_id`
- all other fields are same name except case style.

## 5) Replicate for another DB URL (same pattern)

Create a new utility, for example: `src/lib/utils/otherDb.ts`

```ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const dbUrl = import.meta.env.VITE_OTHERDB_URL as string | undefined
const dbKey = import.meta.env.VITE_OTHERDB_ANON_KEY as string | undefined

let db: SupabaseClient | null = null

if (dbUrl && dbKey) {
  db = createClient(dbUrl, dbKey)
}

export function getOtherDb(): SupabaseClient | null {
  return db
}

export function isOtherDbConfigured(): boolean {
  return db !== null
}

export async function pingOtherDb(): Promise<boolean> {
  if (!db) return false
  try {
    const { error } = await db.from('analytics_events').select('id', { count: 'exact', head: true })
    return !error
  } catch {
    return false
  }
}
```

Add env vars (example in `.env` / `.env.example`):

```env
VITE_OTHERDB_URL=https://your-other-project-id.supabase.co
VITE_OTHERDB_ANON_KEY=your-other-anon-key-here
```

Then replace imports/usages in the consumer file:

- `getSupabase` -> `getOtherDb`
- `isSupabaseConfigured` -> `isOtherDbConfigured`
- `pingSupabase` -> `pingOtherDb`

Keep the same null checks and fallback behavior.

## 6) Exact call flow in this repo

1. App loads Analytics page.
2. `checkConnection()` runs.
3. If env is missing -> status `disconnected` and local-only mode.
4. If env exists -> `pingSupabase()` validates table access.
5. `loadAllEvents()` tries remote fetch first.
6. Writes always go to localStorage immediately, then remote insert fire-and-forget.
7. Refresh/reconnect re-runs fetch and connection checks.

## 7) Important implementation constraints

- `supabase.ts` is intentionally tiny and side-effectful at import time.
- All callers are written to tolerate `null` client.
- Remote availability does not block local analytics capture.
- The table name (`analytics_events`) is hardcoded in both utility and consumer paths.
