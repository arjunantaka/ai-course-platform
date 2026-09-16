<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Masuk Admin · KrasCourse</title>
</svelte:head>

<div class="mx-auto mt-16 max-w-sm">
	<h1 class="text-2xl font-extrabold tracking-tight text-zinc-900">Masuk Admin</h1>
	<p class="mt-1 text-sm text-zinc-500">Masukkan token admin KrasCourse untuk melanjutkan.</p>

	<form
		method="POST"
		class="mt-6 space-y-4"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				submitting = false;
				await update();
			};
		}}
	>
		<div>
			<label for="token" class="mb-1 block text-sm font-semibold text-zinc-700">Token</label>
			<input
				id="token"
				name="token"
				type="password"
				required
				class="w-full rounded-lg border border-zinc-300 bg-white min-h-[44px] px-3.5 text-sm focus:border-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-100"
			/>
		</div>

		{#if form?.wrong}
			<p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">Token salah.</p>
		{/if}

		<button
			type="submit"
			disabled={submitting}
			class="inline-flex w-full items-center justify-center rounded-lg bg-teal-700 min-h-[44px] px-5 text-sm font-bold text-white transition-colors hover:bg-teal-800 disabled:opacity-50"
		>
			{submitting ? 'Memeriksa…' : 'Masuk'}
		</button>
	</form>
</div>
