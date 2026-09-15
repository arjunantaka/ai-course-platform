import type { PageServerLoad } from './$types';
import { listCourseCards } from '$lib/server/courses';

export const load: PageServerLoad = async () => {
	const courseCards = await listCourseCards({ order: 'created', limit: 200 });
	return { courseCards };
};
