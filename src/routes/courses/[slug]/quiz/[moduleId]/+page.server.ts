import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getModuleQuiz, getPublishedCourseBySlug } from '$lib/server/courses';

export const load: PageServerLoad = async ({ params }) => {
	const course = await getPublishedCourseBySlug(params.slug);
	if (!course) error(404, 'Kursus tidak ditemukan');

	const quiz = await getModuleQuiz(course.id, params.moduleId);
	if (!quiz) error(404, 'Kuis tidak ditemukan');

	// Kuis self-study tanpa akun: penilaian sengaja di sisi client, jadi answer_index
	// ikut dikirim ke browser. Bila kelak ada login/penilaian resmi, pindah ke server.
	return {
		course: { slug: course.slug, title: course.title },
		module: { id: quiz.id, title: quiz.title },
		questions: quiz.questions
	};
};
