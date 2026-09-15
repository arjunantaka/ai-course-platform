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
	<h1 class="text-2xl font-extrabold tracking-tight">Masuk Admin</h1>
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
			<label for="token" class="mb-1 block text-sm font-medium text-zinc-700">Token</label>
			<input
				id="token"
				name="token"
				type="password"
				required
				class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
			/>
		</div>

		{#if form?.wrong}
			<p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">Token salah.</p>
		{/if}

		<button
			type="submit"
			disabled={submitting}
			class="w-full rounded-full bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
		>
			{submitting ? 'Memeriksa…' : 'Masuk'}
		</button>
	</form>
</div>
