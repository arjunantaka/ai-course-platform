import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getCourseTree, getPublishedCourseBySlug } from '$lib/server/courses';

export const load: PageServerLoad = async ({ params }) => {
	const course = await getPublishedCourseBySlug(params.slug);
	if (!course) error(404, 'Kursus tidak ditemukan');

	const tree = await getCourseTree(course.id);
	if (!tree) error(404, 'Kursus tidak ditemukan');

	const totalMinutes = tree.modules.reduce(
		(total, mod) => total + mod.lessons.reduce((sum, lesson) => sum + lesson.readingMinutes, 0),
		0
	);
	const firstLessonId = tree.modules[0]?.lessons[0]?.id ?? null;

	return {
		course: {
			slug: course.slug,
			title: course.title,
			description: course.description,
			level: course.level,
			totalLessons: course.totalLessons
		},
		tags: course.tags,
		modules: tree.modules,
		totalMinutes,
		firstLessonId
	};
};
