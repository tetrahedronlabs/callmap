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

For future changes, edit the TypeScript schema, generate and review the SQL,
then apply only the new migration through an approved PlanetScale development
branch workflow. This project intentionally does not expose `db:push` or
`db:migrate` scripts against production.

Commands that inspect a live database, such as `npm run db:studio`, require a
direct PostgreSQL `DATABASE_URL`. Never commit that value; the deployed Worker
continues to connect through its `HYPERDRIVE` binding.
