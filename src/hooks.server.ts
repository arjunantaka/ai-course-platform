import { error, redirect, type Handle } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';

// Init saat boot: migrasi otomatis + recovery generate yang terputus.
await migrate(db, { migrationsFolder: './drizzle' });
await db.run(sql`
	UPDATE courses
	SET status = 'failed',
	    error = 'Server restart saat generate',
	    updated_at = ${Date.now()}
	WHERE status IN ('generating_outline', 'generating_content')
`);
// Satu provider yang menggantung bisa menahan kursus berjam-jam; lepas setelah 30 menit.
await db.run(sql`
	UPDATE courses
	SET status = 'failed',
	    error = 'Generate melewati batas 30 menit',
	    updated_at = ${Date.now()}
	WHERE status IN ('generating_outline', 'generating_content')
	  AND updated_at < ${Date.now() - 30 * 60 * 1000}
`);

const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;
	const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/');
	const isAdminApi = pathname.startsWith('/api/admin/');

	if ((isAdminPage || isAdminApi) && pathname !== '/admin/login') {
		const token = event.cookies.get('kras_admin');
		if (env.ADMIN_TOKEN === undefined || token !== env.ADMIN_TOKEN) {
			if (isAdminApi) error(401, 'Unauthorized');
			redirect(303, '/admin/login');
		}
	}

	return resolve(event);
};

export { handle };
