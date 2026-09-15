import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteCourse } from '$lib/server/courses';

export const DELETE: RequestHandler = async ({ params }) => {
	await deleteCourse(params.id);
	return json({ ok: true });
};
