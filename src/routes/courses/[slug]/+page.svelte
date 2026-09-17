<script lang="ts">
	import { progress } from '$lib/progress.svelte';
	import { LEVEL_LABELS } from '$lib/utils';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const summary = $derived(progress.summary(data.course.slug, data.course.totalLessons));

	// Target CTA: lesson pertama saat belum mulai, lesson belum selesai berikutnya saat sudah mulai,
	// lesson pertama lagi saat semuanya selesai.
	const cta = $derived.by(() => {
		if (!data.firstLessonId) return null;
		if (summary.done === 0) {
			return { label: 'Mulai belajar', lessonId: data.firstLessonId };
		}
		for (let mi = 0; mi < data.modules.length; mi++) {
			for (const lesson of data.modules[mi].lessons) {
				if (!progress.isLessonDone(data.course.slug, lesson.id)) {
					return { label: `Lanjut Modul ${mi + 1}`, lessonId: lesson.id };
				}
			}
		}
		return { label: 'Mulai belajar', lessonId: data.firstLessonId };
	});
</script>

<svelte:head>
	<title>{data.course.title} · KrasCourse</title>
</svelte:head>

<div
	class="overflow-hidden rounded border-[9px] border-[color:var(--color-frame)] shadow-[0_24px_48px_-24px_rgba(22,49,41,0.45)]"
>
	<div class="board p-6 sm:p-10">
		<p class="font-mono text-[11px] uppercase tracking-wide text-chalk-dim">
			{LEVEL_LABELS[data.course.level]}
		</p>
		<h1 class="mt-3 max-w-[18ch] text-3xl font-extrabold tracking-tight text-chalk sm:text-4xl">
			{data.course.title}
		</h1>
		<p class="mt-3 max-w-[60ch] text-chalk-dim">{data.course.description}</p>
	</div>
</div>

<div
	class="grid gap-6 rounded-xl border border-zinc-200 border-t-0 bg-white p-6 sm:p-8 lg:grid-cols-[1.5fr_1fr]"
>
	<div>
		<div class="flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-500">
			<span>
				Level <span class="font-bold text-zinc-900">{LEVEL_LABELS[data.course.level]}</span>
			</span>
			<span>
				<span class="font-bold text-zinc-900">{data.modules.length} modul</span>
				·
				<span class="font-bold text-zinc-900">{data.course.totalLessons} lesson</span>
			</span>
			<span>
				<span class="font-bold text-zinc-900">{data.totalMinutes} menit</span> total
			</span>
		</div>

		{#if data.tags.length > 0}
			<div class="mt-4 flex flex-wrap gap-2">
				{#each data.tags as tag (tag)}
					<span class="rounded-md bg-teal-50 px-2.5 py-1 font-mono text-[11px] text-teal-700">
						{tag}
					</span>
				{/each}
			</div>
		{/if}

		{#if cta}
			<a
				href={`/courses/${data.course.slug}/lessons/${cta.lessonId}`}
				class="mt-6 inline-flex min-h-[46px] items-center rounded-lg bg-teal-700 px-6 text-sm font-bold text-white transition-colors duration-150 hover:bg-teal-800 active:translate-y-px"
			>
				{cta.label}
			</a>
		{:else}
			<button
				disabled
				class="mt-6 inline-flex min-h-[46px] cursor-not-allowed items-center rounded-lg bg-zinc-100 px-6 text-sm font-bold text-zinc-500"
			>
				Belum ada lesson
			</button>
		{/if}
	</div>

	<div>
		<div class="flex justify-between font-mono text-[11px] text-zinc-500">
			<span>{summary.done}/{data.course.totalLessons} selesai</span>
			<span class="font-bold text-teal-700">{summary.pct}%</span>
		</div>
		<div class="mt-2 flex flex-wrap gap-1.5" aria-hidden="true">
			{#each Array(data.course.totalLessons) as _, i (i)}
				<span
					class="relative flex h-[17px] w-[17px] items-center justify-center rounded border-[1.5px] {i <
					summary.done
						? 'border-teal-700 bg-teal-700'
						: 'border-zinc-300 bg-white'}"
				>
					{#if i < summary.done}
						<svg class="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none" aria-hidden="true">
							<path
								d="M1.5 5.25 4 7.75l4.5-5.5"
								stroke="currentColor"
								stroke-width="1.8"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					{/if}
				</span>
			{/each}
		</div>
	</div>
</div>

<h2 class="mt-12 text-2xl font-extrabold tracking-tight text-zinc-900">Kurikulum</h2>

<div class="mt-4">
	{#each data.modules as mod, mi (mod.id)}
		{@const modMinutes = mod.lessons.reduce((sum, lesson) => sum + lesson.readingMinutes, 0)}
		<section class="border-t border-zinc-200 py-4">
			<div class="grid grid-cols-[34px_1fr_auto] items-center gap-3.5">
				<span
					class="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg border-2 border-zinc-900 font-mono text-[13px] font-bold text-zinc-900"
				>
					{mi + 1}
				</span>
				<h3 class="font-bold text-zinc-900">{mod.title}</h3>
				<span class="text-right font-mono text-[11px] text-zinc-500">
					{mod.lessons.length} lesson · {modMinutes} menit
				</span>
			</div>

			<ul class="mt-2.5">
				{#each mod.lessons as lesson, li (lesson.id)}
					{@const done = progress.isLessonDone(data.course.slug, lesson.id)}
					<li
						class="grid min-h-[44px] grid-cols-[17px_1fr_auto] items-center gap-3 border-t border-dashed border-zinc-200 py-1.5 md:pl-12"
					>
						<span
							class="relative flex h-[17px] w-[17px] items-center justify-center rounded border-[1.5px] {done
								? 'border-teal-700 bg-teal-700'
								: 'border-zinc-300 bg-white'}"
							aria-hidden="true"
						>
							{#if done}
								<svg
									class="h-2.5 w-2.5 text-white"
									viewBox="0 0 10 10"
									fill="none"
									aria-hidden="true"
								>
									<path
										d="M1.5 5.25 4 7.75l4.5-5.5"
										stroke="currentColor"
										stroke-width="1.8"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							{/if}
						</span>
						<a
							href={`/courses/${data.course.slug}/lessons/${lesson.id}`}
							class="flex min-h-[44px] items-center text-sm font-semibold transition-colors duration-150 {done
								? 'text-zinc-500'
								: 'text-zinc-700 hover:text-teal-700'}"
						>
							{lesson.title}{#if done}<span class="sr-only">, selesai</span>{/if}
						</a>
						<span class="font-mono text-[10.5px] text-zinc-500">
							{lesson.readingMinutes} menit
						</span>
					</li>
				{/each}
			</ul>

			{#if mod.hasQuiz}
				{@const quizResult = progress.quizResult(data.course.slug, mod.id)}
				<div class="mt-1 flex flex-wrap items-center gap-3.5 py-3 md:pl-12">
					<span class="rounded-md bg-zinc-900 px-2.5 py-1 text-[11px] font-bold text-white">
						Kuis
					</span>
					<a
						href={`/courses/${data.course.slug}/quiz/${mod.id}`}
						class="inline-flex min-h-[44px] items-center text-sm font-bold text-teal-700 hover:underline"
					>
						Kuis Modul {mi + 1}
					</a>
					<span class="font-mono text-[11px] text-zinc-500">
						{quizResult ? `Nilai ${quizResult.score}/${quizResult.total}` : 'Belum dikerjakan'}
					</span>
				</div>
			{/if}
		</section>
	{/each}
</div>
