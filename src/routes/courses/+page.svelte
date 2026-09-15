<script lang="ts">
	import CourseCard from '$lib/CourseCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Katalog kursus · KrasCourse</title>
</svelte:head>

<h1 class="text-2xl font-extrabold tracking-tight">Katalog kursus</h1>

<form method="GET" action="/courses" class="mt-6 flex max-w-xl gap-2">
	<input
		type="search"
		name="q"
		value={data.q}
		placeholder="Cari kursus, topik, atau tag…"
		aria-label="Cari kursus"
		class="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm transition focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
	/>
	<button
		type="submit"
		class="shrink-0 rounded-full bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 active:-translate-y-px"
	>
		Cari
	</button>
</form>

{#if data.items.length === 0}
	<p class="mt-10 rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
		{#if data.q}
			Tidak ada kursus cocok dengan &ldquo;{data.q}&rdquo;.
		{:else}
			Belum ada kursus yang dipublikasikan. Kembali lagi sebentar lagi.
		{/if}
	</p>
{:else}
	<div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.items as course (course.id)}
			<CourseCard {course} />
		{/each}
	</div>
{/if}
