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
	<div class="mb-4 flex items-center justify-between text-xs text-zinc-500">
		<span>{summary.done}/{totalLessons} lesson selesai</span>
		<span class="font-semibold text-teal-600">{summary.pct}%</span>
	</div>

	<!-- rel progres vertikal yang terisi mengikuti lesson selesai -->
	<div class="relative ml-[7px] border-l-2 border-zinc-200 pb-2">
		<div
			class="absolute -left-[2px] top-0 w-[2px] rounded-full bg-teal-600 transition-all duration-500"
			style={`height: ${summary.pct}%`}
		></div>

		{#each modules as mod, mi (mod.id)}
			<div class={mi === 0 ? '' : 'mt-6'}>
				<p class="px-4 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
					Modul {mi + 1} · {mod.title}
				</p>
				<ul class="mt-1.5">
					{#each mod.lessons as lesson (lesson.id)}
						{@const done = progress.isLessonDone(slug, lesson.id)}
						{@const isCurrent = lesson.id === currentLessonId}
						<li>
							<a
								href={`/courses/${slug}/lessons/${lesson.id}`}
								class="relative block py-1.5 pl-9 pr-2 text-sm leading-snug {isCurrent
									? 'font-semibold text-teal-700'
									: 'text-zinc-600 transition-colors hover:text-zinc-900'}"
							>
								<span
									class="absolute -left-[7px] top-1/2 flex h-3 w-3 -translate-y-1/2 items-center justify-center rounded-full border-2 {done
										? 'border-teal-600 bg-teal-600'
										: isCurrent
											? 'border-teal-600 bg-white'
											: 'border-zinc-300 bg-white'}"
								>
									{#if done}
										<span class="text-[8px] font-bold leading-none text-white">✓</span>
									{/if}
								</span>
								<span class={done && !isCurrent ? 'text-zinc-500' : ''}>{lesson.title}</span>
								<span class="ml-1 text-[11px] text-zinc-500">{lesson.readingMinutes}m</span>
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	</div>
</div>
