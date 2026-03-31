# pixel_memory Integration Log

**Date:** 2026-02-19
**Task:** Integrate pixel_memory SPEC into pixel_office

## Summary

Created a new `pixel_memory` module in `pixel_office` to serve as a central shared memory layer for `pixel_office` and future apps like `pixel_me`.

## Changes

### New Files Created

| File | Description |
|------|-------------|
| `src/pixel_memory/config.ts` | DB configuration via environment variables |
| `src/pixel_memory/schema.ts` | SQL schemas for Postgres/MySQL |
| `src/pixel_memory/migrations.ts` | Migration runner with versioning |
| `src/pixel_memory/api.ts` | Full CRUD API for all tables |
| `src/pixel_memory/index.ts` | Module exports |
| `src/pixel_memory/cli.ts` | CLI entrypoint |

### Modified Files

| File | Changes |
|------|---------|
| `package.json` | Added `pg`, `mysql2` dependencies; added `pixel_memory:migrate` script |

## Configuration

Environment variables required:
```bash
CORE_DB_HOST      # Database host
CORE_DB_PORT      # Port (default: 5432 postgres, 3306 mysql)
CORE_DB_NAME      # Database name (default: hermit_core)
CORE_DB_USER      # Database user (default: pixel_app)
CORE_DB_PASS      # Database password
CORE_DB_TYPE      # "postgres" or "mysql" (default: postgres)
```

## Schema

Tables created:
- `entities` - Things in life (people, projects, places, systems)
- `mem_entries` - Atomic notes, tasks, events, reflections, logs
- `prefs` - Long-lived preferences and settings
- `pixel_state` - Stateful UI bits per-app

## Usage

```bash
# Run migrations
npm run pixel_memory:migrate

# In code
import { entities, memEntries, prefs, pixelState } from "./pixel_memory";
```

## Notes

- Supports both Postgres and MySQL
- Migrations are idempotent and forward-only
- JSON fields used for flexible metadata storage
- All tables have proper indexes and unique constraints
