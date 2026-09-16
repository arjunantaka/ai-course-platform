<script lang="ts">
	import CourseCard from '$lib/CourseCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Katalog kursus · KrasCourse</title>
</svelte:head>

<h1 class="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">Katalog kursus</h1>

<form method="GET" action="/courses" class="mt-6 flex gap-2">
	<input
		type="search"
		name="q"
		value={data.q}
		placeholder="Cari kursus, topik, atau tag…"
		aria-label="Cari kursus"
		class="w-full max-w-[520px] min-h-[46px] rounded-lg border border-zinc-300 bg-white px-4 text-zinc-900 placeholder:text-zinc-500 focus:border-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-100"
	/>
	<button
		type="submit"
		class="inline-flex min-h-[46px] shrink-0 items-center rounded-lg bg-teal-700 px-6 text-sm font-bold text-white transition-colors duration-150 hover:bg-teal-800 active:translate-y-px"
	>
		Cari
	</button>
</form>

{#if data.courseCards.length === 0}
	<div class="mt-10 rounded-xl border border-dashed border-zinc-300 p-10 text-center">
		{#if data.q}
			<p class="text-sm text-zinc-500">
				Tidak ada kursus untuk &ldquo;{data.q}&rdquo;. Coba kata kunci lain.
			</p>
			<a
				href="/courses"
				class="mt-5 inline-flex min-h-[44px] items-center rounded-lg border border-zinc-300 px-5 text-sm font-semibold text-zinc-700 transition-colors duration-150 hover:border-teal-700 hover:text-teal-700"
			>
				Reset pencarian
			</a>
		{:else}
			<p class="text-sm text-zinc-500">
				Belum ada kursus yang dipublikasikan. Kembali lagi sebentar lagi.
			</p>
		{/if}
	</div>
{:else}
	<div class="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr]">
		{#each data.courseCards as course, i (course.id)}
			<div class={i === 0 ? 'lg:row-span-2' : ''}>
				<CourseCard {course} featured={i === 0} />
			</div>
		{/each}
	</div>
{/if}
