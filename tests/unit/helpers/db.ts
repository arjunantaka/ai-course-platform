import { Database } from 'bun:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import * as schema from '../../../src/lib/server/db/schema';

const dir = mkdtempSync(join(tmpdir(), 'kras-test-'));
const path = join(dir, 'test.db');
const sqlite = new Database(path);
sqlite.exec('PRAGMA foreign_keys = ON;');

export const db = drizzle(sqlite, { schema });

migrate(db, { migrationsFolder: './drizzle' });

export function resetDatabase(): void {
	sqlite.exec('DELETE FROM quizzes; DELETE FROM lessons; DELETE FROM modules; DELETE FROM courses;');
}

process.on('exit', () => {
	rmSync(dir, { recursive: true, force: true });
});

export { path as testDbPath };