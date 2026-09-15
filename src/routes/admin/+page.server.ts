import type { PageServerLoad } from './$types';
import { listCourseCards } from '$lib/server/courses';

export const load: PageServerLoad = async () => {
	const items = await listCourseCards({ order: 'created', limit: 200 });
	return { items };
};
