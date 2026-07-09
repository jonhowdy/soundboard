# Database design

Two tiers: a **local** offline store (always on) and an **optional cloud**
Postgres schema (only when the user enables encrypted sync).

## Local — IndexedDB (`soundboard`, v1)

Implemented in `src/db/database.ts`.

| Store | Key | Value | Notes |
|-------|-----|-------|-------|
| `sounds` | `id` | `Sound` | Metadata only — never the audio bytes |
| `categories` | `id` | `Category` | |
| `blobs` | `blobKey` | `ArrayBuffer` | Raw encoded audio, separated from metadata |
| `meta` | string key | `unknown` | `settings`, feature flags (e.g. `seeded`) |

**Why separate `blobs`?** The grid reads `sounds`/`categories` constantly; those
records are a few hundred bytes each. Audio can be megabytes. Keeping binaries in
their own store means listing 10,000 sounds never deserializes a single byte of
audio — only the buffers you actually play get read and decoded.

### Entity shapes (see `src/types/index.ts`)

```ts
Sound {
  id, title, subtitle?, emoji?, image?, color,
  categoryId | null, tags[], favorite,
  format, duration, waveform[],            // waveform = downsampled peaks 0..1
  playback: { volume, rate, pitch, fadeIn, fadeOut, reverse, loop },
  hotkey?, playMode: 'oneshot'|'loop'|'hold',
  playCount, lastPlayed, createdAt,
  blobKey                                   // → blobs store
}

Category { id, name, color, emoji?, createdAt }

Settings { theme, gridSize, masterVolume, haptics,
           highContrast, colorBlindMode, largeText, showWaveforms, confetti }
```

### Migrations
The `upgrade` callback in `openDB` is versioned. To evolve the schema, bump
`DB_VERSION` and add the new store/index inside `upgrade(db, oldVersion)` guarded
by `oldVersion < N`. Never mutate existing stores destructively — add and
backfill.

## Backup format (portable, device-independent)

`store.exportBackup()` produces a `BackupFile` (`version: 1`) containing settings,
categories and every sound **with its audio inline as a base64 data URL**. This
is the interchange format for moving between devices without a cloud account and
the basis of automatic daily backups (roadmap M6). CSV/ZIP exports are thin
projections of the same data.

## Optional cloud — Postgres / Supabase

Enabled only when the user opts into sync. Row-Level Security scopes every row to
its owner. Audio is uploaded to Supabase Storage (or S3); the DB stores a
reference, not the bytes.

```sql
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  color text not null,
  emoji text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table sounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  category_id uuid references categories on delete set null,
  title text not null,
  subtitle text,
  emoji text,
  color text not null,
  tags text[] default '{}',
  favorite boolean default false,
  format text not null,
  duration real default 0,
  waveform real[] default '{}',
  playback jsonb not null,             -- mirrors PlaybackSettings
  hotkey text,
  play_mode text default 'oneshot',
  play_count integer default 0,
  last_played timestamptz,
  storage_path text not null,          -- object-storage key of the encrypted blob
  content_hash text,                   -- for duplicate detection & dedup
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index sounds_user_idx    on sounds (user_id);
create index sounds_cat_idx     on sounds (category_id);
create index sounds_hash_idx    on sounds (user_id, content_hash);

-- Row-Level Security
alter table categories enable row level security;
alter table sounds     enable row level security;
create policy "own rows" on sounds
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### Sync strategy
- **Last-write-wins** per row using `updated_at`, with a local outbox queue so
  edits made offline flush when connectivity returns.
- **Content-addressed audio**: hash the bytes (`content_hash`); identical files
  upload once and are shared by reference — this also powers duplicate detection.
- **Encryption**: audio and titles are encrypted client-side with a key derived
  from the user's passphrase (WebCrypto) *before* upload, so the server stores
  ciphertext only (zero-knowledge). Losing the passphrase means losing the data —
  surfaced clearly in the UI.
