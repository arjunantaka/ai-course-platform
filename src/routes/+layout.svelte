<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';

	let { children } = $props();

	const isHome = $derived(page.url.pathname === '/');
	const isCourses = $derived(page.url.pathname.startsWith('/courses'));
</script>

<a
	href="#konten"
	class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-teal-700 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
>
	Lewati ke konten
</a>

<div class="flex min-h-screen flex-col">
	<header class="border-b border-zinc-200 bg-white">
		<nav
			aria-label="Navigasi utama"
			class="mx-auto flex h-[62px] max-w-6xl items-center justify-between px-6 sm:px-7"
		>
			<a
				href="/"
				class="inline-flex min-h-[44px] items-center text-[17px] font-extrabold tracking-tight text-zinc-900"
			>
				Kras<span class="text-teal-700">Course</span>
			</a>
			<div class="flex items-center gap-6">
				<a
					href="/"
					aria-current={isHome ? 'page' : undefined}
					class="inline-flex min-h-[44px] items-center border-b-2 text-sm font-semibold transition-colors duration-150 {isHome
						? 'border-teal-700 text-teal-700'
						: 'border-transparent text-zinc-500 hover:text-teal-700'}"
				>
					Beranda
				</a>
				<a
					href="/courses"
					aria-current={isCourses ? 'page' : undefined}
					class="inline-flex min-h-[44px] items-center border-b-2 text-sm font-semibold transition-colors duration-150 {isCourses
						? 'border-teal-700 text-teal-700'
						: 'border-transparent text-zinc-500 hover:text-teal-700'}"
				>
					Kursus
				</a>
			</div>
		</nav>
	</header>

	<main id="konten" class="mx-auto w-full max-w-6xl flex-1 px-6 py-8 sm:px-7 md:py-10">
		{@render children()}
	</main>

	<footer class="border-t border-zinc-200 bg-white">
		<div
			class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 font-mono text-[11px] text-zinc-500 sm:px-7"
		>
			<span>KrasCourse · belajar tanpa akun</span>
			<a
				href="/admin"
				class="inline-flex min-h-[44px] min-w-[44px] items-center justify-center transition-colors duration-150 hover:text-teal-700"
			>
				Admin
			</a>
		</div>
	</footer>
</div>
