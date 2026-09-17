<script lang="ts">
	import LessonTree from '$lib/LessonTree.svelte';
	import { progress } from '$lib/progress.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const isDone = $derived(progress.isLessonDone(data.course.slug, data.lesson.id));
</script>

<svelte:head>
	<title>{data.lesson.title} · {data.course.title}</title>
</svelte:head>

<div class="grid gap-8 lg:grid-cols-[248px_1fr] lg:gap-12">
	<!-- mobile: daftar materi collapsible -->
	<details class="rounded-xl border border-zinc-200 bg-white lg:hidden">
		<summary class="cursor-pointer px-4 py-3 text-sm font-semibold text-zinc-800">
			Daftar materi
		</summary>
		<div class="max-h-[60vh] overflow-y-auto border-t border-zinc-100 px-4 py-4">
			<LessonTree
				slug={data.course.slug}
				modules={data.modules}
				currentLessonId={data.lesson.id}
				totalLessons={data.totalLessons}
			/>
		</div>
	</details>

	<aside
		class="sticky top-6 hidden max-h-[calc(100vh-3rem)] self-start overflow-y-auto pr-2 lg:block"
	>
		<LessonTree
			slug={data.course.slug}
			modules={data.modules}
			currentLessonId={data.lesson.id}
			totalLessons={data.totalLessons}
		/>
	</aside>

	<article class="min-w-0">
		<div class="flex flex-wrap gap-4 font-mono text-[11px] text-zinc-500">
			<a
				href={`/courses/${data.course.slug}`}
				class="transition-colors hover:text-teal-700"
			>
				{data.course.title}
			</a>
			<span>{data.lesson.moduleTitle}</span>
		</div>

		<h1 class="mt-2 text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
			{data.lesson.title}
		</h1>
		<p class="mt-1.5 font-mono text-[11px] text-zinc-500">{data.lesson.readingMinutes} menit baca</p>

		<!-- HTML sudah dirender server-side: marked → sanitize-html -->
		<div class="prose-custom mt-8">
			{@html data.html}
		</div>

		<div class="mt-9 flex flex-wrap items-center justify-between gap-3.5 border-t border-zinc-200 pt-5">
			{#if data.prev}
				<a
					href={`/courses/${data.course.slug}/lessons/${data.prev.id}`}
					class="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-bold text-zinc-500 transition-colors hover:text-teal-700"
				>
					<span aria-hidden="true">←</span>
					<span class="max-w-[22ch] truncate">{data.prev.title}</span>
				</a>
			{:else}
				<span></span>
			{/if}

			<button
				onclick={() => progress.toggleLesson(data.course.slug, data.lesson.id)}
				class="inline-flex min-h-[46px] items-center rounded-lg bg-teal-700 px-6 text-sm font-bold text-white transition-colors duration-150 hover:bg-teal-800"
			>
				{isDone ? 'Batalkan tandai selesai' : 'Tandai selesai'}
			</button>

			{#if data.next}
				<a
					href={`/courses/${data.course.slug}/lessons/${data.next.id}`}
					class="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-bold text-zinc-500 transition-colors hover:text-teal-700"
				>
					<span class="max-w-[22ch] truncate">{data.next.title}</span>
					<span aria-hidden="true">→</span>
				</a>
			{/if}
		</div>
	</article>
</div>
