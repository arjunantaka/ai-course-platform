import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getCourseTree } from '$lib/server/courses';

export const load: PageServerLoad = async ({ params }) => {
	const tree = await getCourseTree(params.id, {
		includeContent: true,
		includeQuizQuestions: true
	});
	if (!tree) error(404, 'Kursus tidak ditemukan');
	return { course: tree.course, modules: tree.modules };
};
