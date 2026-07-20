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

## UCSF crime-log ingestion

The UCSF importer discovers every monthly page linked from the public archive,
adds the current rolling daily log, validates the six-column source tables, and
deduplicates overlapping rows with stable IDs. Each `files` row retains its
exact UCSF source URL for provenance.

```bash
# Scrape and validate without touching the database
npm run ingest:ucsf -- --output .ucsf-ingest/ucsf.json

# Load the idempotent upserts after obtaining a short-lived database URL
DATABASE_URL='postgresql://...' npm run ingest:ucsf -- --load

# Parser regression tests
npm run test:ucsf-ingest
```

The production Worker configuration is in `wrangler.jsonc`. Database schema
migrations and the PlanetScale workflow are documented in `../../database`.
