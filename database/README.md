# Database schema

The PostgreSQL schema is defined with Drizzle in
`../apps/web/app/db/schema.ts`. Drizzle Kit configuration lives in
`../apps/web/drizzle.config.ts`, and generated SQL migrations are committed in
`./drizzle`.

From `apps/web`:

```bash
npm run db:generate -- --name=<change-name>
npm run db:check
```

`0000_baseline.sql` represents the schema that already exists on the
PlanetScale `callmap/main` production branch. Do not apply that baseline to the
existing branch.

Rollback SQL for reviewed migrations lives in `./rollbacks`. Rollbacks are
manual recovery procedures and are never run automatically.

## Production migration status

- `0001_text-department-location-ids.sql` was applied to
  `tetrahedron-labs/callmap/main` on 2026-07-20 as change `CM-ID-001`.
- The canonical department and location identifiers are text. Numeric
  department identifiers remain temporarily in `legacy_department_id` columns
  so the reviewed rollback can restore the previous schema without data loss.
- `0002_drop-legacy-department-ids.sql` removes those rollback-only columns. It
  contains irreversible production `DROP COLUMN` statements and must be run
  directly by an operator after reviewing its reconstruction rollback.

For future changes, edit the TypeScript schema, generate and review the SQL,
then apply only the new migration through an approved PlanetScale development
branch workflow. This project intentionally does not expose `db:push` or
`db:migrate` scripts against production.

Commands that inspect a live database, such as `npm run db:studio`, require a
direct PostgreSQL `DATABASE_URL`. Never commit that value; the deployed Worker
continues to connect through its `HYPERDRIVE` binding.
