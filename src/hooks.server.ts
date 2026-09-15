import { redirect, type Handle } from '@sveltejs/kit';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { apiError } from '$lib/server/api';
import { recoverInterruptedGenerations } from '$lib/server/courses';

// Init saat boot: migrasi otomatis + recovery generate yang terputus.
await migrate(db, { migrationsFolder: './drizzle' });
await recoverInterruptedGenerations();

const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;
	const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/');
	const isAdminApi = pathname.startsWith('/api/admin/');

	if ((isAdminPage || isAdminApi) && pathname !== '/admin/login') {
		const token = event.cookies.get('kras_admin');
		if (env.ADMIN_TOKEN === undefined || token !== env.ADMIN_TOKEN) {
			if (isAdminApi) return apiError(401, 'unauthorized', 'Token admin tidak valid');
			redirect(303, '/admin/login');
		}
	}

	return resolve(event);
};

export { handle };
