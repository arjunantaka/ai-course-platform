import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { apiError } from '$lib/server/api';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { lessons } from '$lib/server/db/schema';

const BodySchema = z.object({
	title: z.string().trim().min(2).max(120).optional(),
	summary: z.string().trim().min(5).max(400).optional(),
	content_md: z.string()
});

export const PUT: RequestHandler = async ({ params, request }) => {
	const parsed = BodySchema.safeParse(await request.json());
	if (!parsed.success) {
		return apiError(400, 'validation', parsed.error.issues.map((i) => i.message).join('; '));
	}

	const { title, summary, content_md } = parsed.data;
	const words = content_md.split(/\s+/).filter(Boolean).length;
	const readingMinutes = Math.max(1, Math.ceil(words / 200));

	const updated = await db
		.update(lessons)
		.set({
			...(title !== undefined ? { title } : {}),
			...(summary !== undefined ? { summary } : {}),
			contentMd: content_md,
			readingMinutes
		})
		.where(eq(lessons.id, params.id))
		.returning({ id: lessons.id, readingMinutes: lessons.readingMinutes });

	if (updated.length === 0) {
		return apiError(404, 'not_found', 'Lesson tidak ditemukan');
	}
	return json({ ok: true, reading_minutes: updated[0]!.readingMinutes });
};
