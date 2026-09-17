import { redirect, type Handle } from '@sveltejs/kit';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { apiError } from '$lib/server/api';
import { verifyAdminToken } from '$lib/server/auth';
import { recoverInterruptedGenerations } from '$lib/server/courses';

// Init saat boot: migrasi otomatis + recovery generate yang terputus.
await migrate(db, { migrationsFolder: './drizzle' });
await recoverInterruptedGenerations();

const handle: Handle = async ({ event, resolve }) => {
	// SvelteKit mencocokkan rute pada pathname yang sudah di-decode (decode_pathname
	// berjalan sebelum find_route), jadi guard wajib mengecek bentuk yang sama.
	// Tanpa ini /%61dmin lolos prefix check tapi tetap match rute /admin.
	let pathname = event.url.pathname;
	try {
		pathname = pathname.split('%25').map(decodeURI).join('%25');
	} catch {
		// URI rusak ditolak kit sebelum routing; pakai bentuk mentah saja
	}
	const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/');
	const isAdminApi = pathname.startsWith('/api/admin/');

	if ((isAdminPage || isAdminApi) && pathname !== '/admin/login') {
		const token = event.cookies.get('kras_admin');
		if (!verifyAdminToken(token, env.ADMIN_TOKEN)) {
			if (isAdminApi) return apiError(401, 'unauthorized', 'Token admin tidak valid');
			redirect(303, '/admin/login');
		}
	}

	return resolve(event);
};

export { handle };
