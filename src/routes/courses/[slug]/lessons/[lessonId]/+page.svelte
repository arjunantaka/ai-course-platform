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

<div class="md:flex md:gap-10">
	<!-- mobile: daftar materi collapsible -->
	<details class="mb-6 rounded-2xl border border-zinc-200 bg-white md:hidden">
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

	<aside class="hidden w-72 shrink-0 md:block">
		<div class="sticky top-8 max-h-[calc(100vh-5rem)] overflow-y-auto pr-2">
			<LessonTree
				slug={data.course.slug}
				modules={data.modules}
				currentLessonId={data.lesson.id}
				totalLessons={data.totalLessons}
			/>
		</div>
	</aside>

	<article class="min-w-0 flex-1">
		<nav class="text-xs text-zinc-500">
			<a href={`/courses/${data.course.slug}`} class="hover:text-teal-600">{data.course.title}</a>
			<span aria-hidden="true"> / </span>
			<span>{data.lesson.moduleTitle}</span>
		</nav>

		<h1 class="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{data.lesson.title}</h1>
		<p class="mt-1 text-xs text-zinc-500">{data.lesson.readingMinutes} menit baca</p>

		<!-- HTML sudah dirender server-side: marked → sanitize-html -->
		<div class="prose-custom mt-8">
			{@html data.html}
		</div>

		<div class="mt-12 flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-6">
			<button
				onclick={() => progress.toggleLesson(data.course.slug, data.lesson.id)}
				class="rounded-full px-5 py-3 text-sm font-semibold transition active:-translate-y-px {isDone
					? 'bg-teal-600 text-white hover:bg-teal-700'
					: 'border border-teal-600 text-teal-700 hover:bg-teal-50'}"
			>
				{isDone ? '✓ Selesai · batalkan' : 'Tandai selesai'}
			</button>

			{#if data.quizModuleId}
				<a
					href={`/courses/${data.course.slug}/quiz/${data.quizModuleId}`}
					class="rounded-full bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 active:-translate-y-px"
				>
					Kerjakan kuis modul
				</a>
			{/if}
		</div>

		<div class="mt-6 flex items-center justify-between gap-4 text-sm">
			{#if data.prev}
				<a
					href={`/courses/${data.course.slug}/lessons/${data.prev.id}`}
					class="min-w-0 max-w-[45%] rounded-2xl border border-zinc-200 bg-white px-4 py-3 transition-colors hover:border-teal-600"
				>
					<span class="block text-xs text-zinc-500">← Sebelumnya</span>
					<span class="block truncate font-semibold text-zinc-700">{data.prev.title}</span>
				</a>
			{:else}
				<span></span>
			{/if}

			{#if data.next}
				<a
					href={`/courses/${data.course.slug}/lessons/${data.next.id}`}
					class="min-w-0 max-w-[45%] rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-right transition-colors hover:border-teal-600"
				>
					<span class="block text-xs text-zinc-500">Berikutnya →</span>
					<span class="block truncate font-semibold text-zinc-700">{data.next.title}</span>
				</a>
			{/if}
		</div>
	</article>
</div>
