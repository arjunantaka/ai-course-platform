import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	// sudah login → langsung ke dashboard
	if (env.ADMIN_TOKEN && cookies.get('kras_admin') === env.ADMIN_TOKEN) {
		redirect(303, '/admin');
	}
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const token = String(data.get('token') ?? '');
		if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) {
			return fail(400, { wrong: true });
		}
		cookies.set('kras_admin', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: false, // http VPS tanpa HTTPS
			maxAge: 60 * 60 * 24 * 7
		});
		redirect(303, '/admin');
	}
};
