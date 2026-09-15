<script lang="ts">
	import { progress } from '$lib/progress.svelte';
	import { coverGradient, LEVEL_LABELS, titleInitials } from '$lib/utils';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const summary = $derived(progress.summary(data.course.slug, data.course.totalLessons));
</script>

<svelte:head>
	<title>{data.course.title} · KrasCourse</title>
</svelte:head>

<div class="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
	<div
		class="flex h-28 items-center justify-center"
		style={`background: ${coverGradient(data.course.slug)}`}
	>
		<span class="text-4xl font-extrabold tracking-wide text-white/90">
			{titleInitials(data.course.title)}
		</span>
	</div>

	<div class="p-6 sm:p-8">
		<div class="flex flex-wrap items-start justify-between gap-6">
			<div class="min-w-0 max-w-2xl">
				<h1 class="text-2xl font-extrabold tracking-tight sm:text-3xl">{data.course.title}</h1>
				<p class="mt-2 leading-relaxed text-zinc-600">{data.course.description}</p>
				<div class="mt-4 flex flex-wrap items-center gap-2 text-xs">
					<span class="rounded-md bg-teal-50 px-2.5 py-1 font-semibold text-teal-700">
						{LEVEL_LABELS[data.course.level]}
					</span>
					{#each data.tags as tag (tag)}
						<span class="rounded-md border border-teal-200 px-2.5 py-1 font-medium text-teal-700">
							{tag}
						</span>
					{/each}
				</div>
				<p class="mt-3 text-xs text-zinc-500">
					{data.modules.length} modul · {data.course.totalLessons} lesson
					<span class="border-l border-zinc-200 pl-2">{data.totalMinutes} menit</span>
				</p>
			</div>

		{#if data.firstLessonId}
			<a
				href={`/courses/${data.course.slug}/lessons/${data.firstLessonId}`}
				class="shrink-0 rounded-full bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 active:-translate-y-px"
			>
				Mulai belajar
			</a>
		{:else}
			<button
				disabled
				class="shrink-0 cursor-not-allowed rounded-full bg-zinc-100 px-6 py-3 text-sm font-semibold text-zinc-500"
			>
				Belum ada lesson
			</button>
		{/if}
	</div>

		<div class="mt-6">
			<div class="flex items-center justify-between text-xs text-zinc-500">
				<span>{summary.done}/{data.course.totalLessons} lesson selesai</span>
				<span class="font-semibold text-teal-600">{summary.pct}%</span>
			</div>
			<div class="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100">
				<div
					class="h-full rounded-full bg-teal-600 transition-all duration-500"
					style={`width: ${summary.pct}%`}
				></div>
			</div>
		</div>
	</div>
</div>

<h2 class="mt-10 text-lg font-extrabold tracking-tight">Kurikulum</h2>

{#each data.modules as mod, mi (mod.id)}
	<section class="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
		<p class="text-[11px] font-bold uppercase tracking-wide text-teal-600">Modul {mi + 1}</p>
		<h3 class="mt-1 font-bold text-zinc-900">{mod.title}</h3>
		<p class="mt-0.5 text-sm text-zinc-500">{mod.summary}</p>

		<ul class="mt-4 divide-y divide-zinc-100">
			{#each mod.lessons as lesson, li (lesson.id)}
				{@const done = progress.isLessonDone(data.course.slug, lesson.id)}
				<li>
					<a
						href={`/courses/${data.course.slug}/lessons/${lesson.id}`}
						class="group flex items-center justify-between gap-3 py-2.5 text-sm"
					>
						<span class="flex min-w-0 items-center gap-3">
							<span
								class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold {done
									? 'bg-teal-600 text-white'
									: 'bg-zinc-100 text-zinc-500'}"
							>
								{done ? '✓' : li + 1}
							</span>
							<span class="truncate {done
								? 'text-zinc-500'
								: 'text-zinc-700 transition-colors group-hover:text-teal-600'}">
								{lesson.title}
							</span>
						</span>
						<span class="shrink-0 text-xs text-zinc-500">{lesson.readingMinutes} menit</span>
					</a>
				</li>
			{/each}
		</ul>

		{#if mod.hasQuiz}
			{@const quizResult = progress.quizResult(data.course.slug, mod.id)}
			<div class="mt-4 flex items-center gap-2 text-xs">
				<span class="rounded-md bg-teal-50 px-2.5 py-1 font-semibold text-teal-700">Kuis</span>
				{#if quizResult}
					<span class="text-zinc-500">
						Skor terakhir: <strong class="text-teal-700">{quizResult.score}/{quizResult.total}</strong>
					</span>
				{/if}
			</div>
		{/if}
	</section>
{/each}
