import { defineConfig } from 'drizzle-kit';

const url = (process.env.DB_PATH ?? './data/krascourse.db').replace(/^file:/, '');

export default defineConfig({
	dialect: 'sqlite',
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	dbCredentials: { url: `file:${url}` }
});
