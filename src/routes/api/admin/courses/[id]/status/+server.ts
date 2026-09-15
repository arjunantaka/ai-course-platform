import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { apiError } from '$lib/server/api';
import { db } from '$lib/server/db';
import { courses } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const [row] = await db
		.select({
			status: courses.status,
			totalLessons: courses.totalLessons,
			doneLessons: courses.doneLessons,
			error: courses.error
		})
		.from(courses)
		.where(eq(courses.id, params.id))
		.limit(1);

	if (!row) return apiError(404, 'not_found', 'Kursus tidak ditemukan');
	return json({
		status: row.status,
		total_lessons: row.totalLessons,
		done_lessons: row.doneLessons,
		error: row.error
	});
};
