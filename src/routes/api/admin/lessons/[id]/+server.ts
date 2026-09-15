import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { apiError } from '$lib/server/api';
import { z } from 'zod';
import { saveLessonContent } from '$lib/server/courses';

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

	const saved = await saveLessonContent(params.id, {
		title: parsed.data.title,
		summary: parsed.data.summary,
		contentMd: parsed.data.content_md
	});
	if (!saved) return apiError(404, 'not_found', 'Lesson tidak ditemukan');
	return json({ ok: true, reading_minutes: saved.readingMinutes });
};
