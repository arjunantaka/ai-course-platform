import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { apiError } from '$lib/server/api';
import { unpublishCourse } from '$lib/server/courses';

export const POST: RequestHandler = async ({ params }) => {
	if (!(await unpublishCourse(params.id))) {
		return apiError(409, 'invalid_status', 'Kursus sedang tidak published');
	}
	return json({ ok: true });
};
