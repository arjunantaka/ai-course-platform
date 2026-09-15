<script lang="ts">
	import CourseCard from '$lib/CourseCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const VALUES = [
		{
			title: 'Materi selalu baru',
			desc: 'Kursus dirancang dan ditulis ulang oleh AI, jadi selalu ada topik baru untuk dipelajari.'
		},
		{
			title: 'Kuis langsung dinilai',
			desc: 'Tiap modul ditutup kuis pilihan ganda dengan pembahasan instan setelah menjawab.'
		},
		{
			title: 'Belajar tanpa akun',
			desc: 'Tidak perlu daftar atau login. Progres belajar Anda tersimpan di perangkat sendiri.'
		}
	];
</script>

<svelte:head>
	<title>KrasCourse · belajar tanpa akun</title>
</svelte:head>

<section class="max-w-3xl pb-14 pt-4 md:pb-20 md:pt-14">
	<h1
		class="text-4xl font-extrabold leading-[1.05] tracking-tighter text-zinc-900 sm:text-5xl lg:text-6xl"
	>
		Belajar skill baru,
		<span class="text-teal-600">langsung mulai</span>
	</h1>
	<p class="mt-5 max-w-[65ch] text-lg leading-relaxed text-zinc-500">
		Kursus lengkap dengan materi dan kuis, dibuat oleh AI dan bisa langsung dipelajari tanpa akun.
	</p>
	<a
		href="/courses"
		class="mt-8 inline-block rounded-full bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 active:-translate-y-px"
	>
		Lihat semua kursus
	</a>
</section>

<section aria-label="Keunggulan KrasCourse" class="divide-y divide-zinc-200 border-t border-zinc-200">
	{#each VALUES as value (value.title)}
		<div class="grid gap-1.5 py-6 md:grid-cols-[12rem_1fr] md:gap-8 md:py-7">
			<p class="font-bold text-zinc-900">{value.title}</p>
			<p class="text-sm leading-relaxed text-zinc-500">{value.desc}</p>
		</div>
	{/each}
</section>

<section class="mt-16 md:mt-20">
	<h2 class="text-xl font-extrabold tracking-tight">Kursus terbaru</h2>

	{#if data.latest.length === 0}
		<p
			class="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500"
		>
			Kursus pertama sedang disiapkan. Kembali lagi sebentar lagi.
		</p>
	{:else}
		<div class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.latest as course (course.id)}
				<CourseCard {course} />
			{/each}
		</div>
	{/if}
</section>
