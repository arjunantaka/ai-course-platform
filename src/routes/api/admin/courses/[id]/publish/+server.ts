import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { apiError } from '$lib/server/api';
import { publishCourse } from '$lib/server/courses';

export const POST: RequestHandler = async ({ params }) => {
	if (!(await publishCourse(params.id))) {
		return apiError(409, 'invalid_status', 'Kursus tidak bisa dipublish dari status sekarang');
	}
	return json({ ok: true });
};
