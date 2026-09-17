import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { verifyAdminToken } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	// sudah login → langsung ke dashboard
	if (verifyAdminToken(cookies.get('kras_admin'), env.ADMIN_TOKEN)) {
		redirect(303, '/admin');
	}
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const token = String(form.get('token') ?? '');
		if (!verifyAdminToken(token, env.ADMIN_TOKEN)) {
			return fail(400, { wrong: true });
		}
		cookies.set('kras_admin', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: env.ORIGIN?.startsWith('https') ?? false, // otomatis https begitu ORIGIN ber-TLS
			maxAge: 60 * 60 * 24 * 7
		});
		redirect(303, '/admin');
	}
};
