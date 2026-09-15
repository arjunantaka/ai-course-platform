import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { CreateCourseInputSchema, createCourse } from '$lib/server/courses';

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const parsed = CreateCourseInputSchema.safeParse({
			topic: String(form.get('topic') ?? ''),
			level: String(form.get('level') ?? ''),
			language: String(form.get('language') ?? '').trim() || undefined,
			points: String(form.get('points') ?? '')
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
