# 2026-04-10 Data Separation Plan

## Target

Split the system into three layers so local development, desktop delivery, and future cloud deployment can share the same business model:

1. Program layer
   - frontend sites
   - desktop shell
   - backend service binaries
2. Business data layer
   - local SQLite first
   - future cloud MySQL
   - accounts, orders, points, novels, chapters, duration, referral data
3. User file layer
   - imported source files
   - user uploads
   - app workspace files
   - generated local artifacts

The key rule is:

- business records go to SQL
- user private files stay on the user's local device
- novel manuscripts should keep a local copy and a cloud copy

## What Exists Today

### Backend

The backend already supports `DB_ADAPTER=sqlite` and `DB_ADAPTER=mysql`.

Before this round:

- SQLite covered users, orders, points, referrals, durations
- `novels.ts` already expected `novels` and `chapters` tables
- but local SQLite schema did not actually create those novel tables yet
- session file storage used a single `SESSION_DIR` and did not protect against path escape

### Website

`fenghuang-unified` writing data still lives in browser `localStorage` through:

- `src/utils/localWriting.ts`
- `src/components/writing/WritingWorkbench.tsx`

So the website writing center is still local-first, but not yet connected to backend SQL.

### Desktop / app workspace

`webuiapps` already has a file abstraction:

- `src/lib/fileApi.ts`
- `src/lib/localFileApi.ts`
- `src/lib/FileSystemStore.ts`

This is a good base for local-only user file storage, but it is not yet tied to a unified storage policy.

## Changes Landed In This Round

### 1. Local SQLite now supports novel business data

Updated:

- `apps/backend/src/config/sqliteAdapter.ts`

Added:

- `novels`
- `chapters`

This means local SQLite can now hold the same business categories you want to centralize:

- accounts
- orders
- points
- referrals
- novels
- chapters

### 2. Backend storage roots are now separated

Added:

- `apps/backend/src/config/storage.ts`

This introduces explicit roots for:

- `dataRoot`
- `storageRoot`
- `cacheRoot`
- `sessionDir`
- `userFilesRoot`
- `userImportsRoot`
- `userUploadsRoot`
- `novelMirrorRoot`
- `migrationRoot`

### 3. Session file storage is now rooted and path-safe

Updated:

- `apps/backend/src/routes/sessionData.ts`

The route now resolves paths strictly inside the configured session root. This is important because user files should never be able to escape into arbitrary server locations.

### 4. Migration export entry is ready

Added:

- `apps/backend/scripts/export-sqlite-business-data.mjs`
- `package.json` script: `npm run export:sqlite`

This exports business tables from local SQLite into a structured JSON file under the migration directory. It is the first step toward future MySQL migration.

## Storage Policy

| Data category | Local SQLite | Cloud MySQL | Local user files | Cloud file storage |
| --- | --- | --- | --- | --- |
| Accounts / auth / profile | Yes | Yes | No | No |
| Orders / recharge / VIP / durations | Yes | Yes | No | No |
| Points / referrals / rewards | Yes | Yes | No | No |
| Novel metadata | Yes | Yes | Optional mirror export | No |
| Novel chapters / manuscript text | Yes | Yes | Yes, mirror copy | Optional later |
| User-imported files | No | No | Yes | No |
| User uploads / workspace assets | No | No | Yes | No |
| Temporary cache | No | No | Optional local cache only | No |

## Recommended Final Architecture

### A. Business database

Use a single business schema for both local and cloud:

- local: SQLite
- cloud: MySQL

Keep these in SQL:

- `users`
- `orders`
- `recharge_orders`
- `vip_orders`
- `user_durations`
- `points_records`
- `points_log`
- `referrals`
- `referral_settings`
- `novels`
- `chapters`

### B. Local-only user files

Never push these to the cloud by default:

- imported documents
- imported images
- imported references
- user uploads for local workflows
- desktop workspace files
- per-app sandbox files

Recommended directory shape:

```text
data/
  local-dev.sqlite
  migrations/
  storage/
    sessions/
    user-files/
      imports/
      uploads/
    novel-mirror/
  cache/
```

### C. Dual-copy novel data

For user-authored novel content:

- one copy in SQL for cross-device/cloud continuity
- one local mirror copy for local ownership and offline safety

Recommended future shape:

- SQL stores normalized project metadata and chapter content
- local mirror stores draft snapshots and exports by user/project

## Execution Order

### Phase 1: foundation

Done in this round:

- local SQLite novel tables added
- storage roots separated
- session file path safety added
- SQLite export entry added

### Phase 2: website writing center -> SQL

Next move:

- replace `fenghuang-unified/src/utils/localWriting.ts` as the primary source of truth
- keep local browser storage only as an offline cache
- send project + chapter updates to backend novel APIs
- write local mirror snapshots under `novelMirrorRoot`

This is the point where "novel data cloud + local dual copy" becomes real.

### Phase 3: desktop imported file policy

Next move:

- route all imported files into `userFilesRoot`
- do not store imported files in SQL
- do not upload imported files to cloud
- keep only metadata or references in SQL if needed

### Phase 4: cloud migration

When cloud MySQL is ready:

1. switch backend to `DB_ADAPTER=mysql`
2. provision the MySQL schema
3. run `npm run export:sqlite`
4. import exported business JSON into MySQL through a dedicated importer
5. keep user files on local device or a separate local desktop channel

## Env Baseline

Recommended local values:

```env
DB_ADAPTER=sqlite
DB_SQLITE_PATH=./data/local-dev.sqlite
DATA_ROOT=./data
STORAGE_ROOT=./data/storage
CACHE_ROOT=./data/cache
SESSION_DIR=./data/storage/sessions
USER_FILES_ROOT=./data/storage/user-files
USER_IMPORTS_ROOT=./data/storage/user-files/imports
USER_UPLOADS_ROOT=./data/storage/user-files/uploads
NOVEL_MIRROR_ROOT=./data/storage/novel-mirror
DATA_MIGRATION_ROOT=./data/migrations
```

Recommended cloud values:

```env
DB_ADAPTER=mysql
DB_HOST=<cloud-host>
DB_PORT=3306
DB_USER=<cloud-user>
DB_PASSWORD=<cloud-password>
DB_NAME=chaowuqiong_db
```

## Current Gaps

These still need implementation:

1. `fenghuang-unified` writing center is still browser-local, not SQL-backed.
2. There is no MySQL importer yet; only SQLite export is ready.
3. User-imported files are not yet fully routed through a single user-local storage service.
4. Novel local mirror snapshots are not yet written automatically.

## Recommended Next Engineering Task

If we continue immediately, the highest-value next task is:

1. build a backend `writing-drafts` API on top of `novels` + `chapters`
2. switch `fenghuang-unified` from `localStorage` to API + local cache
3. add local mirror snapshot writing for each save

That will complete the most important business rule:

- user-written novel data exists in local and cloud at the same time
