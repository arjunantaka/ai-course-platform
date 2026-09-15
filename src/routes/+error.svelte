<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status === 404 ? 'Halaman tidak ditemukan' : 'Kesalahan'} · KrasCourse</title>
</svelte:head>

<div class="py-24 text-center">
	<p class="text-6xl font-extrabold text-teal-600">{page.status}</p>
	<h1 class="mt-4 text-xl font-bold text-zinc-900">
		{page.status === 404 ? 'Halaman tidak ditemukan' : 'Terjadi kesalahan'}
	</h1>
	{#if page.error?.message}
		<p class="mt-2 text-sm text-zinc-500">{page.error.message}</p>
	{/if}
	<a
		href="/"
		class="mt-8 inline-block rounded-full bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
	>
		Kembali ke beranda
	</a>
</div>
