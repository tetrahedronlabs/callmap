import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

config({ path: ['.env.local', '.env'], quiet: true });

const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
	dialect: 'postgresql',
	schema: './app/db/schema.ts',
	out: '../../database/drizzle',
	schemaFilter: ['public'],
	strict: true,
	verbose: true,
	...(databaseUrl ? { dbCredentials: { url: databaseUrl } } : {}),
});
