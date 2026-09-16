<script lang="ts">
	import { progress } from '$lib/progress.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let index = $state(0);
	let selected = $state<number | null>(null);
	let revealed = $state(false);
	let score = $state(0);
	let finished = $state(false);

	const question = $derived(data.questions[index]!);
	const isLast = $derived(index === data.questions.length - 1);

	function selectOption(optionIndex: number): void {
		if (!revealed) selected = optionIndex;
	}

	function checkAnswer(): void {
		if (selected === null || revealed) return;
		revealed = true;
		if (selected === question.answer_index) score++;
	}

	function nextQuestion(): void {
		if (isLast) {
			finished = true;
			progress.saveQuiz(data.course.slug, data.module.id, score, data.questions.length);
			return;
		}
		index++;
		selected = null;
		revealed = false;
	}

	function restart(): void {
		index = 0;
		selected = null;
		revealed = false;
		score = 0;
		finished = false;
	}
</script>

<svelte:head>
	<title>Kuis: {data.module.title} · {data.course.title}</title>
</svelte:head>

<div class="mx-auto max-w-2xl">
	{#if finished}
		<div class="mt-8 grid items-center gap-7 md:grid-cols-2">
			<div
				class="board rounded-md border-[9px] border-[color:var(--color-frame)] p-8 shadow-[0_24px_48px_-24px_rgba(22,49,41,0.45)]"
			>
				<p class="font-mono text-[10.5px] tracking-widest text-chalk-dim">NILAI</p>
				<p class="mt-2 text-6xl font-extrabold tracking-tight text-chalk tabular-nums sm:text-7xl">
					{score}<span class="text-3xl font-bold text-chalk-dim">/{data.questions.length}</span>
				</p>
				<p class="mt-3 text-[13.5px] text-chalk-dim">
					Kerja bagus. Skor tersimpan di perangkat Anda.
				</p>
			</div>

			<div class="flex flex-col items-start gap-3">
				<p class="text-sm text-zinc-500">
					Ulangi kuis kapan saja untuk skor lebih baik, atau lanjut ke modul berikutnya.
				</p>
				<button
					onclick={restart}
					class="inline-flex min-h-[46px] items-center justify-center rounded-lg bg-teal-700 px-6 text-sm font-bold text-white transition-colors duration-150 hover:bg-teal-800"
				>
					Ulangi kuis
				</button>
				<a
					href={`/courses/${data.course.slug}`}
					class="inline-flex min-h-[46px] items-center justify-center rounded-lg border border-zinc-300 px-5 text-sm font-bold text-zinc-500 transition-colors duration-150 hover:border-teal-700 hover:text-teal-700"
				>
					Kembali ke kursus
				</a>
			</div>
		</div>
	{:else}
		<!-- kop lembar ujian -->
		<div class="flex flex-wrap items-center justify-between gap-4 border-b-2 border-zinc-900 py-4">
			<div>
				<p class="text-lg font-extrabold tracking-tight text-zinc-900">Kuis {data.module.title}</p>
				<span class="font-mono text-[11px] text-zinc-500">{data.course.title}</span>
			</div>
			<div class="flex gap-1.5" aria-label="Soal {index + 1} dari {data.questions.length}">
				{#each data.questions as _, qi (qi)}
					<span
						class="h-[13px] w-[13px] rounded-sm border-[1.5px] {qi <= index
							? 'border-teal-700 bg-teal-700'
							: 'border-zinc-300 bg-white'}"
					></span>
				{/each}
			</div>
		</div>

		<div class="mt-7">
			<p class="font-mono text-[11px] font-bold text-teal-700">SOAL {index + 1}</p>
			<h3 class="mt-2 text-lg font-bold leading-snug text-zinc-900">{question.question}</h3>

			<div class="mt-5 grid gap-2.5">
				{#each question.options as option, oi (oi)}
					{@const isCorrect = revealed && oi === question.answer_index}
					{@const isWrongPick = revealed && selected === oi && oi !== question.answer_index}
					<button
						onclick={() => selectOption(oi)}
						disabled={revealed}
						class="grid min-h-[46px] w-full grid-cols-[28px_1fr] items-center gap-3.5 rounded-lg border-[1.5px] px-4 py-3.5 text-left text-[14.5px] transition-colors duration-150 {isCorrect
							? 'border-teal-700 bg-teal-50 font-semibold text-teal-700'
							: isWrongPick
								? 'border-red-200 bg-red-50 text-zinc-700'
								: revealed
									? 'border-zinc-200 bg-white text-zinc-700 opacity-55'
									: selected === oi
										? 'border-teal-700 bg-white text-zinc-700'
										: 'border-zinc-200 bg-white text-zinc-700 hover:border-teal-700'} disabled:cursor-default"
					>
						<span
							class="flex h-7 w-7 items-center justify-center rounded-lg border-[1.5px] font-mono text-xs font-bold {isCorrect
								? 'border-teal-700 bg-teal-700 text-white'
								: isWrongPick
									? 'border-red-700 text-red-700'
									: 'border-zinc-300 text-zinc-500'}"
						>
							{isCorrect ? '✓' : String.fromCharCode(65 + oi)}
						</span>
						<span>{option}</span>
					</button>
				{/each}
			</div>

			{#if revealed}
				<div class="mt-4 rounded-lg border border-teal-200 bg-teal-50 p-4">
					<p class="font-mono text-[10px] font-bold tracking-widest text-teal-700">PEMBAHASAN</p>
					<p class="mt-1 text-sm text-zinc-600">{question.explanation}</p>
				</div>
				<button
					onclick={nextQuestion}
					class="mt-5 inline-flex min-h-[46px] w-full items-center justify-center rounded-lg bg-teal-700 px-6 text-sm font-bold text-white transition-colors duration-150 hover:bg-teal-800"
				>
					{isLast ? 'Lihat hasil' : 'Soal berikutnya'}
				</button>
			{:else}
				<button
					onclick={checkAnswer}
					disabled={selected === null}
					class="mt-5 inline-flex min-h-[46px] w-full items-center justify-center rounded-lg bg-teal-700 px-6 text-sm font-bold text-white transition-colors duration-150 hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
				>
					Periksa jawaban
				</button>
			{/if}
		</div>
	{/if}
</div>
