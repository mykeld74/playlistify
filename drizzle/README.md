# Drizzle migrations

## Current migration order

| Migration | What it does |
|-----------|--------------|
| **0000_broken_leper_queen** | Creates original tables: `blocked_artists`, `sessions`, `users` (old auth). |
| **0001_narrow_maverick** | Better Auth: creates `account` & `verification`, renames `sessions`→`session` and `users`→`user`, migrates columns with backfills, adds FKs, drops old columns. Creates `verification` with only `id`, `identifier`, `value`, `expiresAt`. |
| **0002_verification_created_at** | Adds `verification.createdAt`. |
| **0003_verification_updated_at** | Adds `verification.updatedAt`. |

## Apply migrations

```bash
pnpm run db:migrate
```

This runs any migration that hasn’t been applied yet (tracked in the DB).

## If `verification` is missing `createdAt` / `updatedAt`

If the app errors with “column createdAt of relation verification does not exist” and `pnpm run db:migrate` doesn’t fix it, run the repair script once against your database (e.g. in Neon SQL editor):

```bash
# Or run the SQL in drizzle/repair_verification_columns.sql
```

See `repair_verification_columns.sql` in this folder.

## Regenerating migrations (careful)

- **Schema** is in `src/lib/db/schema.ts`.
- **Config** is `drizzle.config.ts` (schema path, dialect, `DATABASE_URL`).
- After editing the schema, run `pnpm run db:generate` to create a new migration. Don’t edit existing migration files that have already been applied.
