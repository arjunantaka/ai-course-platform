import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	getCourseTree,
	getPublishedCourseBySlug,
	listFlatLessons,
	moduleHasQuiz
} from '$lib/server/courses';
import { renderMarkdown } from '$lib/server/markdown';

export const load: PageServerLoad = async ({ params }) => {
	const course = await getPublishedCourseBySlug(params.slug);
	if (!course) error(404, 'Kursus tidak ditemukan');

	// urutan rata seluruh kursus → prev/next lintas modul
	const flat = await listFlatLessons(course.id);
	const index = flat.findIndex((lesson) => lesson.id === params.lessonId);
	if (index === -1) error(404, 'Lesson tidak ditemukan');

	const current = flat[index]!;
	const prev = index > 0 ? flat[index - 1]! : null;
	const next = index < flat.length - 1 ? flat[index + 1]! : null;

	// tombol kuis muncul di lesson terakhir modul yang punya kuis
	const isLastOfModule = next === null || next.moduleId !== current.moduleId;
	const quizModuleId =
		isLastOfModule && (await moduleHasQuiz(current.moduleId)) ? current.moduleId : null;

	const tree = await getCourseTree(course.id);
	if (!tree) error(404, 'Kursus tidak ditemukan');

	return {
		course: { slug: course.slug, title: course.title },
		totalLessons: course.totalLessons,
		modules: tree.modules,
		lesson: {
			id: current.id,
			title: current.title,
			readingMinutes: current.readingMinutes,
			moduleTitle: current.moduleTitle
		},
		html: renderMarkdown(current.contentMd),
		prev: prev ? { id: prev.id, title: prev.title } : null,
		next: next ? { id: next.id, title: next.title } : null,
		quizModuleId
	};
};
