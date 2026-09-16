<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status === 404 ? 'Halaman tidak ditemukan' : 'Kesalahan'} · KrasCourse</title>
</svelte:head>

<section class="flex items-center justify-center py-12 md:py-16">
	<div
		class="board w-full max-w-xl rounded-md border-[9px] border-[color:var(--color-frame)] p-6 shadow-[0_24px_48px_-24px_rgba(22,49,41,0.45)] sm:p-10"
	>
		<p class="text-6xl font-extrabold leading-none tracking-tight text-chalk">{page.status}</p>
		<h1 class="mt-4 text-xl font-bold text-chalk">
			{page.status === 404 ? 'Halaman tidak ditemukan' : 'Terjadi kesalahan'}
		</h1>
		{#if page.error?.message}
			<p class="mt-2 text-sm text-chalk-dim">{page.error.message}</p>
		{/if}
		<a
			href="/"
			class="mt-8 inline-flex min-h-[46px] items-center rounded-lg border-[1.5px] border-chalk px-6 text-sm font-bold text-chalk transition-colors duration-150 hover:bg-chalk hover:text-board"
		>
			Kembali ke beranda
		</a>
	</div>
</section>
