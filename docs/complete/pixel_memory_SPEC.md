# pixel_memory SPEC

Central shared memory module for `pixel_office` and `pixel_me`.

## Goal

Provide a small, self-contained "pixel_memory" module that:

- Defines the **DB schema** for central memory.
- Provides **migration scripts** to create/update tables on the target DB (e.g. Hostinger MySQL/Postgres).
- Reads DB connection settings from a simple **config file** / environment variables.
- Exposes a small API that other apps (pixel_office, pixel_me) can call.

User responsibility:

1. Set DB host / username / password / DB name in a config file or `.env`.
2. Run a simple migration command to create/update tables.
3. Point `pixel_office` and `pixel_me` at this module.

Opencode responsibility:

- Implement schema, migrations, and API as described below.

---

## 1. Configuration

The module should read DB connection settings from environment variables (or a small config file that maps directly to these env vars):

```bash
# Core memory DB (e.g. Hostinger)
CORE_DB_HOST=your-db-host
CORE_DB_PORT=3306              # or 5432 if Postgres
CORE_DB_NAME=hermit_core
CORE_DB_USER=pixel_app
CORE_DB_PASS=super_secret

# Optional: logical schemas/namespaces
PIXEL_OFFICE_SCHEMA=pixel_office
PIXEL_ME_SCHEMA=pixel_me
```

Assumptions / requirements:

- The DB engine will be either MySQL or Postgres (keep SQL portable where possible).
- `CORE_DB_NAME` is the main database for central memory.
- App-specific schemas (PIXEL_OFFICE_SCHEMA, PIXEL_ME_SCHEMA) are optional; the first version can just use a single default schema / database if that’s simpler.

---

## 2. Schema Design

Implement the following minimal schema. Adjust types for the chosen SQL dialect (MySQL or Postgres).

### 2.1 `entities`

Represents "things in life": people, projects, places, systems, etc.

Fields:

- `id` (primary key, auto-increment / serial / UUID)
- `type` (string / enum) — examples: `person`, `project`, `place`, `system`
- `name` (string, not null)
- `slug` (string, nullable, unique if present)
- `metadata` (JSON or text) — structured extras (e.g. repo URL, relationship)
- `created_at` (timestamp, default now)
- `updated_at` (timestamp, default now, updated on change)

Indexes:

- Index on (`type`, `name`).
- Unique index on `slug` if used.

### 2.2 `mem_entries`

Atomic notes, tasks, events, reflections, logs.

Fields:

- `id` (primary key)
- `entity_id` (foreign key → `entities.id`, nullable) — optional link to an entity
- `kind` (string) — e.g. `note`, `task`, `event`, `reflection`, `log`
- `title` (string, nullable)
- `content` (text, not null)
- `tags` (JSON or text) — either JSON array of strings or comma-separated
- `timestamp` (timestamp) — when the note/event "happened"; default now
- `created_at` (timestamp, default now)
- `updated_at` (timestamp, default now, updated on change)

Indexes:

- Index on (`entity_id`, `timestamp`).
- Index on (`kind`, `timestamp`).

### 2.3 `prefs`

Long-lived preferences and settings.

Fields:

- `id` (primary key)
- `scope` (string) — e.g. `global`, `pixel_office`, `pixel_me`, `trading`
- `key` (string)
- `value` (text or JSON)
- `created_at` (timestamp, default now)
- `updated_at` (timestamp, default now, updated on change)

Constraints / indexes:

- Unique index on (`scope`, `key`).

### 2.4 `pixel_state`

Stateful UI bits and per-app state for pixel_office and pixel_me.

Fields:

- `id` (primary key)
- `owner` (string) — e.g. `pixel_office`, `pixel_me`
- `key` (string) — e.g. `current_scene`, `active_board_id`
- `value` (JSON or text)
- `created_at` (timestamp, default now)
- `updated_at` (timestamp, default now, updated on change)

Constraints / indexes:

- Unique index on (`owner`, `key`).

---

## 3. Migrations

Opencode should provide database migrations that:

1. Create the tables above with appropriate types for the chosen DB engine.
2. Create necessary indexes and unique constraints.
3. Are idempotent and forward-only (no destructive changes without explicit versioning).

There should be a simple CLI entrypoint, e.g.:

```bash
pixel_memory migrate
```

or an equivalent `npm`/`pnpm`/`python`/`go` command that:

- Reads env/config.
- Connects to `CORE_DB_HOST` / `CORE_DB_NAME`.
- Applies pending migrations.

---

## 4. API Surface

Expose a minimal API usable by both `pixel_office` and `pixel_me`. This can be:

- A library module (importable functions), **or**
- An HTTP API (REST/JSON) with endpoints.

The exact implementation is up to Opencode; the important part is that the following logical operations exist.

### 4.1 Entities

- `createEntity({ type, name, slug?, metadata? })`
- `getEntityById(id)`
- `getEntityBySlug(slug)`
- `listEntities({ type?, search?, limit?, offset? })`
- `updateEntity(id, { name?, slug?, metadata? })`

### 4.2 Memory Entries

- `createMemEntry({ entityId?, kind, title?, content, tags?, timestamp? })`
- `getMemEntryById(id)`
- `listMemEntries({ entityId?, kind?, tags?, since?, until?, limit?, offset? })`
- `updateMemEntry(id, { title?, content?, tags?, timestamp? })`

### 4.3 Preferences

- `getPref(scope, key)` → returns value or null
- `setPref(scope, key, value)` → upsert
- `listPrefs(scope)` → all keys/values in a scope

### 4.4 Pixel State

- `getPixelState(owner, key)` → returns parsed value or null
- `setPixelState(owner, key, value)` → upsert
- `listPixelState(owner)` → all key/value pairs for an owner

The API should handle JSON serialization/deserialization where relevant (for `metadata`, `tags`, `value`, etc.).

---

## 5. Integration Notes

For **pixel_office** and **pixel_me**:

- Both apps should depend on the same `pixel_memory` module or HTTP API.
- Both should use the shared `CORE_DB_*` configuration so they point to the same central database.
- App-specific schemas/namespaces (`PIXEL_OFFICE_SCHEMA`, `PIXEL_ME_SCHEMA`) are optional. If implemented, they can be used for table namespacing or logical separation, but the first version can simply ignore them.

Suggested usage pattern:

1. User sets `CORE_DB_*` env vars.
2. User runs `pixel_memory migrate`.
3. `pixel_office` and `pixel_me` call into `pixel_memory` instead of managing their own separate DB schemas.

---

## 6. Safety / Operational Considerations

- Keep SQL portable between MySQL and Postgres where reasonable.
- Avoid destructive migrations. If schema changes are needed, add new migrations.
- Consider providing a read-only DB user option for future analytics (not required for v1).
- The central memory DB may contain personal data; handle with care and avoid logging sensitive content in plain text.

---

This spec is intended for Opencode to implement. The user’s main responsibilities are to:

- Provide correct DB connection details via env/config.
- Run the migration command.
- Point `pixel_office` and `pixel_me` at the resulting `pixel_memory` module or API.