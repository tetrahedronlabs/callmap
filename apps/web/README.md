# CallMap web app

CallMap is a full-stack React Router application deployed to Cloudflare Workers.
Server loaders query PlanetScale Postgres through the `HYPERDRIVE` binding.

## Development

Copy `.env.example` to `.env.local` and add the public Mapbox token:

```text
VITE_MAPBOX_ACCESS_TOKEN=pk.example
```

`DATABASE_URL` is optional and only needed by Drizzle commands that inspect a
live database. Schema generation and migration checks work without it.

For local database access, provide a PostgreSQL connection string for the
Hyperdrive binding without committing it:

```bash
export CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE='postgresql://...'
npm run dev
```

Useful commands:

```bash
npm run typecheck
npm run build
npm run deploy
npm run db:generate -- --name=<change-name>
npm run db:check
```

The production Worker configuration is in `wrangler.jsonc`. Database schema
migrations and the PlanetScale workflow are documented in `../../database`.
