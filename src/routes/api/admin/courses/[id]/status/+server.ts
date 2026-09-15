import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { apiError } from '$lib/server/api';
import { getGenerationStatus } from '$lib/server/courses';

export const GET: RequestHandler = async ({ params }) => {
	const generation = await getGenerationStatus(params.id);
	if (!generation) return apiError(404, 'not_found', 'Kursus tidak ditemukan');
	return json({
		status: generation.status,
		total_lessons: generation.totalLessons,
		done_lessons: generation.doneLessons,
		error: generation.error
	});
};
