<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	let submitting = $state(false);

	const inputClass =
		'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20';
</script>

<svelte:head>
	<title>Kursus Baru · KrasCourse</title>
</svelte:head>

<h1 class="text-2xl font-extrabold tracking-tight">Kursus Baru</h1>
<p class="mt-1 max-w-2xl text-sm text-zinc-500">
	Masukkan topik dan poin pembelajaran. AI mengelompokkan poin menjadi modul, me-review
	dan memangkas yang kurang relevan, lalu menulis materi tiap lesson satu per satu dan
	membuat kuis tiap modul. Setelah selesai (status <em>draft</em>), Anda bisa meninjau
	dan mengedit sebelum diterbitkan.
</p>

<form
	method="POST"
	class="mt-8 max-w-2xl space-y-5"
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			submitting = false;
			await update();
		};
	}}
>
	<div>
		<label for="topic" class="mb-1 block text-sm font-medium text-zinc-700">Topik kursus</label>
		<textarea
			id="topic"
			name="topic"
			rows="3"
			required
			minlength="8"
			placeholder="cth: Dasar JavaScript untuk pengembangan web"
			class={inputClass}
		></textarea>
		<p class="mt-1 text-xs text-zinc-500">Minimal 8 karakter. Semakin spesifik, semakin fokus hasilnya.</p>
	</div>

	<div class="grid gap-5 sm:grid-cols-2">
		<div>
			<label for="level" class="mb-1 block text-sm font-medium text-zinc-700">Level</label>
			<select id="level" name="level" class={inputClass} value="beginner">
				<option value="beginner">Pemula</option>
				<option value="intermediate">Menengah</option>
				<option value="advanced">Lanjutan</option>
			</select>
		</div>
		<div>
			<label for="language" class="mb-1 block text-sm font-medium text-zinc-700">Bahasa konten</label>
			<input id="language" name="language" value="id" placeholder="id / en" class={inputClass} />
		</div>
	</div>

	<div>
		<label for="points" class="mb-1 block text-sm font-medium text-zinc-700">Poin pembelajaran</label>
		<textarea
			id="points"
			name="points"
			rows="8"
			required
			placeholder="cth: Memahami alur kerja CI/CD dan pipeline otomatis&#10;Mengelola infrastruktur sebagai kode dengan Terraform&#10;Menerapkan TDD dan BDD dalam pengembangan fitur&#10;Memantau sistem dengan metrik dan alerting"
			class={inputClass}
		></textarea>
		<p class="mt-1 text-xs text-zinc-500">
			Satu poin per baris, 5-30 poin. AI mengelompokkan poin menjadi modul (kategori skill),
			me-review dan memangkas yang kurang relevan, lalu menulis materi tiap lesson satu per
			satu. Daftar poin yang ditiadakan beserta alasannya tampil di halaman kursus setelah selesai.
		</p>
	</div>

	{#if form?.error}
		<p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{form.error}</p>
	{/if}

	<button
		type="submit"
		disabled={submitting}
		class="rounded-full bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
	>
		{submitting ? 'Membuat kursus…' : 'Generate kursus'}
	</button>
</form>
