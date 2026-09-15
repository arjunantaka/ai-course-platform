import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { courses } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

/** Hapus kursus; FK cascade membersihkan modules → lessons/quizzes. */
export const DELETE: RequestHandler = async ({ params }) => {
	await db.delete(courses).where(eq(courses.id, params.id));
	return json({ ok: true });
};
