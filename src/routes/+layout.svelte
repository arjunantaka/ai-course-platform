<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

	<a
		href="#konten"
		class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-teal-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
	>
		Lewati ke konten
	</a>
<div class="flex min-h-screen flex-col">
	<header class="border-b border-zinc-200 bg-white">
		<nav class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
			<a href="/" class="text-lg font-extrabold tracking-tight text-zinc-900">
				Kras<span class="text-teal-600">Course</span>
			</a>
			<div class="flex items-center gap-6 text-sm font-medium">
				<a href="/" class="text-zinc-600 transition-colors hover:text-teal-600">Beranda</a>
				<a href="/courses" class="text-zinc-600 transition-colors hover:text-teal-600">Kursus</a>
			</div>
		</nav>
	</header>

	<main id="konten" class="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
		{@render children()}
	</main>

	<footer class="border-t border-zinc-200 bg-white">
		<div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-xs text-zinc-500">
			<span>KrasCourse · belajar tanpa akun</span>
			<a href="/admin" class="transition-colors hover:text-teal-600">Admin</a>
		</div>
	</footer>
</div>
