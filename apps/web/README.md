# CallMap web app

CallMap is a full-stack React Router application deployed to Cloudflare Workers.
Server loaders query PlanetScale Postgres through the `HYPERDRIVE` binding.

## Development

Create `apps/web/.env.local` with the public Mapbox token:

```text
VITE_MAPBOX_ACCESS_TOKEN=pk.example
```

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
```

The production Worker configuration is in `wrangler.jsonc`. Database schema
migrations live in `../../database/migrations`.
