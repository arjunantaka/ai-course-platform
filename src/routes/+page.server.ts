import type { PageServerLoad } from './$types';
import { listCourseCards } from '$lib/server/courses';

export const load: PageServerLoad = async () => {
	const latest = await listCourseCards({ publishedOnly: true, limit: 6 });
	return { latest };
};
