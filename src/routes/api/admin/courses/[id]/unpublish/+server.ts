import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { apiError } from '$lib/server/api';
import { db } from '$lib/server/db';
import { courses } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ params }) => {
	const updated = await db
		.update(courses)
		.set({ status: 'archived', publishedAt: null, updatedAt: Date.now() })
		.where(and(eq(courses.id, params.id), eq(courses.status, 'published')))
		.returning({ id: courses.id });

	if (updated.length === 0) {
		return apiError(409, 'invalid_status', 'Kursus sedang tidak published');
	}
	return json({ ok: true });
};
