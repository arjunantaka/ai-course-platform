import type { PageServerLoad } from './$types';
import { listCourseCards } from '$lib/server/courses';

export const load: PageServerLoad = async ({ url }) => {
	const q = (url.searchParams.get('q') ?? '').trim();
	const courseCards = await listCourseCards({
		publishedOnly: true,
		q: q || undefined,
		limit: 100
	});
	return { q, courseCards };
};
