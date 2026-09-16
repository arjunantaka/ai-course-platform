<script lang="ts">
	import { LEVEL_LABELS, titleInitials } from '$lib/utils';
	import type { CourseCard } from '$lib/server/courses';

	let { course, featured = false }: { course: CourseCard; featured?: boolean } = $props();
</script>

<!-- flex-col + h-full: cover featured mengisi tinggi kartu saat span 2 baris grid -->
<a
	href={`/courses/${course.slug}`}
	class="group flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-lg hover:shadow-zinc-900/10"
>
	<div class="board flex flex-col justify-between p-4 {featured ? 'h-48 sm:h-56 lg:h-full min-h-[240px]' : 'h-36'}">
		<span class="text-3xl font-extrabold tracking-tight">
			{titleInitials(course.title)}
		</span>
		<span class="font-mono text-[10px] tracking-wide text-chalk-dim">
			{course.moduleCount} modul · {course.totalLessons} lesson
		</span>
	</div>
	<div class="shrink-0 p-5">
		<h3 class="font-bold text-zinc-900 transition-colors group-hover:text-teal-700">
			{course.title}
		</h3>
		<p class="mt-1 line-clamp-2 min-h-10 text-sm text-zinc-500">{course.description}</p>
		<div class="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1">
			<span class="rounded-md bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700">
				{LEVEL_LABELS[course.level]}
			</span>
			<span class="font-mono text-[11px] text-zinc-500">{course.totalMinutes} menit</span>
		</div>
	</div>
</a>
