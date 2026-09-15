import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { CreateCourseInputSchema, createCourse } from '$lib/server/courses';

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const parsed = CreateCourseInputSchema.safeParse({
			topic: String(data.get('topic') ?? ''),
			level: String(data.get('level') ?? ''),
			language: String(data.get('language') ?? '').trim() || undefined,
			points: String(data.get('points') ?? '')
				.split('\n')
				.map((s) => s.trim())
				.filter(Boolean)
		});
		if (!parsed.success) {
			return fail(400, {
				error: parsed.error.issues.map((issue) => issue.message).join('; ')
			});
		}

		const id = await createCourse(parsed.data);
		redirect(303, `/admin/${id}`);
	}
};
