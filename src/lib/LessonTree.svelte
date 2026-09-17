<script lang="ts">
	import { progress } from '$lib/progress.svelte';
	import type { ModuleNode } from '$lib/server/courses';

	let {
		slug,
		modules,
		currentLessonId,
		totalLessons
	}: {
		slug: string;
		modules: ModuleNode[];
		currentLessonId?: string;
		totalLessons: number;
	} = $props();

	const summary = $derived(progress.summary(slug, totalLessons));
</script>

<div>
	<div class="flex items-baseline justify-between font-mono text-[11px] text-zinc-500">
		<span>{summary.done}/{totalLessons} selesai</span>
		<span class="font-bold text-teal-700">{summary.pct}%</span>
	</div>

	<!-- strip kotak centang: satu kotak per lesson, terisi mengikuti progres nyata -->
	<div class="mt-2 flex flex-wrap gap-[5px]" aria-hidden="true">
		{#each Array.from({ length: totalLessons }) as _, i (i)}
			<span
				class="flex h-[17px] w-[17px] items-center justify-center rounded border-[1.5px] {i <
				summary.done
					? 'border-teal-700 bg-teal-700'
					: 'border-zinc-300 bg-white'}"
			>
				{#if i < summary.done}
					<svg
						viewBox="0 0 10 10"
						class="h-[9px] w-[9px]"
						fill="none"
						stroke="#ffffff"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M1.5 5.5 4 8l4.5-6" />
					</svg>
				{/if}
			</span>
		{/each}
	</div>

	{#each modules as mod, mi (mod.id)}
		<section class={mi === 0 ? 'mt-5' : 'mt-4'}>
			<p class="font-mono text-[10.5px] font-bold text-zinc-500">Modul {mi + 1}. {mod.title}</p>
			<ul class="mt-1">
				{#each mod.lessons as lesson (lesson.id)}
					{@const done = progress.isLessonDone(slug, lesson.id)}
					{@const isCurrent = lesson.id === currentLessonId}
					<li>
						<a
							href={`/courses/${slug}/lessons/${lesson.id}`}
							aria-current={isCurrent ? 'page' : undefined}
							class="grid min-h-[44px] grid-cols-[17px_1fr_auto] items-center gap-2.5 py-1.5 text-[13px] {isCurrent
								? 'font-bold text-teal-700'
								: 'text-zinc-500 transition-colors hover:text-zinc-900'}"
						>
							<span
								class="flex h-[17px] w-[17px] items-center justify-center rounded border-[1.5px] {done
									? 'border-teal-700 bg-teal-700'
									: 'border-zinc-300 bg-white'}"
							>
								{#if done}
									<svg
										viewBox="0 0 10 10"
										class="h-[9px] w-[9px]"
										fill="none"
										stroke="#ffffff"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										aria-hidden="true"
									>
										<path d="M1.5 5.5 4 8l4.5-6" />
									</svg>
								{/if}
							</span>
							<span class="min-w-0">{lesson.title}{#if done}<span class="sr-only">, selesai</span>{/if}</span>
							<span class="font-mono text-[10px] text-zinc-500">{lesson.readingMinutes}m</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>
