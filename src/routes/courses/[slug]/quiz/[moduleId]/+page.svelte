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
	<nav class="text-xs text-zinc-500">
		<a href={`/courses/${data.course.slug}`} class="hover:text-teal-600">{data.course.title}</a>
		<span aria-hidden="true"> / </span>
		<span>Kuis modul</span>
	</nav>

	{#if finished}
		<section class="mt-6 rounded-2xl border border-zinc-200 bg-white p-10 text-center">
			<p class="text-sm font-medium text-zinc-500">Skor akhir</p>
			<p class="mt-2 text-5xl font-extrabold tabular-nums text-teal-600">
				{score}<span class="text-2xl text-zinc-500">/{data.questions.length}</span>
			</p>
			<p class="mt-3 text-sm text-zinc-500">
				{score === data.questions.length
					? 'Sempurna. Semua jawaban benar.'
					: score >= Math.ceil(data.questions.length / 2)
						? 'Kerja bagus. Ulangi untuk skor lebih baik.'
						: 'Belum lulus. Pelajari kembali materinya, lalu ulangi.'}
			</p>
			<p class="mt-1 text-xs text-zinc-500">Skor tersimpan di perangkat Anda.</p>

			<div class="mt-8 flex flex-wrap justify-center gap-3">
				<button
					onclick={restart}
					class="rounded-full bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 active:-translate-y-px"
				>
					Ulangi kuis
				</button>
				<a
					href={`/courses/${data.course.slug}`}
					class="rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:border-teal-600 hover:text-teal-600"
				>
					Kembali ke kursus
				</a>
			</div>
		</section>
	{:else}
		<section class="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8">
			<div class="flex items-center justify-between text-xs text-zinc-500">
				<span class="font-semibold tabular-nums text-teal-600">Soal {index + 1} / {data.questions.length}</span>
				<div class="h-1.5 w-32 overflow-hidden rounded-full bg-zinc-100">
					<div
						class="h-full rounded-full bg-teal-600 transition-all duration-300"
						style={`width: ${(index / data.questions.length) * 100}%`}
					></div>
				</div>
			</div>

			<h1 class="mt-4 text-lg font-bold leading-relaxed text-zinc-900">{question.question}</h1>

			<div class="mt-5 space-y-2.5">
				{#each question.options as option, oi (oi)}
					{@const isCorrect = revealed && oi === question.answer_index}
					{@const isWrongPick = revealed && selected === oi && oi !== question.answer_index}
					<button
						onclick={() => selectOption(oi)}
						disabled={revealed}
						class="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition {isCorrect
							? 'border-teal-600 bg-teal-50 font-semibold text-teal-800'
							: isWrongPick
								? 'border-red-400 bg-red-50 text-red-700'
								: selected === oi
									? 'border-teal-600 bg-teal-50/60 text-zinc-800'
									: 'border-zinc-200 bg-white text-zinc-700 hover:border-teal-600 active:-translate-y-px'} disabled:cursor-default disabled:active:translate-y-0"
					>
						<span
							class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold {isCorrect
								? 'bg-teal-600 text-white'
								: isWrongPick
									? 'bg-red-500 text-white'
									: 'bg-zinc-100 text-zinc-500'}"
						>
							{isCorrect ? '✓' : isWrongPick ? '✕' : String.fromCharCode(65 + oi)}
						</span>
						<span>{option}</span>
					</button>
				{/each}
			</div>

			{#if revealed}
				<div class="mt-5 rounded-2xl border border-teal-200 bg-teal-50/60 p-4 text-sm">
					<p class="font-semibold {selected === question.answer_index ? 'text-teal-700' : 'text-red-600'}">
						{selected === question.answer_index ? 'Benar.' : 'Kurang tepat.'}
					</p>
					<p class="mt-1 leading-relaxed text-zinc-600">{question.explanation}</p>
				</div>
				<button
					onclick={nextQuestion}
					class="mt-5 w-full rounded-full bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 active:-translate-y-px"
				>
					{isLast ? 'Lihat hasil →' : 'Soal berikutnya →'}
				</button>
			{:else}
				<button
					onclick={checkAnswer}
					disabled={selected === null}
					class="mt-5 w-full rounded-full bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 active:-translate-y-px disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:active:translate-y-0"
				>
					Periksa jawaban
				</button>
			{/if}
		</section>
	{/if}
</div>
