<script lang="ts">
	import { coverGradient, LEVEL_LABELS, titleInitials } from '$lib/utils';
	import type { CourseCard } from '$lib/server/courses';

	let { course }: { course: CourseCard } = $props();
</script>

<a
	href={`/courses/${course.slug}`}
	class="group block overflow-hidden rounded-2xl border border-zinc-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-zinc-900/10"
>
	<div
		class="flex h-32 items-center justify-center"
		style={`background: ${coverGradient(course.slug)}`}
	>
		<span class="text-4xl font-extrabold tracking-wide text-white/90">
			{titleInitials(course.title)}
		</span>
	</div>
	<div class="p-5">
		<h3 class="font-bold text-zinc-900 transition-colors group-hover:text-teal-600">
			{course.title}
		</h3>
		<p class="mt-1 line-clamp-2 min-h-10 text-sm text-zinc-500">{course.description}</p>
		<div class="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
			<span class="rounded-md bg-teal-50 px-2 py-0.5 font-semibold text-teal-700">
				{LEVEL_LABELS[course.level]}
			</span>
			<span>{course.moduleCount} modul · {course.totalLessons} lesson</span>
			<span class="border-l border-zinc-200 pl-2">{course.totalMinutes} menit</span>
		</div>
	</div>
</a>
