<script lang="ts">
	import CourseCard from '$lib/CourseCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const NOTES = [
		{ title: 'Tanpa akun', desc: 'Langsung belajar, tanpa daftar.' },
		{ title: 'Progres di perangkat Anda', desc: 'Lesson selesai dan skor kuis tersimpan lokal.' },
		{ title: 'Kuis dinilai saat itu', desc: 'Setiap modul ditutup kuis beserta pembahasannya.' }
	];
</script>

<svelte:head>
	<title>KrasCourse · belajar tanpa akun</title>
</svelte:head>

<section class="py-4 md:py-6">
	<div
		class="board border-[9px] border-[color:var(--color-frame)] p-6 shadow-[0_24px_48px_-24px_rgba(22,49,41,0.45)] sm:p-10 md:p-12"
	>
		<h1
			class="max-w-[17ch] text-balance text-3xl font-extrabold leading-[1.12] tracking-tight text-chalk sm:text-4xl md:text-5xl"
		>
			Kelasnya selalu terbuka,
			<span class="relative">materinya selalu baru<svg viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true" class="absolute -bottom-2.5 left-0 h-3 w-full"><path d="M3 8 C 40 3, 80 11, 118 6 S 180 4, 197 7" fill="none" stroke="var(--color-chalk-teal)" stroke-width="4" stroke-linecap="round"></path></svg></span>
		</h1>
		<p class="mt-6 max-w-[52ch] text-[15.5px] text-chalk-dim">
			Kursus ditulis AI lalu dikurasi admin, topik baru naik tiap minggu. Masuk, pilih topik,
			langsung belajar. Tanpa akun, tanpa biaya.
		</p>
		<a
			href="/courses"
			class="mt-8 inline-flex min-h-[46px] items-center rounded-lg border-[1.5px] border-chalk px-6 text-sm font-bold text-chalk transition-colors duration-150 hover:bg-chalk hover:text-board"
		>
			Buka katalog kursus
		</a>
		<div class="mt-10 grid gap-3 border-t border-chalk/20 pt-5 md:grid-cols-3 md:gap-0">
			{#each NOTES as note (note.title)}
				<div class="md:border-l md:border-chalk/20 md:first:border-l-0 md:pl-6 md:first:pl-0">
					<b class="block text-sm font-bold text-chalk">{note.title}</b>
					<p class="text-[13px] text-chalk-dim">{note.desc}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<section aria-labelledby="kursus-terbaru" class="pb-16 md:pb-20">
	<h2 id="kursus-terbaru" class="mb-5 text-2xl font-extrabold tracking-tight text-zinc-900">
		Kursus terbaru
	</h2>

	{#if data.latest.length === 0}
		<p
			class="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500"
		>
			Kursus pertama sedang disiapkan. Kembali lagi sebentar lagi.
		</p>
	{:else}
		<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr]">
			{#each data.latest as course, i (course.id)}
				{#if i === 0}
					<div class="grid lg:row-span-2">
						<CourseCard {course} featured={true} />
					</div>
				{:else}
					<CourseCard {course} />
				{/if}
			{/each}
		</div>
	{/if}
</section>
