import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

const dbPath = (env.DB_PATH?.trim() || './data/krascourse.db').replace(/^file:/, '');
mkdirSync(dirname(dbPath), { recursive: true });
const sqlite = new Database(dbPath);
sqlite.exec('PRAGMA foreign_keys = ON;'); // cascade delete butuh FK aktif

export const db = drizzle(sqlite, { schema });
