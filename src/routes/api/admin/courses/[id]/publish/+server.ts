import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { apiError } from '$lib/server/api';
import { db } from '$lib/server/db';
import { courses } from '$lib/server/db/schema';
import { and, eq, inArray } from 'drizzle-orm';

export const POST: RequestHandler = async ({ params }) => {
	const now = Date.now();
	const updated = await db
		.update(courses)
		.set({ status: 'published', publishedAt: now, updatedAt: now })
		.where(
			and(
				eq(courses.id, params.id),
				inArray(courses.status, ['draft', 'archived', 'published'])
			)
		)
		.returning({ id: courses.id });

	if (updated.length === 0) {
		return apiError(409, 'invalid_status', 'Kursus tidak bisa dipublish dari status sekarang');
	}
	return json({ ok: true });
};
